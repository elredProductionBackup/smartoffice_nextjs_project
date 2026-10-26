// Pure helpers shared by the slice, the socket layer and the UI.
// REST sends full user objects, socket payloads sometimes only userCodes,
// so every topic, message and user goes through these before it reaches state.

const isObj = (x) => Boolean(x) && typeof x === "object" && !Array.isArray(x);

export const idOf = (x) => (isObj(x) ? x.messageId || x.replyId || x._id || x.id || null : null);
export const topicIdOf = (x) => (isObj(x) ? x.topicId || x._id || x.id || null : x || null);
export const codeOf = (u) => (typeof u === "string" ? u : isObj(u) ? u.userCode || null : null);
const eventIdOf = (e) => (typeof e === "string" ? e : isObj(e) ? e.eventId || e._id || "" : "");

/* ─── Users ─────────────────────────────────────────────── */

// Same rule as the User Management page: some firstnames already include the surname
const joinName = (first = "", last = "") => {
  const f = String(first).trim();
  const l = String(last).trim();
  return l && !f.toLowerCase().endsWith(l.toLowerCase()) ? `${f} ${l}` : f;
};

const toStatus = (u) => {
  if (u.isActivate === false) return "deactivated";
  const key = String(u.status || "").toLowerCase().trim();
  if (!key) return undefined;
  if (key === "active") return "active";
  if (key.includes("pending") || key.includes("invite")) return "invited";
  if (key.includes("deactiv") || key === "inactive") return "deactivated";
  return key;
};

// Only fields that are present are returned, so a thin payload (a message's `by`)
// never wipes richer data we already hold (portfolios from the admins list)
export function normalizeUser(u) {
  if (!isObj(u) || !u.userCode) return null;
  const out = { userCode: u.userCode };
  const first = u.firstname ?? u.firstName ?? "";
  const name = u.name || u.fullName || joinName(first, u.lastname ?? u.lastName);
  if (name) {
    out.name = name;
    out.firstname = String(first).trim().split(" ")[0] || name.split(" ")[0];
  }
  if (u.email !== undefined) out.email = u.email || "";
  if (u.phone !== undefined) out.phone = u.phone || "";
  if (u.dpURL !== undefined) out.dpURL = u.dpURL || "";
  const roles = u.roles || u.role;
  if (Array.isArray(roles)) out.roles = roles;
  if (Array.isArray(u.portfolios)) out.portfolios = u.portfolios;
  const status = toStatus(u);
  if (status) out.status = status;
  return out;
}

// Every user object found inside a topic or message payload
export function usersIn(x) {
  if (!isObj(x)) return [];
  const out = [];
  const add = (u) => isObj(u) && u.userCode && out.push(u);
  add(x.by);
  add(x.createdBy);
  add(x.from);
  if (isObj(x.ask)) {
    add(x.ask.to);
    add(x.ask.decidedBy);
  }
  if (Array.isArray(x.reactions)) x.reactions.forEach((r) => (r.people || []).forEach(add));
  if (Array.isArray(x.members)) x.members.forEach(add);
  if (Array.isArray(x.people)) x.people.forEach(add);
  if (isObj(x.lastMessage)) add(x.lastMessage.by);
  return out;
};

// Discussions accept admins, finance officers and portfolio officers only
const ADMIN_SIDE = ["admin", "financeOfficer", "portfolioOfficer", "learningOfficer"];
export const isAdminSide = (u) => (u?.roles || []).some((r) => ADMIN_SIDE.includes(r));

const ROLE_LABELS = {
  admin: "Admin",
  financeOfficer: "Finance Officer",
  portfolioOfficer: "Portfolio Officer",
  learningOfficer: "Portfolio Officer",
};
const humanize = (r) =>
  ROLE_LABELS[r] || String(r).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

const OBJECT_ID = /^[a-f0-9]{24}$/i;

// portfolioNames: budgetTypeId -> name, from the budget slice (portfolio ids are budget types)
export const roleLabel = (u, portfolioNames = {}) => {
  if (!u) return "";
  const roles = [...new Set((u.roles || []).map(humanize))].join(" & ");
  const portfolios = (u.portfolios || [])
    .map((p) =>
      typeof p === "string"
        ? portfolioNames[p] || (OBJECT_ID.test(p) ? "" : p)
        : p?.budgetType || p?.portfolioName || p?.name || portfolioNames[p?.budgetTypeId] || ""
    )
    .filter(Boolean);
  return portfolios.length ? `${roles} (${portfolios.join(", ")})` : roles;
};

// Which section of the people picker a person sits in
export const groupOf = (u) => {
  const roles = u?.roles || [];
  if (roles.includes("admin")) return "admins";
  if (roles.includes("financeOfficer")) return "finance";
  return "portfolio";
};

