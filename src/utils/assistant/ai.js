// Server-only: OpenAI calls shared by /api/assistant, /api/assistant/transcribe and /api/whatsapp.

const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";
// gpt-5 models reason before answering (~4s); extracting a title and date needs almost none (~1s)
const REASONING = MODEL.startsWith("gpt-5") ? { reasoning_effort: process.env.OPENAI_REASONING_EFFORT || "minimal" } : {};
const STT_MODEL = process.env.OPENAI_STT_MODEL || "gpt-4o-transcribe"; // full model: more accurate than mini, especially on Indian accents

// The assistant only adds actionables: one tool
const CREATE_TOOL = {
  type: "function",
  function: {
    name: "create_actionable",
    description: "Add one actionable to the user's to-do list",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "The whole task with every detail the user gave" },
        due: {
          type: "string",
          description:
            "Only when the user mentions a date or time. YYYY-MM-DD for a day only; YYYY-MM-DDTHH:mm:ss±HH:MM (the user's UTC offset) when a time is given.",
        },
      },
      required: ["title"],
      additionalProperties: false,
    },
  },
};

// Greetings go through a tool too, so tool_choice can be "required": with minimal reasoning the model
// otherwise sometimes writes the create call as plain text instead of calling it
const REPLY_TOOL = {
  type: "function",
  function: {
    name: "reply",
    description: "Only for a greeting or thanks with no task in it: a short reply",
    parameters: {
      type: "object",
      properties: { message: { type: "string" } },
      required: ["message"],
      additionalProperties: false,
    },
  },
};

const authHeader = () => {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
  return { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` };
};

/**
 * Turns one user message into a create_actionable call ({ call }) or, for a bare greeting, a short reply ({ reply }).
 * Each message stands alone: no chat history. `now` should include the UTC offset. Throws if OpenAI fails.
 */
export async function interpret({ text = "", now, timezone }) {
  const system = `Every message the user sends is a task to add to their actionables (to-do list) in Smart Networks.
Current local time: ${now} (${timezone}).
Always call create_actionable exactly once. Never ask questions. Never ask for a date or time.
title: the whole task in the user's own words, keeping every detail they gave. Drop only filler like "add a task", "remind me to", "please", and the date/time words.
due: only when the user mentions a date or time; resolve "tomorrow", "next Friday", "at 5" against the current local time. Otherwise leave it out.
Never invent a time: if the user names only a day, due is just YYYY-MM-DD.
If the message is only a greeting or thanks with no task in it, call reply with one short sentence instead.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      ...REASONING,
      messages: [
        { role: "system", content: system },
        { role: "user", content: String(text).slice(0, 2000) },
      ],
      tools: [CREATE_TOOL, REPLY_TOOL],
      tool_choice: "required",
      parallel_tool_calls: false,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("OpenAI error:", data?.error);
    throw new Error("Assistant unavailable");
  }

  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0]?.function;
  const args = JSON.parse(toolCall?.arguments || "{}");
  if (toolCall?.name === CREATE_TOOL.function.name) return { call: { name: toolCall.name, args } };
  return { reply: args.message || 'Send me a task to add, e.g. "Call vendor tomorrow at 5pm".' };
}

/** Speech to text. `audio` is a Blob/File; `filename` extension tells OpenAI the format. */
export async function transcribe(audio, filename) {
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", STT_MODEL);
  form.append("language", "en");
  form.append("prompt", "A short spoken to-do item in English, often with a day or time, e.g. \"Call Rahul tomorrow at 10am about the hotel booking.\"");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: authHeader(),
    body: form,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("OpenAI transcription error:", data?.error);
    throw new Error("Transcription failed");
  }
  return (data.text || "").trim();
}
