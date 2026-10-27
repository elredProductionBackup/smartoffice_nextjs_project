// store/discussions/discussionsThunks.js
import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "@/services/discussions.service";
import { getEventsList } from "@/services/events.service";
import { getAllNetworkClusterAdminDetails } from "@/services/auth.service";
import { idOf, isTempId, notifyResult } from "./discussionsUtils";

export const MESSAGES_PAGE = 50;
const TOPICS_PAGE = 100;
const SINCE_PAGE = 100;
const SINCE_SAFETY_MS = 60 * 1000; // ?since= may repeat items, so start a minute early

const errMsg = (err) => err?.response?.data?.message || err?.message || "Something went wrong";

// Axios accepts every status code here, so a failed call still resolves: check success
const unwrap = (res) => {
  const data = res?.data || {};
  if (data.success === false) throw new Error(data.message || "Request failed");
  return data;
};
const listOf = (data) => (Array.isArray(data.result) ? data.result : data.result ? [data.result] : []);
const one = (data) => (Array.isArray(data.result) ? data.result[0] : data.result) || null;
const clusterCode = (getState) =>
  getState().auth?.user?.networkClusterDetails?.networkClusterCode ||
  (typeof window !== "undefined" ? localStorage.getItem("networkClusterCode") : null);
const revoke = (previews = []) => previews.forEach((p) => p?.url?.startsWith("blob:") && URL.revokeObjectURL(p.url));
const sinceFrom = (startedAt) => new Date(startedAt - SINCE_SAFETY_MS).toISOString();

// Arguments of sends that have not succeeded yet (File objects stay out of Redux),
// so a failed message can be retried exactly as it was
const unsent = new Map();
export const removeFailedMessage = createAction("discussions/removeFailedMessage");
export const discussionNotice = createAction("discussions/notice");

/* ─── Topics ─────────────────────────────────────────────── */