// adminDetail (from getNetworkClusterAdminDetail) carries the logged-in admin's userCode
const adminDetailOf = (auth) => {
  const d = auth?.adminDetail;
  if (!d) return null;
  if (Array.isArray(d)) return d[0] || null;
  if (d.result) return Array.isArray(d.result) ? d.result[0] : d.result;
  return d;
};
export const getMyUserCode = (auth) => adminDetailOf(auth)?.userCode || auth?.user?.userCode || null;
export const getMyEmail = (auth) =>
  (
    adminDetailOf(auth)?.email ||
    auth?.user?.email ||
    (typeof window !== "undefined" ? localStorage.getItem("userEmail") : "") ||
    ""
  ).toLowerCase();

/* ─── Messages ──────────────────────────────────────────── */

const ASK_STATUS = {
  pending: "pending",
  yes: "approved",
  approved: "approved",
  no: "declined",
  declined: "declined",
  rejected: "declined",
  cancelled: "cancelled",
  canceled: "cancelled",
};
export const askStatus = (s) => ASK_STATUS[String(s || "").toLowerCase()] || "pending";

// decisionReason holds the decline reason, or the cancel reason for a cancelled request
export function normalizeAsk(a) {
  if (!isObj(a)) return null;
  return {
    to: codeOf(a.to),
    amount: a.amount === "" || a.amount == null ? null : Number(a.amount),
    yesLabel: a.yesLabel || "Approve",
    noLabel: a.noLabel || "Decline",
    status: askStatus(a.status),
    decidedBy: codeOf(a.decidedBy),
    decidedAt: a.decidedAt || null,
    decisionReason: a.decisionReason || a.cancelReason || "",
    notify: Array.isArray(a.notify) ? a.notify : [],
  };
}

// Partial ask update from a socket event
export const askPatch = ({ status, decidedBy, decidedAt, decisionReason }) => ({
  ...(status !== undefined && { status: askStatus(status) }),
  ...(decidedBy !== undefined && { decidedBy: codeOf(decidedBy) }),
  ...(decidedAt !== undefined && { decidedAt }),
  ...(decisionReason !== undefined && { decisionReason: decisionReason || "" }),
});

export function normalizeReactions(reactions) {
  if (!Array.isArray(reactions)) return [];
  return reactions
    .map((r) => {
      const people = (r.people || []).map(codeOf).filter(Boolean);
      return { emoji: r.emoji, count: r.count ?? people.length, people };
    })
    .filter((r) => r.emoji && r.count > 0);
}

export function normalizeFiles(files) {
  return (Array.isArray(files) ? files : []).map((f) => ({
    name: f.name || "file",
    ext: String(f.ext || (f.name || "").split(".").pop() || "file").toLowerCase(),
    size: f.size ?? null, // "214 KB" from the API
    bytes: f.bytes ?? null,
    url: f.url || "",
  }));
}

// Merges onto the previous copy, so partial payloads never wipe known fields
export function normalizeMessage(m, prev = {}) {
  const has = (k) => m[k] !== undefined;
  return {
    ...prev,
    id: idOf(m) || prev.id,
    topicId: m.topicId || prev.topicId || null,
    parentId: has("parentMessageId") ? m.parentMessageId || null : prev.parentId || null,
    kind: m.kind || prev.kind || "message", // "message" | "note"
    noteKind: m.noteKind || prev.noteKind || null, // start | added | removed | renamed | left | decision | …
    people: has("people") ? (m.people || []).map(codeOf).filter(Boolean) : prev.people || [],
    label: has("label") ? m.label || "" : prev.label || "",
    createdAt: m.createdAt || prev.createdAt || null,
    by: codeOf(m.by) || prev.by || null,
    text: has("text") ? m.text || "" : prev.text || "",
    files: has("files") ? normalizeFiles(m.files) : prev.files || [],
    reactions: has("reactions") ? normalizeReactions(m.reactions) : prev.reactions || [],
    replyCount: has("replyCount") ? Number(m.replyCount) || 0 : prev.replyCount || 0,
    ask: has("ask") ? normalizeAsk(m.ask) : prev.ask || null,
    edited: has("edited") ? Boolean(m.edited) : prev.edited || false,
    editedAt: has("editedAt") ? m.editedAt || null : prev.editedAt || null,
    deleted: has("deleted") ? Boolean(m.deleted) : prev.deleted || false,
    pending: false,
    failed: false,
  };
}

