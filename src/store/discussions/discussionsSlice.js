// store/discussions/discussionsSlice.js
import { createSelector, createSlice } from "@reduxjs/toolkit";
import {
  cancelApproval,
  createTopic,
  decideApproval,
  discussionNotice,
  deleteMessage,
  deleteTopic,
  editMessage,
  fetchDiscussionPeople,
  fetchEventOptions,
  fetchMessages,
  fetchReplies,
  fetchTopicDetails,
  fetchTopics,
  leaveTopic,
  markTopicRead,
  removeFailedMessage,
  saveTopicMembers,
  sendMessage,
  sendReply,
  syncMessages,
  toggleReaction,
  updateTopic,
} from "./discussionsThunks";
import {
  askPatch,
  idOf,
  isAdminSide,
  normalizeAsk,
  normalizeMessage,
  normalizeReactions,
  normalizeTopic,
  normalizeUser,
  normalizeLastMessage,
  topicIdOf,
  usersIn,
} from "./discussionsUtils";

const initialState = {
  myUserCode: null,

  topicsMap: {},
  topicIds: [], // newest activity first
  topicsLoading: false,
  topicsFetched: false,
  activeTopicId: null,

  // Messages and replies share one map keyed by id; the lists below hold ids only
  messagesById: {},
  messageIds: {}, // topicId -> top-level ids, oldest first
  messagesLoading: {}, // topicId -> "initial" | "older" | false
  messagesError: {},
  messagesHasMore: {},
  messagesFetched: {},
  messagesSyncedAt: {}, // topicId -> time for ?since=

  replyIds: {}, // parentMessageId -> reply ids, oldest first
  repliesLoading: {},
  repliesFetched: {},
  thread: null, // { messageId, draft }

  usersMap: {}, // userCode -> user, filled from every payload
  people: [], // admins for the pickers
  peopleLoading: false,
  peopleFetched: false,

  eventOptions: [],
  eventOptionsLoading: false,
  eventOptionsRequestId: null, // older searches that land late are ignored

  online: {}, // topicId -> [userCode]
  typing: {}, // topicId -> { userCode: { name, parentId } }
  socketStatus: "idle", // idle | connecting | connected | disconnected | error

  lastError: null,
  notice: null,
};

/* ─── Draft helpers ─────────────────────────────────────── */

const absorbUsers = (state, list) => {
  list.forEach((raw) => {
    const user = normalizeUser(raw);
    if (user) state.usersMap[user.userCode] = { ...state.usersMap[user.userCode], ...user };
  });
};

const time = (iso) => (iso ? new Date(iso).getTime() : 0);

const sortIds = (state, ids) =>
  ids.sort((a, b) => time(state.messagesById[a]?.createdAt) - time(state.messagesById[b]?.createdAt));

const bumpReplyCount = (state, parentId, by) => {
  const parent = state.messagesById[parentId];
  if (parent) parent.replyCount = Math.max(0, (parent.replyCount || 0) + by);
};

// link=false stores the message without putting its id in a list
const upsertMessage = (state, raw, topicId, link = true) => {
  const id = idOf(raw);
  if (!id) return null;
  absorbUsers(state, usersIn(raw));
  const prev = state.messagesById[id];
  const msg = normalizeMessage({ topicId, ...raw }, prev);
  state.messagesById[id] = msg;
  if (link) {
    const list = msg.parentId ? state.replyIds[msg.parentId] : state.messageIds[msg.topicId];
    if (list && !list.includes(id)) {
      list.push(id);
      const before = state.messagesById[list[list.length - 2]];
      if (before && time(before.createdAt) > time(msg.createdAt)) sortIds(state, list);
    }
  }
  return { msg: state.messagesById[id], isNew: !prev };
};

