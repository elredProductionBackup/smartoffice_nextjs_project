// store/discussions/discussionsLive.js
// Live updates: turns socket events into slice actions, keeps topic rooms joined,
// and catches up with ?since= after a dropped connection. Also the composite
// "open a topic" and polling thunks the page uses.
import {
  connectDiscussionsSocket,
  disconnectDiscussionsSocket,
  emitWithAck,
  getAccessToken,
  getDiscussionsSocket,
} from "@/services/discussionsSocket";
import {
  approvalPatched,
  approvalRequested,
  markMessagesStale,
  messageDeleted,
  messageReceived,
  messageUpdated,
  notesReceived,
  presenceSet,
  presenceUpdated,
  reactionsUpdated,
  readUpdated,
  replyReceived,
  setActiveTopic,
  setDiscussionNotice,
  socketStatusChanged,
  topicRemoved,
  topicUpserted,
  typingUpdated,
} from "./discussionsSlice";
import {
  fetchMessages,
  fetchReplies,
  fetchTopicDetails,
  fetchTopics,
  markTopicRead,
  syncMessages,
} from "./discussionsThunks";
import { codeOf, topicIdOf } from "./discussionsUtils";

const joined = new Set(); // topic rooms this socket is in
const timers = new Map();
const later = (key, ms, fn) => {
  clearTimeout(timers.get(key));
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      fn();
    }, ms)
  );
};
const parse = (p) => {
  if (typeof p !== "string") return p || {};
  try {
    return JSON.parse(p);
  } catch {
    return {};
  }
};
const isVisible = () => typeof document === "undefined" || document.visibilityState === "visible";

/* ─── Rooms ─── */

const join = (dispatch, topicId) => {
  if (!topicId || joined.has(topicId)) return;
  joined.add(topicId);
  emitWithAck("topic:join", { topicId }).then((ack) => {
    if (ack?.success) dispatch(presenceSet({ topicId, online: ack.online || [] }));
    else joined.delete(topicId);
  });
};

// All of my topics, not only the open one, so the topic list updates live too
export const joinTopicRooms = (topicIds = []) => (dispatch) => {
  if (!getDiscussionsSocket()?.connected) return;
  topicIds.forEach((id) => join(dispatch, id));
};

export const leaveTopicRoom = (topicId) => () => {
  joined.delete(topicId);
  getDiscussionsSocket()?.emit("topic:leave", { topicId });
};

export const emitTyping = (topicId, isTyping, parentMessageId = null) => () => {
  const socket = getDiscussionsSocket();
  if (!socket?.connected || !joined.has(topicId)) return;
  socket.emit(isTyping ? "typing:start" : "typing:stop", {
    topicId,
    ...(parentMessageId && { parentMessageId }),
  });
};

/* ─── Connection ─── */