export const fetchTopics = createAsyncThunk(
  "discussions/fetchTopics",
  async (_arg = {}, { rejectWithValue }) => {
    try {
      const data = unwrap(await api.getTopics({ filter: "all", start: 0, offset: TOPICS_PAGE }));
      const list = listOf(data);
      return { list, complete: list.length >= (data.totalCount ?? list.length) };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

export const fetchTopicDetails = createAsyncThunk(
  "discussions/fetchTopicDetails",
  async ({ topicId }, { rejectWithValue }) => {
    try {
      return { topic: one(unwrap(await api.getTopicDetails(topicId))) };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

// memberUserCodes: the other people; the caller is added by the server
export const createTopic = createAsyncThunk(
  "discussions/createTopic",
  async ({ title, event, memberUserCodes }, { rejectWithValue }) => {
    try {
      return { topic: one(unwrap(await api.createTopic({ title, event, memberUserCodes }))) };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

// event: an eventId, or "" to clear. eventName is only used to update the header right away.
export const updateTopic = createAsyncThunk(
  "discussions/updateTopic",
  async ({ topicId, title, event }, { rejectWithValue }) => {
    try {
      return { topic: one(unwrap(await api.updateTopic({ topicId, title, event }))) };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

// Answers only { added, removed }, so the members are reloaded afterwards
export const saveTopicMembers = createAsyncThunk(
  "discussions/saveTopicMembers",
  async ({ topicId, memberUserCodes }, { dispatch, rejectWithValue }) => {
    try {
      const result = one(unwrap(await api.updateTopicMembers({ topicId, memberUserCodes })));
      dispatch(fetchTopicDetails({ topicId, silent: true }));
      return { topicId, added: result?.added || [], removed: result?.removed || [] };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

// Refused while an approval in the topic is pending
export const deleteTopic = createAsyncThunk(
  "discussions/deleteTopic",
  async ({ topicId }, { rejectWithValue }) => {
    try {
      unwrap(await api.deleteTopic(topicId));
      return { topicId };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

// Refused while someone is waiting on your approval in the topic
export const leaveTopic = createAsyncThunk(
  "discussions/leaveTopic",
  async ({ topicId }, { rejectWithValue }) => {
    try {
      unwrap(await api.leaveTopic(topicId));
      return { topicId };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

// The unread badge clears optimistically (see the slice)
export const markTopicRead = createAsyncThunk(
  "discussions/markTopicRead",
  async ({ topicId }, { rejectWithValue }) => {
    try {
      unwrap(await api.markTopicRead(topicId));
      return { topicId };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

/* ─── Messages ───────────────────────────────────────────── */

// start 0 is the latest page. For older pages, start = how many we already hold:
// the server counts from the newest message, and new ones arriving live are in our count too.
export const fetchMessages = createAsyncThunk(
  "discussions/fetchMessages",
  async ({ topicId, older = false }, { getState, rejectWithValue }) => {
    const held = (getState().discussions.messageIds[topicId] || []).filter((id) => !isTempId(id)).length;
    const start = older ? held : 0;
    const startedAt = Date.now();
    try {
      const data = unwrap(await api.getMessages({ topicId, start, offset: MESSAGES_PAGE }));
      const list = listOf(data);
      return {
        topicId,
        older,
        list,
        hasMore: start + list.length < (data.totalCount ?? 0),
        syncedAt: sinceFrom(startedAt),
      };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  },
  { condition: ({ topicId }, { getState }) => !getState().discussions.messagesLoading[topicId] }
);

// Everything new or changed since the last look; keeps asking while hasMore says so
export const syncMessages = createAsyncThunk(
  "discussions/syncMessages",
  async ({ topicId }, { getState, dispatch, rejectWithValue }) => {
    let since = getState().discussions.messagesSyncedAt[topicId];
    if (!since) {
      dispatch(fetchMessages({ topicId }));
      return { topicId, list: [], syncedAt: null };
    }
    try {
      const list = [];
      for (let round = 0; round < 10; round += 1) {
        const data = unwrap(await api.getMessages({ topicId, since, offset: SINCE_PAGE }));
        list.push(...listOf(data));
        since = data.nextSince || since;
        if (!data.hasMore) break;
      }
      return { topicId, list, syncedAt: since };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  },
  { condition: ({ topicId }, { getState }) => !getState().discussions.messagesLoading[topicId] }
);

const deliveryNotice = (dispatch, notifications) => {
  const { failed } = notifyResult(notifications);
  if (failed.length) dispatch(discussionNotice(`Sent, but ${failed.join(" and ")} could not be delivered`));
};

// Shown at once as a temp message (pending), swapped for the saved one on success
export const sendMessage = createAsyncThunk(
  "discussions/sendMessage",
  async (arg, { dispatch, rejectWithValue }) => {
    const { topicId, tempId, text, files = [], ask, previews } = arg;
    unsent.set(tempId, arg);
    try {
      const message = one(unwrap(await api.sendMessage({ topicId, text, files, ask })));
      unsent.delete(tempId);
      revoke(previews);
      deliveryNotice(dispatch, message?.notifications);
      if (!idOf(message)) dispatch(syncMessages({ topicId, silent: true }));
      return { topicId, tempId, message };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

// Text only; files and the approval request cannot be edited
export const editMessage = createAsyncThunk(
  "discussions/editMessage",
  async ({ messageId, text, isReply = false }, { rejectWithValue }) => {
    try {
      const data = unwrap(
        await (isReply ? api.editReply({ replyId: messageId, text }) : api.editMessage({ messageId, text }))
      );
      return { message: one(data) };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

// parentId set means it is a reply. Messages with a pending approval are refused.
export const deleteMessage = createAsyncThunk(
  "discussions/deleteMessage",
  async ({ messageId, parentId = null }, { rejectWithValue }) => {
    try {
      unwrap(await (parentId ? api.deleteReply(messageId) : api.deleteMessage(messageId)));
      return { messageId, parentId };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

/* ─── Replies ────────────────────────────────────────────── */

// { parent, replyCount, result: replies and decision notes }
export const fetchReplies = createAsyncThunk(
  "discussions/fetchReplies",
  async ({ messageId }, { rejectWithValue }) => {
    try {
      const data = unwrap(await api.getReplies(messageId));
      return { messageId, list: listOf(data), parent: data.parent || null, replyCount: data.replyCount };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  },
  { condition: ({ messageId }, { getState }) => !getState().discussions.repliesLoading[messageId] }
);

export const sendReply = createAsyncThunk(
  "discussions/sendReply",
  async (arg, { rejectWithValue }) => {
    const { topicId, parentMessageId, tempId, text, files = [], previews } = arg;
    unsent.set(tempId, arg);
    try {
      const message = one(unwrap(await api.sendReply({ messageId: parentMessageId, text, files })));
      unsent.delete(tempId);
      revoke(previews);
      return { topicId, tempId, message };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

export const retrySend = (tempId) => (dispatch) => {
  const arg = unsent.get(tempId);
  if (!arg) return;
  dispatch(arg.parentMessageId ? sendReply(arg) : sendMessage(arg));
};

export const discardFailed = (tempId) => (dispatch) => {
  revoke(unsent.get(tempId)?.previews);
  unsent.delete(tempId);
  dispatch(removeFailedMessage(tempId));
};

/* ─── Reactions ──────────────────────────────────────────── */

// Toggled optimistically, then replaced by the server's copy of the message
export const toggleReaction = createAsyncThunk(
  "discussions/toggleReaction",
  async ({ messageId, emoji }, { rejectWithValue }) => {
    try {
      return { message: one(unwrap(await api.toggleReaction({ messageId, emoji }))) };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

/* ─── Approvals ──────────────────────────────────────────── */

// The server adds a note (and the reason) to the replies, so an open thread is reloaded
const afterApprovalChange = (dispatch, getState, messageId) => {
  dispatch(fetchTopics({ silent: true })); // refreshes "Needs my approval"
  if (getState().discussions.repliesFetched[messageId]) dispatch(fetchReplies({ messageId, silent: true }));
};

// decision "yes" | "no"; reason only goes with "no"
export const decideApproval = createAsyncThunk(
  "discussions/decideApproval",
  async ({ messageId, decision, reason }, { dispatch, getState, rejectWithValue }) => {
    try {
      const message = one(unwrap(await api.decideApproval({ messageId, decision, reason })));
      afterApprovalChange(dispatch, getState, messageId);
      return { message };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

export const cancelApproval = createAsyncThunk(
  "discussions/cancelApproval",
  async ({ messageId, reason }, { dispatch, getState, rejectWithValue }) => {
    try {
      const message = one(unwrap(await api.cancelApproval({ messageId, reason })));
      afterApprovalChange(dispatch, getState, messageId);
      return { message };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

// notificationType "email" | "whatsapp" | "both"
export const remindApprover = createAsyncThunk(
  "discussions/remindApprover",
  async ({ messageId, notificationType }, { dispatch, rejectWithValue }) => {
    try {
      const result = one(unwrap(await api.remindApprover({ messageId, notificationType })));
      const { sent, failed } = notifyResult(result?.notifications);
      const parts = [];
      if (sent.length) parts.push(`Reminder sent by ${sent.join(" and ")}`);
      if (failed.length) parts.push(`${failed.join(" and ")} could not be delivered`);
      dispatch(discussionNotice(parts.join(". ") || "Reminder sent"));
      return { messageId };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

/* ─── Pickers ────────────────────────────────────────────── */

// Same API as the User Management page
export const fetchDiscussionPeople = createAsyncThunk(
  "discussions/fetchDiscussionPeople",
  async (_arg, { getState, rejectWithValue }) => {
    try {
      const data = unwrap(await getAllNetworkClusterAdminDetails({ networkClusterCode: clusterCode(getState) }));
      const result = data.result;
      return { list: Array.isArray(result) ? result : result?.list || result?.users || [] };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  },
  {
    condition: (_arg, { getState }) => {
      const { peopleLoading, peopleFetched } = getState().discussions;
      return !peopleLoading && !peopleFetched;
    },
  }
);

// Same events API the Events page uses; only the latest search is kept (see the slice)
export const fetchEventOptions = createAsyncThunk(
  "discussions/fetchEventOptions",
  async ({ search = "" } = {}, { getState, rejectWithValue }) => {
    try {
      const data = unwrap(
        await getEventsList({ networkClusterCode: clusterCode(getState), start: 1, offset: 20, filterBy: "all", searchKey: search })
      );
      return { list: listOf(data).map((e) => ({ eventId: e.eventId, eventName: e.eventName })) };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);