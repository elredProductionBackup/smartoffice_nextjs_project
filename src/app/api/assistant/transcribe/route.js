import { NextResponse } from "next/server";
import { transcribe } from "@/utils/assistant/ai";

const MAX_BYTES = 5 * 1024 * 1024; // ~60s of compressed audio is well under this

export async function POST(req) {
  // ponytail: only checks a token is present, same as the assistant route
  if (!req.headers.get("authorization")?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const audio = (await req.formData()).get("audio");
  if (!audio || typeof audio === "string") {
    return NextResponse.json({ error: "No audio received" }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ error: "Recording too long" }, { status: 413 });
  }

  try {
    return NextResponse.json({ text: await transcribe(audio, audio.name || "voice.webm") });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Transcription failed" }, { status: 502 });
  }
}