export const startDiscussionsSocket = () => (dispatch, getState) => {
  if (!getAccessToken()) return; // the page falls back to polling
  const { socket, created } = connectDiscussionsSocket();
  if (!created) return;

  const ds = () => getState().discussions;
  const watching = (topicId) => ds().activeTopicId === topicId && isVisible();
  const nameOf = (u) =>
    (u && typeof u === "object" ? u.firstname || u.name : ds().usersMap[u]?.firstname) || "Someone";
  const refreshTopicsSoon = () => later("topics", 800, () => dispatch(fetchTopics({ silent: true })));
  const readSoon = (topicId) =>
    later(`read:${topicId}`, 1500, () => {
      if (watching(topicId)) dispatch(markTopicRead({ topicId, silent: true }));
    });
  const on = (event, handler) => socket.on(event, (payload) => handler(parse(payload)));

  let connectedBefore = false;
  dispatch(socketStatusChanged("connecting"));

  socket.on("connect", () => {
    joined.clear(); // rooms are lost on every reconnect
    dispatch(socketStatusChanged("connected"));
    dispatch(joinTopicRooms(ds().topicIds));
    if (connectedBefore) {
      // Catch up on what happened while we were offline
      const { activeTopicId, thread } = ds();
      dispatch(markMessagesStale());
      dispatch(fetchTopics({ silent: true }));
      if (activeTopicId) dispatch(syncMessages({ topicId: activeTopicId, silent: true }));
      if (thread) dispatch(fetchReplies({ messageId: thread.messageId, silent: true }));
    }
    connectedBefore = true;
  });
  socket.on("disconnect", (reason) => {
    joined.clear();
    dispatch(socketStatusChanged("disconnected"));
    if (reason === "io server disconnect") socket.connect(); // server-side kick does not auto-retry
  });
  socket.on("connect_error", () => dispatch(socketStatusChanged("error")));

  /* Messages */
  on("message:new", ({ topicId, message }) => {
    const watch = watching(topicId);
    dispatch(messageReceived({ topicId, message, countUnread: !watch }));
    if (watch) readSoon(topicId);
  });
  on("reply:new", ({ topicId, parentMessageId, reply }) =>
    dispatch(replyReceived({ topicId, parentMessageId, reply }))
  );
  on("message:updated", ({ topicId, message }) => dispatch(messageUpdated({ topicId, message })));
  on("message:deleted", (p) => dispatch(messageDeleted(p)));
  on("reaction:updated", (p) => dispatch(reactionsUpdated(p)));

  /* Topics */
  on("topic:new", ({ topic }) => {
    dispatch(topicUpserted(topic));
    join(dispatch, topicIdOf(topic));
  });
  on("topic:updated", ({ topicId, change, topic, notes }) => {
    const me = ds().myUserCode;
    const removedMe = topic?.members && !topic.members.map(codeOf).includes(me);
    if (change === "deleted" || removedMe) {
      joined.delete(topicId);
      dispatch(topicRemoved(topicId));
      return;
    }
    const addedMe = !ds().topicsMap[topicId];
    if (topic) dispatch(topicUpserted({ topicId, ...topic }));
    if (notes?.length) dispatch(notesReceived({ topicId, notes }));
    if (addedMe) join(dispatch, topicId);
  });
  on("read:updated", (p) => dispatch(readUpdated(p)));

  /* Approvals */
  on("approval:requested", ({ topicId, from }) => {
    dispatch(approvalRequested({ topicId }));
    if (!watching(topicId)) dispatch(setDiscussionNotice(`${nameOf(from)} asked for your approval`));
  });
  on("approval:decided", ({ messageId, status, decidedBy, decisionReason }) => {
    dispatch(approvalPatched({ messageId, status, decidedBy, decisionReason, decidedAt: new Date().toISOString() }));
    refreshTopicsSoon();
  });
  on("approval:reminder", ({ topicId, from }) => {
    dispatch(approvalRequested({ topicId }));
    dispatch(setDiscussionNotice(`${nameOf(from)} reminded you about a pending approval`));
  });
  on("approval:cancelled", ({ messageId }) => {
    dispatch(approvalPatched({ messageId, status: "cancelled" }));
    refreshTopicsSoon();
  });

  /* Presence and typing */
  on("presence:update", (p) => dispatch(presenceUpdated(p)));
  on("typing", ({ topicId, parentMessageId, userCode, name, isTyping }) => {
    dispatch(typingUpdated({ topicId, parentMessageId, userCode, name, isTyping }));
    // The server stops typing after 5 s; clear it here too in case that event is lost
    if (isTyping) later(`typing:${topicId}:${userCode}`, 6000, () => dispatch(typingUpdated({ topicId, userCode, isTyping: false })));
  });
};

export const stopDiscussionsSocket = () => (dispatch) => {
  timers.forEach(clearTimeout);
  timers.clear();
  joined.clear();
  disconnectDiscussionsSocket();
  dispatch(socketStatusChanged("idle"));
};

/* ─── Composite actions for the page ─── */

export const openTopic = (topicId) => (dispatch, getState) => {
  dispatch(setActiveTopic(topicId));
  if (!topicId) return;
  const ds = getState().discussions;
  dispatch(fetchTopicDetails({ topicId, silent: true }));
  dispatch(ds.messagesFetched[topicId] ? syncMessages({ topicId, silent: true }) : fetchMessages({ topicId }));
  if (ds.topicsMap[topicId]?.unread) dispatch(markTopicRead({ topicId, silent: true }));
};

export const readActiveTopic = () => (dispatch, getState) => {
  const { activeTopicId, topicsMap } = getState().discussions;
  if (activeTopicId && topicsMap[activeTopicId]?.unread) dispatch(markTopicRead({ topicId: activeTopicId, silent: true }));
};

// Used only while the socket is down
export const pollDiscussions = () => (dispatch, getState) => {
  if (!isVisible()) return;
  const { activeTopicId, thread } = getState().discussions;
  dispatch(fetchTopics({ silent: true }));
  if (activeTopicId) dispatch(syncMessages({ topicId: activeTopicId, silent: true }));
  if (thread) dispatch(fetchReplies({ messageId: thread.messageId, silent: true }));
};