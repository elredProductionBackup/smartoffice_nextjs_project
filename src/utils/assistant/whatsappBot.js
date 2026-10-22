// Server-only: WhatsApp conversation logic shared by the Meta (/api/whatsapp) and Twilio (/api/whatsapp/twilio) webhooks.
// The sender's phone is looked up in SmartOffice, then the bot acts as that user with a short-lived token.

import { interpret } from "./ai";
import { DESTRUCTIVE, allowedFor, confirmText, findActionables, needsTarget, runCall, toDueStamp } from "./commands";

const env = process.env;
const DEFAULT_TIMEZONE = "Asia/Kolkata";
const digits = (s = "") => s.replace(/\D/g, "");
const NOT_LINKED = "This number isn't linked to a SmartOffice account.";

/* ---------- Chat state: Upstash Redis (REST) when configured, else process memory ---------- */
// Serverless instances don't share memory, so "Reply YES" / "Which one?" need a shared store in production.
// Env names match the Vercel Marketplace Upstash integration (KV_*) or Upstash's own (UPSTASH_REDIS_REST_*).
const REDIS_URL = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
const SESSION_TTL = 60 * 60 * 24; // forget a chat after a day of silence
const SEEN_TTL = 60 * 60 * 24; // providers retry for well under a day

const memory = (globalThis.__waAssistant ??= { sessions: new Map(), seen: new Set() });

async function redis(...command) {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(command),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`Redis: ${data.error || res.status}`);
  return data.result;
}

// Redis down must not take the bot down: log and fall back to this instance's memory
async function withFallback(viaRedis, viaMemory) {
  if (!REDIS_URL || !REDIS_TOKEN) return viaMemory();
  try {
    return await viaRedis();
  } catch (err) {
    console.warn("Redis unavailable, using memory:", err.message);
    return viaMemory();
  }
}

/** False for duplicate deliveries (Meta, Twilio and Infobip retry). */
export const acceptMessage = (id) =>
  withFallback(
    async () => (await redis("SET", `wa:seen:${id}`, "1", "NX", "EX", SEEN_TTL)) === "OK",
    () => {
      if (memory.seen.has(id)) return false;
      memory.seen.add(id);
      if (memory.seen.size > 1000) memory.seen.delete(memory.seen.values().next().value);
      return true;
    }
  );

const loadSession = (from) =>
  withFallback(
    async () => JSON.parse((await redis("GET", `wa:session:${from}`)) || "null"),
    () => memory.sessions.get(from)
  );

const saveSession = (from, session) =>
  withFallback(
    () => redis("SET", `wa:session:${from}`, JSON.stringify(session), "EX", SESSION_TTL),
    () => memory.sessions.set(from, session)
  );

/* ---------- Who is writing: service APIs ---------- */
const serviceHeaders = () => ({ [env.SMARTOFFICE_SERVICE_HEADER || "X-Service-Key"]: env.SMARTOFFICE_SERVICE_KEY });

/** SmartOffice user for this WhatsApp number, or null if none. Phone is sent as +<country code><number>. */
async function lookupUser(from) {
  const res = await rawBackend("GET", "/smartOffice/whatsapp/user", { params: { phone: `+${digits(from)}` }, headers: serviceHeaders() });
  if (res.status === 404) return null;
  return expectOk(res).result?.[0] ?? null;
}

async function mintToken(userCode) {
  const res = await rawBackend("POST", "/smartOffice/service/userToken", { body: { userCode }, headers: serviceHeaders() });
  return expectOk(res).result?.[0];
}

/** Handles one user message and sends the reply through `send(text)`. */
export async function handleText({ from, text, prefix = "", send }) {
  const user = await lookupUser(from);
  if (!user) {
    console.warn("WhatsApp message from unlinked number:", from);
    return send(NOT_LINKED);
  }
  const auth = await mintToken(user.userCode);
  const isAdmin = auth?.userType?.toLowerCase() === "admin"; // same check as the Actionable page
  const timezone = user.timezone || DEFAULT_TIMEZONE;

  const session = (await loadSession(from)) ?? { history: [], pending: null };
  const ops = serverOps(user.networkClusterCode, auth.accessToken);
  // Every path ends here, after resolveAndRun may have set session.pending, so this is the one save point
  const reply = async (content) => {
    session.history = [...session.history, { role: "assistant", content }].slice(-10);
    await saveSession(from, session);
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
    if (item) return reply(await resolveAndRun(pending.call, item, ops, session, isAdmin));
  }

  session.history = [...session.history, { role: "user", content: text }].slice(-10);
  const result = await interpret({ messages: session.history, now: localNow(timezone), timezone });
  return reply(result.call ? await resolveAndRun(result.call, null, ops, session, isAdmin) : result.reply);
}

async function resolveAndRun(call, item, ops, session, isAdmin) {
  if (!allowedFor(call.name, isAdmin)) return "Only admins can change actionables. You can view them and add comments.";
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
    return `${await confirmText(call, item, ops)}\nReply YES to confirm or NO to cancel.`;
  }
  return safeRun(call, item, ops);
}

const safeRun = (call, item, ops) => runCall(call, item, ops).catch((err) => err.message);

const localNow = (timeZone) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

/* ---------- SmartOffice backend ---------- */
async function rawBackend(method, path, { params, body, headers } = {}) {
  const url = new URL(`${env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}${path}`);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v ?? ""));
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, ok: res.ok, data: await res.json().catch(() => ({})) };
}

function expectOk({ status, ok, data }) {
  if (!ok || data.success === false) throw new Error(data.message || `Backend error ${status}`);
  return data;
}

// Same payloads the actionable thunks send, as the user the token belongs to
const serverOps = (networkClusterCode, token) => {
  const backend = async (method, path, opts = {}) =>
    expectOk(await rawBackend(method, path, { ...opts, headers: { Authorization: `Bearer ${token}` } }));
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
    listComments: async (item) =>
      (
        await backend("GET", "/smartOffice/comments", {
          params: { networkClusterCode, actionableId: item.actionableId, start: 1, offset: 50, search: "" },
        })
      ).result?.[0]?.comments || [],
    removeComment: (item, c) =>
      backend("DELETE", "/smartOffice/deleteComment", { body: { commentId: c._id, actionableId: item.actionableId, networkClusterCode } }),
  };
};
