// Server-only: WhatsApp conversation logic shared by the Meta (/api/whatsapp) and Twilio (/api/whatsapp/twilio) webhooks.
// ponytail: demo mode, one hard-coded user (WHATSAPP_TEST_*). Swap for a phone -> user lookup
// and a per-user service token once the backend provides them.

import { interpret } from "./ai";
import { DESTRUCTIVE, confirmText, findActionables, needsTarget, runCall, toDueStamp } from "./commands";

const env = process.env;
const TIMEZONE = env.WHATSAPP_TIMEZONE || "Asia/Kolkata";
const digits = (s = "") => s.replace(/\D/g, "");

// ponytail: in-memory chat state, lost on restart and not shared across instances; move to Redis/DB for production
const store = (globalThis.__waAssistant ??= { sessions: new Map(), seen: new Set() });

/** False for duplicates (providers retry deliveries) and for numbers other than the demo user. */
export function acceptMessage(id, from) {
  if (store.seen.has(id)) return false;
  store.seen.add(id);
  if (store.seen.size > 1000) store.seen.delete(store.seen.values().next().value);

  if (digits(from) !== digits(env.WHATSAPP_TEST_PHONE)) {
    console.warn("WhatsApp message from unlinked number ignored:", from);
    return false;
  }
  return true;
}

/** Handles one user message and sends the reply through `send(text)`. */
export async function handleText({ from, text, prefix = "", send }) {
  const session = store.sessions.get(from) ?? { history: [], pending: null };
  store.sessions.set(from, session);
  const ops = serverOps(env.WHATSAPP_TEST_CLUSTER);
  const reply = (content) => {
    session.history = [...session.history, { role: "assistant", content }].slice(-10);
    return send(prefix + content);
  };

  // Answer to an earlier "Which one?" or "Delete X?"
  const pending = session.pending;
  session.pending = null;
  if (pending?.confirm) {
    if (/^(yes|y|haan|ha|confirm)$/i.test(text)) return reply(await safeRun(pending.call, pending.item, ops));
    if (/^(no|n|nahi|cancel)$/i.test(text)) return reply("Cancelled.");
  }
  if (pending?.options && /^\d+$/.test(text)) {
    const item = pending.options[Number(text) - 1];
    if (item) return reply(await resolveAndRun(pending.call, item, ops, session));
  }

  session.history = [...session.history, { role: "user", content: text }].slice(-10);
  const result = await interpret({ messages: session.history, now: localNow(), timezone: TIMEZONE });
  return reply(result.call ? await resolveAndRun(result.call, null, ops, session) : result.reply);
}

async function resolveAndRun(call, item, ops, session) {
  if (needsTarget(call.name) && !item) {
    const matches = await findActionables(call.args.query || "", ops);
    if (!matches.length) return `No actionable matching "${call.args.query}".`;
    if (matches.length > 1) {
      session.pending = { call, options: matches.slice(0, 5) };
      return `Which one? Reply with the number:\n${session.pending.options.map((m, i) => `${i + 1}. ${m.title}`).join("\n")}`;
    }
    item = matches[0];
  }
  if (DESTRUCTIVE.has(call.name)) {
    session.pending = { call, item, confirm: true };
    return `${confirmText(call, item)}\nReply YES to confirm or NO to cancel.`;
  }
  return safeRun(call, item, ops);
}

const safeRun = (call, item, ops) => runCall(call, item, ops).catch((err) => err.message);

const localNow = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

/* ---------- SmartOffice backend, called as the demo user ---------- */
async function backend(method, path, { params, body } = {}) {
  const url = new URL(`${env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}${path}`);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v ?? ""));
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${env.WHATSAPP_TEST_TOKEN}`, "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("Login token expired. Update WHATSAPP_TEST_TOKEN in .env.local.");
  if (!res.ok || data.success === false) throw new Error(data.message || `Backend error ${res.status}`);
  return data;
}

// Same payloads the actionable thunks send
const serverOps = (networkClusterCode) => {
  const save = (body) => backend("PATCH", "/smartOffice/addActionable", { body: { networkClusterCode, ...body } });
  return {
    list: async (dueSearchKey, search) =>
      (
        await backend("GET", "/smartOffice/actionables", {
          params: { networkClusterCode, start: 1, offset: 10, search, dueSearchKey, eventId: "", category: "" },
        })
      ).result || [],
    create: (fields) => save({ actionableId: "", isCompleted: false, category: "all", linkedEvent: [], ...fields }),
    setCompleted: (item, isCompleted) => save({ actionableId: item.actionableId, isCompleted }),
    setDue: (item, dueDate) => save({ actionableId: item.actionableId, dueDateTimeStamp: toDueStamp(dueDate) }),
    update: (item, { title, notes }) =>
      save({ actionableId: item.actionableId, title, notes, collaborators: (item.collaborators || []).map((c) => c.userCode) }),
    remove: (item) =>
      backend("DELETE", "/smartOffice/deleteActionable", { body: { actionableId: item.actionableId, networkClusterCode } }),
    addSubtask: (item, title) =>
      backend("PATCH", "/smartOffice/addSubTask", { body: { _id: "", actionableId: item.actionableId, title, networkClusterCode } }),
    setSubtaskCompleted: (item, sub, isCompleted) =>
      backend("PATCH", "/smartOffice/addSubTask", {
        body: { _id: sub._id, actionableId: item.actionableId, title: sub.title, isCompleted, networkClusterCode },
      }),
    removeSubtask: (item, sub) =>
      backend("DELETE", "/smartOffice/deleteSubTask", { body: { _id: sub._id, actionableId: item.actionableId, networkClusterCode } }),
    comment: (item, comment) =>
      backend("PATCH", "/smartOffice/addComment", { body: { _id: "", comment, actionableId: item.actionableId, networkClusterCode } }),
  };
};