// Top-level messages become a "deleted" placeholder; replies disappear
const applyDelete = (state, messageId, parentHint) => {
  const m = state.messagesById[messageId];
  const parentId = m?.parentId || parentHint || null;
  if (parentId) {
    const list = state.replyIds[parentId];
    const counted = m ? !m.deleted : !list; // never decrement twice (REST + socket)
    if (list) state.replyIds[parentId] = list.filter((id) => id !== messageId);
    if (counted) bumpReplyCount(state, parentId, -1);
    delete state.messagesById[messageId];
    return;
  }
  if (m) Object.assign(m, { deleted: true, text: "", files: [], ask: null, reactions: [] });
};

const sortTopics = (state) => {
  state.topicIds.sort((a, b) => time(state.topicsMap[b]?.lastActivityAt) - time(state.topicsMap[a]?.lastActivityAt));
};

const upsertTopic = (state, raw, sort = true) => {
  const id = topicIdOf(raw);
  if (!id) return null;
  absorbUsers(state, usersIn(raw));
  state.topicsMap[id] = normalizeTopic(raw, state.topicsMap[id]);
  if (!state.topicIds.includes(id)) state.topicIds.push(id);
  if (sort) sortTopics(state);
  return state.topicsMap[id];
};

const removeTopic = (state, topicId) => {
  (state.messageIds[topicId] || []).forEach((id) => {
    delete state.replyIds[id];
    delete state.messagesById[id];
  });
  ["topicsMap", "messageIds", "messagesLoading", "messagesError", "messagesHasMore", "messagesFetched", "messagesSyncedAt", "online", "typing"].forEach(
    (key) => delete state[key][topicId]
  );
  state.topicIds = state.topicIds.filter((id) => id !== topicId);
  if (state.activeTopicId === topicId) {
    state.activeTopicId = null; // the page opens the next topic
    state.thread = null;
  }
};

const touchTopic = (state, msg) => {
  const topic = msg && state.topicsMap[msg.topicId];
  if (!topic || msg.parentId || msg.kind === "note") return;
  if (time(msg.createdAt) >= time(topic.lastActivityAt)) {
    topic.lastActivityAt = msg.createdAt;
    topic.lastMessage = normalizeLastMessage(msg);
    sortTopics(state);
  }
};

const toggleMine = (state, { messageId, emoji }) => {
  const m = state.messagesById[messageId];
  const me = state.myUserCode;
  if (!m || !me) return;
  const r = m.reactions.find((x) => x.emoji === emoji);
  if (!r) m.reactions.push({ emoji, count: 1, people: [me] });
  else if (r.people.includes(me)) {
    r.people = r.people.filter((c) => c !== me);
    r.count -= 1;
    if (r.count <= 0) m.reactions = m.reactions.filter((x) => x.emoji !== emoji);
  } else {
    r.people.push(me);
    r.count += 1;
  }
};

/* ─── Optimistic sends ──────────────────────────────────── */

const addTemp = (state, { topicId, parentMessageId = null, tempId, createdAt, text = "", previews = [], ask }) => {
  const existing = state.messagesById[tempId];
  if (existing) {
    existing.pending = true; // retry
    existing.failed = false;
    return;
  }
  state.messagesById[tempId] = {
    id: tempId,
    tempId,
    topicId,
    parentId: parentMessageId,
    kind: "message",
    createdAt,
    by: state.myUserCode,
    text,
    files: previews,
    reactions: [],
    replyCount: 0,
    ask: ask ? normalizeAsk({ ...ask, status: "pending" }) : null,
    edited: false,
    editedAt: null,
    deleted: false,
    pending: true,
    failed: false,
  };
  if (parentMessageId) {
    state.replyIds[parentMessageId]?.push(tempId);
    bumpReplyCount(state, parentMessageId, 1);
  } else {
    if (!state.messageIds[topicId]) state.messageIds[topicId] = [];
    state.messageIds[topicId].push(tempId);
  }
};

