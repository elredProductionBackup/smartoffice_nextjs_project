import crypto from "node:crypto";
import { after, NextResponse } from "next/server";
import { transcribe } from "@/utils/assistant/ai";
import { acceptMessage, handleText } from "@/utils/assistant/whatsappBot";

// WhatsApp Cloud API (Meta) webhook for the actionable assistant.

const GRAPH = "https://graph.facebook.com/v25.0";
const env = process.env;

/* ---------- Meta webhook verification (GET) ---------- */
export async function GET(req) {
  const p = new URL(req.url).searchParams;
  if (p.get("hub.mode") === "subscribe" && env.WHATSAPP_VERIFY_TOKEN && p.get("hub.verify_token") === env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(p.get("hub.challenge"), { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/* ---------- Incoming messages (POST) ---------- */
export async function POST(req) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  // Status updates (sent/delivered/read) have no message
  const msg = JSON.parse(raw).entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg || !acceptMessage(msg.id, msg.from)) return NextResponse.json({ ok: true });

  const send = (body) => sendText(msg.from, body);
  // Answer Meta right away; OpenAI + backend calls can take longer than its timeout
  after(() =>
    handleMessage(msg, send).catch(async (err) => {
      console.error("WhatsApp handler error:", err);
      await send(err.message || "Something went wrong.").catch(() => {});
    })
  );
  return NextResponse.json({ ok: true });
}

function validSignature(raw, header) {
  if (!env.META_APP_SECRET || !header) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", env.META_APP_SECRET).update(raw).digest("hex");
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function handleMessage(msg, send) {
  if (msg.type === "text") return handleText({ from: msg.from, text: msg.text.body.trim(), send });
  if (msg.type !== "audio") return send("Send a text or a voice note.");

  const text = await transcribeVoiceNote(msg.audio.id);
  if (!text) return send("Didn't catch that, try again.");
  return handleText({ from: msg.from, text, prefix: `🎤 "${text}"\n\n`, send });
}

/* ---------- WhatsApp Graph API ---------- */
async function graph(path, init = {}) {
  const res = await fetch(path.startsWith("http") ? path : `${GRAPH}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, ...init.headers },
  });
  if (!res.ok) throw new Error(`WhatsApp API error ${res.status}: ${await res.text()}`);
  return res;
}

const sendText = (to, body) =>
  graph(`${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: body.slice(0, 4096) } }),
  });

async function transcribeVoiceNote(mediaId) {
  const { url, mime_type } = await (await graph(mediaId)).json();
  const audio = await (await graph(url)).blob();
  const ext = (mime_type || "audio/ogg").split(";")[0].split("/")[1];
  return transcribe(audio, `voice.${ext}`);
}
