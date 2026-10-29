import crypto from "node:crypto";
import { after } from "next/server";
import { transcribe } from "@/utils/assistant/ai";
import { acceptMessage, handleText } from "@/utils/assistant/whatsappBot";

// Twilio WhatsApp webhook (sandbox for testing). Same bot as /api/whatsapp, different transport.

// Vercel: keep the function alive for the after() work (OpenAI + backend calls)
export const maxDuration = 60;

const env = process.env;
const FROM = env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886"; // Twilio sandbox number
const basicAuth = () => "Basic " + Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64");
const emptyTwiml = () => new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });

export async function POST(req) {
  const params = Object.fromEntries(new URLSearchParams(await req.text()));
  if (!validSignature(publicUrl(req), params, req.headers.get("x-twilio-signature"))) {
    return new Response("Invalid signature", { status: 401 });
  }
  if (!(await acceptMessage(params.MessageSid))) return emptyTwiml();

  const send = (body) => sendText(params.From, body);
  // Reply asynchronously; OpenAI + backend calls can exceed Twilio's 15s webhook timeout
  after(() =>
    handleMessage(params, send).catch(async (err) => {
      console.error("Twilio WhatsApp handler error:", err);
      await send(err.message || "Something went wrong.").catch(() => {});
    })
  );
  return emptyTwiml();
}

// Twilio signs the exact public URL it called (the ngrok/production URL, not localhost)
const publicUrl = (req) => {
  if (env.TWILIO_WEBHOOK_URL) return env.TWILIO_WEBHOOK_URL;
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  return `${proto}://${host}${url.pathname}${url.search}`;
};

function validSignature(url, params, header) {
  if (!env.TWILIO_AUTH_TOKEN || !header) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = crypto.createHmac("sha1", env.TWILIO_AUTH_TOKEN).update(data).digest("base64");
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function handleMessage(params, send) {
  const audioType = Number(params.NumMedia) > 0 && params.MediaContentType0?.startsWith("audio/") && params.MediaContentType0;
  if (!audioType) {
    if (!params.Body?.trim()) return send("Send a text or a voice note.");
    return handleText({ from: params.From, text: params.Body.trim(), send });
  }

  const res = await fetch(params.MediaUrl0, { headers: { Authorization: basicAuth() } });
  if (!res.ok) throw new Error(`Couldn't download voice note (${res.status})`);
  const text = await transcribe(await res.blob(), `voice.${audioType.split(";")[0].split("/")[1]}`);
  if (!text) return send("Didn't catch that, try again.");
  return handleText({ from: params.From, text, prefix: `TASK: "${text}"\n\n`, send });
}

async function sendText(to, body) {
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: { Authorization: basicAuth(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: FROM, To: to, Body: body.slice(0, 1600) }),
  });
  if (!res.ok) throw new Error(`Twilio API error ${res.status}: ${await res.text()}`);
}
