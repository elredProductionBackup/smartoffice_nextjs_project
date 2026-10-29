import { NextResponse } from "next/server";
import { interpret } from "@/utils/assistant/ai";

// ponytail: no rate limit; add per-token limiting (e.g. upstash/redis) if the key gets abused
export async function POST(req) {
  // ponytail: only checks a token is present, backend has no verify endpoint for us to call
  if (!req.headers.get("authorization")?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await interpret(await req.json()));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Assistant unavailable" }, { status: 502 });
  }
}