// The line shown for a system note
export function noteText(m, usersMap, me) {
  const nameOf = (code) => (code === me ? "you" : usersMap[code]?.firstname || usersMap[code]?.name || "someone");
  const who = m.by === me ? "You" : usersMap[m.by]?.firstname || usersMap[m.by]?.name || "Someone";
  const others = m.people.filter((c) => c !== m.by).map(nameOf);
  const list = others.length > 1 ? `${others.slice(0, -1).join(", ")} and ${others.at(-1)}` : others[0] || "";
  switch (m.noteKind) {
    case "start":
      return `${who} started this topic`;
    case "added":
      return `${who} added ${list || "people"}`;
    case "removed":
      return `${who} removed ${list || "people"}`;
    case "renamed":
      return m.label ? `${who} renamed the topic to “${m.label}”` : `${who} renamed the topic`;
    case "left":
      return `${who} left the topic`;
    case "decision":
      return `${who} chose ${m.label || "an option"}`;
    case "cancelled":
    case "cancel":
      return `${who} cancelled the request`;
    default:
      return [who, m.label || m.text || m.noteKind].filter(Boolean).join(" ");
  }
}

// { failed: ["WhatsApp (no number)"], sent: ["Email"] } from a notifications object
const CHANNEL = { email: "Email", whatsapp: "WhatsApp" };
export function notifyResult(notifications) {
  const sent = [];
  const failed = [];
  Object.entries(notifications || {}).forEach(([key, v]) => {
    if (!v) return;
    const label = CHANNEL[key] || key;
    if (v.sent) sent.push(label);
    else failed.push(typeof v.error === "string" && v.error ? `${label} (${v.error})` : label);
  });
  return { sent, failed };
}

/* ─── Topics ────────────────────────────────────────────── */

// lastMessage in the topics list is { by, preview, at }; a local message has text/files/ask
export function normalizeLastMessage(lm) {
  if (!lm) return null;
  if (typeof lm === "string") return { text: lm, by: null, kind: "message" };
  return {
    text: lm.preview ?? lm.text ?? "",
    by: codeOf(lm.by),
    kind: lm.kind || "message",
    fileName: lm.files?.[0]?.name || "",
    amount: lm.ask?.amount ?? null,
    hasAsk: Boolean(lm.ask),
    deleted: Boolean(lm.deleted),
  };
}

export function normalizeTopic(t, prev = {}) {
  const has = (k) => t[k] !== undefined;
  const members = has("members") ? (t.members || []).map(codeOf).filter(Boolean) : prev.members || [];
  const eventId = has("event") ? eventIdOf(t.event) : prev.eventId || "";
  const eventName = has("eventName")
    ? t.eventName || ""
    : isObj(t.event)
      ? t.event.eventName || t.event.name || ""
      : eventId && eventId === prev.eventId
        ? prev.eventName || ""
        : "";
  return {
    ...prev,
    id: topicIdOf(t) || prev.id,
    title: has("title") ? t.title || "" : prev.title || "",
    eventId,
    eventName,
    members,
    memberCount: t.memberCount ?? (has("members") ? members.length : prev.memberCount ?? members.length),
    createdBy: codeOf(t.createdBy) || prev.createdBy || null,
    lastActivityAt: t.lastActivityAt || prev.lastActivityAt || t.createdAt || null,
    lastMessage: has("lastMessage") ? normalizeLastMessage(t.lastMessage) : prev.lastMessage || null,
    unread: t.unreadCount ?? prev.unread ?? 0,
    needsMyApproval: t.needsMyApproval ?? prev.needsMyApproval ?? false,
  };
}

export function previewText(lm, who) {
  if (!lm) return "No messages yet";
  if (lm.deleted) return "Message deleted";
  const body =
    lm.text ||
    (lm.hasAsk ? `Approval request${lm.amount ? ` · ${formatAmount(lm.amount)}` : ""}` : lm.fileName || "");
  if (lm.kind === "note" || !who) return body;
  return `${who}: ${body}`;
}

/* ─── Files (limits from the API) ───────────────────────── */

export const FILE_ACCEPT = ".png,.jpg,.jpeg,.webp,.pdf,.docx,.xls,.html,.htm";
const FILE_TYPES = new Set(["png", "jpg", "jpeg", "webp", "pdf", "docx", "xls", "html", "htm"]);
export const MAX_FILES = 10;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const isAllowedFile = (file) => FILE_TYPES.has((file.name.split(".").pop() || "").toLowerCase());

/* ─── Formatting ────────────────────────────────────────── */

export const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";

export const formatDay = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

export const formatListTime = (d) => {
  if (!d) return "";
  const day = formatDay(d);
  if (day === "Today") return formatTime(d);
  if (day === "Yesterday") return day;
  return new Date(d).toLocaleDateString([], { day: "numeric", month: "short" });
};

export const formatBytes = (bytes) => {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatAmount = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export const getInitials = (name = "") =>
  String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

// Same palette as the User Management page
const PALETTE = ["#1D72E8", "#EA580C", "#4F46E5", "#0E8FA8", "#DB2777", "#16A34A", "#7C3AED", "#0D9488", "#B45309", "#BE123C"];
export const colorFor = (key = "") => {
  let h = 0;
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
};

export const newTempId = () => `temp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
export const isTempId = (id) => String(id || "").startsWith("temp-");