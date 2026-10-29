// Server-only: WhatsApp logic shared by the Infobip, Meta and Twilio webhooks.
// The sender's phone is looked up in Smart Networks, then every message is added as an actionable for that user.

import { interpretTask } from "./ai";
import { ADMIN_ONLY, createFromCall } from "./commands";

const env = process.env;
const DEFAULT_TIMEZONE = "Asia/Kolkata";
const digits = (s = "") => s.replace(/\D/g, "");
const NOT_LINKED = "This number isn't linked to a Smart Networks account.";

/* ---------- Duplicate deliveries: Upstash Redis (REST) when configured, else process memory ---------- */
// Serverless instances don't share memory, so dedupe needs a shared store in production.
// Env names match the Vercel Marketplace Upstash integration (KV_*) or Upstash's own (UPSTASH_REDIS_REST_*).
const REDIS_URL = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
const SEEN_TTL = 60 * 60 * 24; // providers retry for well under a day

const memory = (globalThis.__waAssistant ??= { seen: new Set() });

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

/** False for duplicate deliveries (Meta, Twilio and Infobip retry). Redis down falls back to memory. */
export async function acceptMessage(id) {
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      return (await redis("SET", `wa:seen:${id}`, "1", "NX", "EX", SEEN_TTL)) === "OK";
    } catch (err) {
      console.warn("Redis unavailable, using memory:", err.message);
    }
  }
  if (memory.seen.has(id)) return false;
  memory.seen.add(id);
  if (memory.seen.size > 1000) memory.seen.delete(memory.seen.values().next().value);
  return true;
}

/* ---------- Who is writing: service APIs ---------- */
const serviceHeaders = () => ({ [env.SMARTOFFICE_SERVICE_HEADER || "X-Service-Key"]: env.SMARTOFFICE_SERVICE_KEY });

/** Smart Networks user for this WhatsApp number, or null if none. Phone is sent as +<country code><number>. */
async function lookupUser(from) {
  const res = await backend("GET", "/smartOffice/whatsapp/user", { params: { phone: `+${digits(from)}` }, headers: serviceHeaders() });
  if (res.status === 404) return null;
  return expectOk(res).result?.[0] ?? null;
}

async function mintToken(userCode) {
  const res = await backend("POST", "/smartOffice/service/userToken", { body: { userCode }, headers: serviceHeaders() });
  return expectOk(res).result?.[0];
}

/** Adds the message as an actionable for the sender and sends the reply through `send(text)`. */
export async function handleText({ from, text, prefix = "", send }) {
  // Start the model (~1s) while the backend lookups run; backend stores no per-user timezone, so IST
  const interpreting = interpretTask({ text, now: localNow(DEFAULT_TIMEZONE), timezone: DEFAULT_TIMEZONE });
  interpreting.catch(() => {}); // awaited below; this only stops an unhandled rejection on the early returns

  const user = await lookupUser(from);
  if (!user) {
    console.warn("WhatsApp message from unlinked number:", from);
    return send(NOT_LINKED);
  }
  const auth = await mintToken(user.userCode);
  // Same rule as the Actionable page (canEditOrDelete = isAdmin)
  if (auth?.userType?.toLowerCase() !== "admin") return send(prefix + ADMIN_ONLY);

  const result = await interpreting;
  if (!result.call) return send(prefix + result.reply);

  const reply = await createFromCall(result.call, (fields) =>
    backend("PATCH", "/smartOffice/addActionable", {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      // Same payload the createActionable thunk sends
      body: { actionableId: "", networkClusterCode: user.networkClusterCode, isCompleted: false, category: "all", linkedEvent: [], ...fields },
    }).then(expectOk)
  ).catch((err) => err.message);
  return send(prefix + reply);
}

// e.g. "Friday, 2026-10-23, 15:20 GMT+05:30": the offset lets the model write due times in the user's zone
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
    timeZoneName: "longOffset",
  }).format(new Date());

/* ---------- Smart Networks backend ---------- */
async function backend(method, path, { params, body, headers } = {}) {
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
