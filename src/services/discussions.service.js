// services/discussions.service.js — every Discussions REST call, with the field names from the API doc.
// Axios here accepts every status code, so callers check success === false themselves.
import api from "@/services/axios";

const BASE = "/smartOffice/discussions";
const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

// Plain fields as strings, `ask` as a JSON string, each file under its own "files" field.
// Empty values and empty files are left out entirely.
const toFormData = (fields = {}, files = []) => {
  const fd = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    fd.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  });
  files.filter((f) => f && f.size > 0).forEach((file) => fd.append("files", file));
  return fd;
};

/* ─── Topics ─── */

// { search, filter: "all" | "needsMyApproval", start (0-based), offset }
export const getTopics = (params) => api.get(`${BASE}/topics`, { params });

// event is an eventId; memberUserCodes are the other people (the caller is added automatically)
export const createTopic = ({ title, event, memberUserCodes }) =>
  api.post(`${BASE}/topics`, { title, ...(event && { event }), memberUserCodes });

export const getTopicDetails = (topicId) => api.get(`${BASE}/topics/details`, { params: { topicId } });

// Send only what changed; event "" clears it
export const updateTopic = ({ topicId, title, event }) =>
  api.patch(`${BASE}/topics`, {
    topicId,
    ...(title !== undefined && { title }),
    ...(event !== undefined && { event }),
  });

export const deleteTopic = (topicId) => api.delete(`${BASE}/topics`, { data: { topicId } });
export const leaveTopic = (topicId) => api.post(`${BASE}/topics/leave`, { topicId });

// The complete list; the caller always stays in
export const updateTopicMembers = ({ topicId, memberUserCodes }) =>
  api.patch(`${BASE}/topics/members`, { topicId, memberUserCodes });

export const markTopicRead = (topicId) => api.patch(`${BASE}/topics/read`, { topicId });

/* ─── Messages ─── */

// Page: { topicId, start, offset } (start 0 = latest page). Catch up: { topicId, since, offset }
export const getMessages = (params) => api.get(`${BASE}/messages`, { params });

// ask: { to, amount, yesLabel, noLabel, notify: ["email", "whatsapp"] }
export const sendMessage = ({ topicId, text, files = [], ask }) =>
  api.post(`${BASE}/messages`, toFormData({ topicId, text, ask }, files), MULTIPART);

export const editMessage = ({ messageId, text }) => api.patch(`${BASE}/messages`, { messageId, text });
export const deleteMessage = (messageId) => api.delete(`${BASE}/messages`, { data: { messageId } });

/* ─── Replies ─── */
export const getReplies = (messageId) => api.get(`${BASE}/replies`, { params: { messageId } });
export const sendReply = ({ messageId, text, files = [] }) =>
  api.post(`${BASE}/replies`, toFormData({ messageId, text }, files), MULTIPART);
export const editReply = ({ replyId, text }) => api.patch(`${BASE}/replies`, { replyId, text });
export const deleteReply = (replyId) => api.delete(`${BASE}/replies`, { data: { replyId } });

/* ─── Reactions ─── */
export const toggleReaction = ({ messageId, emoji }) => api.post(`${BASE}/reactions`, { messageId, emoji });

/* ─── Approvals ─── */

// decision "yes" | "no"; reason only with "no"
export const decideApproval = ({ messageId, decision, reason }) =>
  api.patch(`${BASE}/messages/decision`, { messageId, decision, ...(decision === "no" && reason && { reason }) });

export const cancelApproval = ({ messageId, reason }) =>
  api.post(`${BASE}/messages/approval-cancel`, { messageId, ...(reason && { reason }) });

// notificationType "email" | "whatsapp" | "both"
export const remindApprover = ({ messageId, notificationType }) =>
  api.post(`${BASE}/messages/approval-reminder`, { messageId, notificationType });