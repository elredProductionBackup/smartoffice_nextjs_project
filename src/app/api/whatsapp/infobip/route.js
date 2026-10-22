import crypto from "node:crypto";
import { after, NextResponse } from "next/server";
import { transcribe } from "@/utils/assistant/ai";
import { acceptMessage, handleText } from "@/utils/assistant/whatsappBot";

// Infobip WhatsApp webhook (the company reaches Meta through Infobip). Same bot as /api/whatsapp, different transport.
// Infobip forwards inbound messages to this URL; set it in Infobip as https://<host>/api/whatsapp/infobip?secret=<INFOBIP_WEBHOOK_SECRET>

// Vercel: keep the function alive for the after() work (OpenAI + backend calls)
export const maxDuration = 60;

const env = process.env;
const base = () => env.INFOBIP_BASE_URL.replace(/\/$/, "");
const authHeader = () => ({ Authorization: `App ${env.INFOBIP_API_KEY}` });

export async function POST(req) {
  // ponytail: shared secret in the URL; switch to Infobip's webhook auth (basic/HMAC) once someone with portal access sets it up
  const secret = new URL(req.url).searchParams.get("secret") || "";
  if (!env.INFOBIP_WEBHOOK_SECRET || !safeEqual(secret, env.INFOBIP_WEBHOOK_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { results = [] } = await req.json().catch(() => ({}));
  for (const raw of results) {
    // Infobip sends either the classic WhatsApp shape ({ from, message }) or the Messages API shape
    // (renderer MO_MESSAGES_API_JSON: { sender, content: [...] }); normalise both
    const msg = raw && { messageId: raw.messageId, from: raw.from ?? raw.sender, message: raw.message ?? raw.content?.[0] };
    if (!msg?.messageId || !msg.from || !acceptMessage(msg.messageId)) continue;
    const send = (body) => sendText(msg.from, body);
    // Answer Infobip right away; OpenAI + backend calls take a few seconds
    after(() =>
      // Blue ticks + "typing…" first, so the user sees the message was picked up while the reply is prepared
      Promise.all([markRead(msg.messageId), showTyping(msg.from)])
        .then(() => handleMessage(msg, send))
        .catch(async (err) => {
          console.error("Infobip WhatsApp handler error:", err);
          await send(err.message || "Something went wrong.").catch(() => {});
        })
    );
  }
  return NextResponse.json({ ok: true });
}

function safeEqual(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

async function handleMessage(msg, send) {
  const { type, text, url } = msg.message || {};
  // Testing on the shared production number: Infobip routes only messages that start with the keyword here
  const keyword = env.INFOBIP_KEYWORD ? new RegExp(`^${env.INFOBIP_KEYWORD}\\b[\\s:,-]*`, "i") : null;
  if (type === "TEXT") {
    const clean = (text || "").trim().replace(keyword ?? /^$/, "");
    if (!clean) return send(`Add a command after ${env.INFOBIP_KEYWORD}, e.g. "${env.INFOBIP_KEYWORD} show today".`);
    return handleText({ from: msg.from, text: clean, send });
  }
  if (!["AUDIO", "VOICE"].includes(type) || !url) return send("Send a text or a voice note.");

  const res = await fetch(url, { headers: authHeader() });
  if (!res.ok) throw new Error(`Couldn't download voice note (${res.status})`);
  const audio = await res.blob();
  const ext = (audio.type || "audio/ogg").split(";")[0].split("/")[1] || "ogg";
  const heard = await transcribe(audio, `voice.${ext}`);
  if (!heard) return send("Didn't catch that, try again.");
  return handleText({ from: msg.from, text: heard, prefix: `🎤 "${heard}"\n\n`, send });
}

// Never throws: a failed read receipt must not stop the reply
async function markRead(messageId) {
  try {
    const res = await fetch(`${base()}/whatsapp/1/senders/${env.INFOBIP_WHATSAPP_SENDER}/message/${encodeURIComponent(messageId)}/read`, {
      method: "POST",
      headers: authHeader(),
    });
    if (!res.ok) console.warn("Infobip mark-as-read failed:", res.status, await res.text());
  } catch (err) {
    console.warn("Infobip mark-as-read failed:", err);
  }
}

// "typing…" bubble; WhatsApp hides it when the reply arrives or after 25s. Never throws, like markRead.
async function showTyping(to) {
  try {
    const res = await fetch(`${base()}/whatsapp/1/events`, {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        events: [{ sender: env.INFOBIP_WHATSAPP_SENDER, destinations: [{ to }], content: { type: "TYPING_INDICATOR" } }],
      }),
    });
    if (!res.ok) console.warn("Infobip typing indicator failed:", res.status, await res.text());
  } catch (err) {
    console.warn("Infobip typing indicator failed:", err);
  }
}

async function sendText(to, body) {
  const res = await fetch(`${base()}/whatsapp/1/message/text`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ from: env.INFOBIP_WHATSAPP_SENDER, to, content: { text: body.slice(0, 4096) } }),
  });
  if (!res.ok) throw new Error(`Infobip API error ${res.status}: ${await res.text()}`);
}