// The socket may deliver the real message before the REST answer; never show it twice
const swapTemp = (state, { topicId, tempId, message }) => {
  const temp = state.messagesById[tempId];
  const parentId = temp?.parentId || message?.parentMessageId || null;
  const list = parentId ? state.replyIds[parentId] : state.messageIds[topicId];
  const realId = idOf(message);
  const alreadyThere = Boolean(realId && state.messagesById[realId]);
  const at = list ? list.indexOf(tempId) : -1;
  delete state.messagesById[tempId];

  if (!realId || alreadyThere) {
    if (at >= 0) list.splice(at, 1);
    if (parentId) bumpReplyCount(state, parentId, -1);
  } else {
    upsertMessage(state, { parentMessageId: parentId, ...message }, topicId, false);
    if (at >= 0) list[at] = realId;
    else list?.push(realId);
  }
  if (realId) touchTopic(state, state.messagesById[realId]);
};

const failTemp = (state, tempId) => {
  const m = state.messagesById[tempId];
  if (m) Object.assign(m, { pending: false, failed: true });
};

/* ─── Slice ─────────────────────────────────────────────── */

const discussionsSlice = createSlice({
  name: "discussions",
  initialState,
  reducers: {
    setMyUserCode(state, { payload }) {
      state.myUserCode = payload || null;
    },
    setActiveTopic(state, { payload }) {
      if (state.activeTopicId === payload) return;
      state.activeTopicId = payload;
      state.thread = null;
    },
    openThread(state, { payload }) {
      state.thread = { messageId: payload.messageId, draft: payload.draft || "" };
    },
    closeThread(state) {
      state.thread = null;
    },
    clearDiscussionError(state) {
      state.lastError = null;
    },
    setDiscussionNotice(state, { payload }) {
      state.notice = payload;
    },
    clearDiscussionNotice(state) {
      state.notice = null;
    },
    resetDiscussionsState: () => initialState,

    /* Socket events */
    socketStatusChanged(state, { payload }) {
      state.socketStatus = payload;
      if (payload !== "connected") {
        state.online = {};
        state.typing = {};
      }
    },
    // After a reconnect: closed topics reload when opened, the open one catches up with ?since=
    markMessagesStale(state) {
      Object.keys(state.messagesFetched).forEach((id) => {
        if (id !== state.activeTopicId) state.messagesFetched[id] = false;
      });
      state.repliesFetched = {};
    },
    messageReceived(state, { payload: { topicId, message, countUnread } }) {
      const res = upsertMessage(state, message, topicId);
      if (!res?.isNew || res.msg.parentId) return;
      touchTopic(state, res.msg);
      const topic = state.topicsMap[res.msg.topicId];
      if (!topic) return;
      if (countUnread && res.msg.by !== state.myUserCode && res.msg.kind !== "note") topic.unread += 1;
      if (res.msg.ask?.status === "pending" && res.msg.ask.to === state.myUserCode) topic.needsMyApproval = true;
    },
    replyReceived(state, { payload: { topicId, parentMessageId, reply } }) {
      const res = upsertMessage(state, { parentMessageId, ...reply }, topicId);
      if (res?.isNew && res.msg.kind !== "note") bumpReplyCount(state, parentMessageId, 1);
    },
    messageUpdated(state, { payload: { topicId, message } }) {
      upsertMessage(state, message, topicId);
    },
    messageDeleted(state, { payload: { messageId, parentMessageId } }) {
      applyDelete(state, messageId, parentMessageId);
    },
    reactionsUpdated(state, { payload: { messageId, reactions } }) {
      const m = state.messagesById[messageId];
      if (!m) return;
      absorbUsers(state, usersIn({ reactions }));
      m.reactions = normalizeReactions(reactions);
    },
    topicUpserted(state, { payload }) {
      upsertTopic(state, payload);
    },
    topicRemoved(state, { payload: topicId }) {
      removeTopic(state, topicId);
    },
    notesReceived(state, { payload: { topicId, notes } }) {
      (notes || []).forEach((n) => upsertMessage(state, { kind: "note", ...n }, topicId));
    },
    readUpdated(state, { payload: { topicId, lastReadAt } }) {
      const t = state.topicsMap[topicId];
      if (t && time(lastReadAt) >= time(t.lastActivityAt)) t.unread = 0;
    },
    approvalPatched(state, { payload: { messageId, ...patch } }) {
      const m = state.messagesById[messageId];
      if (m?.ask) m.ask = { ...m.ask, ...askPatch(patch) };
    },
    approvalRequested(state, { payload: { topicId } }) {
      const t = state.topicsMap[topicId];
      if (t) t.needsMyApproval = true;
    },
    presenceSet(state, { payload: { topicId, online } }) {
      state.online[topicId] = online || [];
    },
    presenceUpdated(state, { payload: { topicId, userCode, online } }) {
      const list = state.online[topicId] || [];
      state.online[topicId] = online ? [...new Set([...list, userCode])] : list.filter((c) => c !== userCode);
    },
    typingUpdated(state, { payload: { topicId, userCode, name, parentMessageId, isTyping } }) {
      if (!state.typing[topicId]) state.typing[topicId] = {};
      if (isTyping) state.typing[topicId][userCode] = { name: name || "", parentId: parentMessageId || null };
      else delete state.typing[topicId][userCode];
    },
  },

  extraReducers: (builder) => {
    builder
      /* Topics */
      .addCase(fetchTopics.pending, (state, { meta }) => {
        if (!meta.arg?.silent) state.topicsLoading = true;
      })
      .addCase(fetchTopics.fulfilled, (state, { payload }) => {
        state.topicsLoading = false;
        state.topicsFetched = true;
        if (payload.complete) {
          const keep = new Set(payload.list.map(topicIdOf));
          state.topicIds.filter((id) => !keep.has(id)).forEach((id) => removeTopic(state, id));
        }
        payload.list.forEach((t) => upsertTopic(state, t, false));
        sortTopics(state);
      })
      .addCase(fetchTopics.rejected, (state) => {
        state.topicsLoading = false;
        state.topicsFetched = true;
      })
      .addCase(fetchTopicDetails.fulfilled, (state, { payload }) => {
        if (payload.topic) upsertTopic(state, payload.topic);
      })
      .addCase(createTopic.fulfilled, (state, { payload }) => {
        if (payload.topic) upsertTopic(state, payload.topic);
      })
      .addCase(updateTopic.fulfilled, (state, { payload, meta }) => {
        upsertTopic(state, meta.arg); // keeps the event name we picked
        if (payload.topic) upsertTopic(state, payload.topic);
      })
      // The reply is only { added, removed }; details are reloaded by the thunk
      .addCase(saveTopicMembers.fulfilled, (state, { meta }) => {
        upsertTopic(state, { topicId: meta.arg.topicId, members: meta.arg.memberUserCodes });
      })
      .addCase(deleteTopic.fulfilled, (state, { meta }) => removeTopic(state, meta.arg.topicId))
      .addCase(leaveTopic.fulfilled, (state, { meta }) => removeTopic(state, meta.arg.topicId))
      .addCase(markTopicRead.pending, (state, { meta }) => {
        const t = state.topicsMap[meta.arg.topicId];
        if (t) t.unread = 0;
      })

      /* Messages */
      .addCase(fetchMessages.pending, (state, { meta }) => {
        const { topicId, older } = meta.arg;
        state.messagesLoading[topicId] = older ? "older" : "initial";
        state.messagesError[topicId] = null;
      })
      .addCase(fetchMessages.fulfilled, (state, { payload }) => {
        const { topicId, list, older, hasMore, syncedAt } = payload;
        state.messagesLoading[topicId] = false;
        state.messagesHasMore[topicId] = hasMore;
        const ids = list
          .filter((m) => !m.parentMessageId)
          .map((m) => upsertMessage(state, m, topicId, false)?.msg.id)
          .filter(Boolean);
        sortIds(state, ids);
        if (older) {
          const current = state.messageIds[topicId] || [];
          state.messageIds[topicId] = [...ids.filter((id) => !current.includes(id)), ...current];
        } else {
          // keep messages still being sent at the end
          const unsentIds = (state.messageIds[topicId] || []).filter((id) => state.messagesById[id]?.tempId);
          state.messageIds[topicId] = [...ids, ...unsentIds];
          state.messagesFetched[topicId] = true;
          state.messagesSyncedAt[topicId] = syncedAt;
        }
      })
      .addCase(fetchMessages.rejected, (state, { meta, payload }) => {
        state.messagesLoading[meta.arg.topicId] = false;
        if (!meta.arg.older) state.messagesError[meta.arg.topicId] = payload || "Could not load messages";
      })
      .addCase(syncMessages.fulfilled, (state, { payload }) => {
        const { topicId, list, syncedAt } = payload;
        if (!syncedAt) return;
        // Items may repeat; everything is matched by messageId
        const parentsInBatch = new Set(list.filter((m) => !m.parentMessageId).map(idOf));
        list.forEach((m) => {
          if (m.deleted && m.parentMessageId) return applyDelete(state, idOf(m), m.parentMessageId);
          const res = upsertMessage(state, m, topicId);
          if (!res?.isNew) return;
          if (!res.msg.parentId) touchTopic(state, res.msg);
          // A new reply whose parent did not come along with a fresh replyCount
          else if (res.msg.kind !== "note" && !parentsInBatch.has(res.msg.parentId)) bumpReplyCount(state, res.msg.parentId, 1);
        });
        state.messagesSyncedAt[topicId] = syncedAt;
      })
      .addCase(sendMessage.pending, (state, { meta }) => addTemp(state, meta.arg))
      .addCase(sendMessage.fulfilled, (state, { payload }) => swapTemp(state, payload))
      .addCase(sendMessage.rejected, (state, { meta }) => failTemp(state, meta.arg.tempId))
      .addCase(removeFailedMessage, (state, { payload: tempId }) => {
        const m = state.messagesById[tempId];
        if (!m) return;
        if (m.parentId) {
          if (state.replyIds[m.parentId]) state.replyIds[m.parentId] = state.replyIds[m.parentId].filter((id) => id !== tempId);
          bumpReplyCount(state, m.parentId, -1);
        } else if (state.messageIds[m.topicId]) {
          state.messageIds[m.topicId] = state.messageIds[m.topicId].filter((id) => id !== tempId);
        }
        delete state.messagesById[tempId];
      })
      .addCase(editMessage.pending, (state, { meta }) => {
        const m = state.messagesById[meta.arg.messageId];
        if (m) Object.assign(m, { text: meta.arg.text, edited: true });
      })
      .addCase(editMessage.fulfilled, (state, { payload }) => {
        if (idOf(payload.message)) upsertMessage(state, payload.message, payload.message.topicId);
      })
      .addCase(editMessage.rejected, (state, { meta }) => {
        const m = state.messagesById[meta.arg.messageId];
        if (m) Object.assign(m, { text: meta.arg.prevText, edited: meta.arg.prevEdited });
      })
      .addCase(deleteMessage.fulfilled, (state, { payload }) => applyDelete(state, payload.messageId, payload.parentId))

      /* Replies */
      .addCase(fetchReplies.pending, (state, { meta }) => {
        state.repliesLoading[meta.arg.messageId] = true;
      })
      .addCase(fetchReplies.fulfilled, (state, { payload }) => {
        const { messageId, list, parent, replyCount } = payload;
        const topicId = parent?.topicId || state.messagesById[messageId]?.topicId;
        if (parent) upsertMessage(state, parent, topicId);
        const ids = list
          .map((r) => upsertMessage(state, { parentMessageId: messageId, ...r }, topicId, false)?.msg.id)
          .filter(Boolean);
        sortIds(state, ids);
        const unsentIds = (state.replyIds[messageId] || []).filter((id) => state.messagesById[id]?.tempId);
        state.replyIds[messageId] = [...ids, ...unsentIds];
        state.repliesLoading[messageId] = false;
        state.repliesFetched[messageId] = true;
        // replyCount from the server leaves out notes; temp replies are added on top
        const counted = replyCount ?? ids.filter((id) => state.messagesById[id]?.kind !== "note").length;
        if (state.messagesById[messageId]) state.messagesById[messageId].replyCount = counted + unsentIds.length;
      })
      .addCase(fetchReplies.rejected, (state, { meta }) => {
        state.repliesLoading[meta.arg.messageId] = false;
      })
      .addCase(sendReply.pending, (state, { meta }) => addTemp(state, meta.arg))
      .addCase(sendReply.fulfilled, (state, { payload }) => swapTemp(state, payload))
      .addCase(sendReply.rejected, (state, { meta }) => failTemp(state, meta.arg.tempId))

      /* Reactions */
      .addCase(toggleReaction.pending, (state, { meta }) => toggleMine(state, meta.arg))
      .addCase(toggleReaction.fulfilled, (state, { payload }) => {
        const m = payload.message;
        if (idOf(m)) upsertMessage(state, m, m.topicId);
      })
      .addCase(toggleReaction.rejected, (state, { meta }) => toggleMine(state, meta.arg))

      /* Approvals: both answer with the updated message */
      .addCase(decideApproval.fulfilled, (state, { payload }) => {
        if (idOf(payload.message)) upsertMessage(state, payload.message, payload.message.topicId);
      })
      .addCase(cancelApproval.fulfilled, (state, { payload }) => {
        if (idOf(payload.message)) upsertMessage(state, payload.message, payload.message.topicId);
      })
      .addCase(discussionNotice, (state, { payload }) => {
        state.notice = payload;
      })

      /* Pickers */
      .addCase(fetchDiscussionPeople.pending, (state) => {
        state.peopleLoading = true;
      })
      .addCase(fetchDiscussionPeople.fulfilled, (state, { payload }) => {
        state.peopleLoading = false;
        state.peopleFetched = true;
        // Collaborators cannot join discussions, so only admin-side roles are kept
        state.people = payload.list
          .map(normalizeUser)
          .filter((p) => p && isAdminSide(p))
          .map((p) => ({ ...p, name: p.name || p.email || p.userCode, firstname: p.firstname || p.email || "" }));
        state.people.forEach((p) => {
          state.usersMap[p.userCode] = { ...state.usersMap[p.userCode], ...p };
        });
      })
      .addCase(fetchDiscussionPeople.rejected, (state) => {
        state.peopleLoading = false;
      })
      .addCase(fetchEventOptions.pending, (state, { meta }) => {
        state.eventOptionsLoading = true;
        state.eventOptionsRequestId = meta.requestId;
      })
      .addCase(fetchEventOptions.fulfilled, (state, { payload, meta }) => {
        if (state.eventOptionsRequestId !== meta.requestId) return;
        state.eventOptionsLoading = false;
        state.eventOptions = payload.list;
      })
      .addCase(fetchEventOptions.rejected, (state, { meta }) => {
        if (state.eventOptionsRequestId === meta.requestId) state.eventOptionsLoading = false;
      })

      // One place for errors: any discussions request that fails, unless it ran silently
      .addMatcher(
        (action) =>
          action.type.startsWith("discussions/") && action.type.endsWith("/rejected") && !action.meta?.arg?.silent,
        (state, action) => {
          state.lastError = action.payload || action.error?.message || "Something went wrong";
        }
      );
  },
});

export const {
  setMyUserCode,
  setActiveTopic,
  openThread,
  closeThread,
  clearDiscussionError,
  setDiscussionNotice,
  clearDiscussionNotice,
  resetDiscussionsState,
  socketStatusChanged,
  markMessagesStale,
  messageReceived,
  replyReceived,
  messageUpdated,
  messageDeleted,
  reactionsUpdated,
  topicUpserted,
  topicRemoved,
  notesReceived,
  readUpdated,
  approvalPatched,
  approvalRequested,
  presenceSet,
  presenceUpdated,
  typingUpdated,
} = discussionsSlice.actions;

/* ─── Selectors ─── */
export const selectTopicsList = createSelector(
  [(s) => s.discussions.topicIds, (s) => s.discussions.topicsMap],
  (ids, map) => ids.map((id) => map[id]).filter(Boolean)
);

export default discussionsSlice.reducer;