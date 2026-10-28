// Server-only: OpenAI calls.
// interpret: full assistant for the web chat widget (/api/assistant).
// interpretTask: create-only, for the WhatsApp bot (/api/whatsapp/*).
// transcribe: voice to text for both.

const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";
const STT_MODEL = process.env.OPENAI_STT_MODEL || "gpt-4o-transcribe"; // full model: more accurate than mini, especially on Indian accents

const fn = (name, description, properties, required = Object.keys(properties)) => ({
  type: "function",
  function: {
    name,
    description,
    parameters: { type: "object", properties, required, additionalProperties: false },
  },
});

const query = { type: "string", description: "Words from the actionable's title, used to find it" };
const parentQuery = { type: "string", description: "Words from the PARENT actionable's title (not the subtask)" };
const date = { type: "string", description: "Due date as YYYY-MM-DD" };

const TOOLS = [
  fn("create_actionable", "Create a new actionable", { title: { type: "string" }, dueDate: date, notes: { type: "string" } }, ["title"]),
  fn("set_completed", "Mark an actionable done or not done", { query, completed: { type: "boolean" } }),
  fn("reschedule_actionable", "Change an actionable's due date", { query, dueDate: date }),
  fn("update_actionable", "Rename an actionable and/or replace its notes", { query, newTitle: { type: "string" }, notes: { type: "string" } }, ["query"]),
  fn("delete_actionable", "Delete an actionable", { query }),
  fn("add_subtask", 'Add a subtask to a parent actionable. "add subtask X to Y": subtaskTitle is X, query is Y', { query: parentQuery, subtaskTitle: { type: "string" } }),
  fn("set_subtask_completed", "Mark a subtask done or not done", { query: parentQuery, subtaskQuery: { type: "string" }, completed: { type: "boolean" } }),
  fn("delete_subtask", "Delete a subtask", { query: parentQuery, subtaskQuery: { type: "string" } }),
  fn("add_comment", "Add a comment to an actionable", { query, comment: { type: "string" } }),
  fn(
    "delete_comment",
    'Delete a comment from an actionable. Use "which" for "last/latest/newest" or "first/oldest" comment, else commentQuery',
    {
      query: parentQuery,
      commentQuery: { type: "string", description: "Words from the comment's text" },
      which: { type: "string", enum: ["latest", "oldest"] },
    },
    ["query"]
  ),
  fn("show_actionable", "Show one actionable's details: status, due date, notes and its subtasks", { query }),
  fn("list_actionables", "List actionable titles (no subtasks or details)", { filter: { type: "string", enum: ["today", "past", "all"] }, search: { type: "string" } }, ["filter"]),
];
const TOOL_NAMES = new Set(TOOLS.map((t) => t.function.name));

const authHeader = () => {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
  return { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` };
};

/** Turns chat history into one tool call ({ call }) or a text reply ({ reply }). Throws if OpenAI fails. */
export async function interpret({ messages = [], now, timezone }) {
  const history = messages
    .slice(-10)
    .filter((m) => ["user", "assistant"].includes(m.role) && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  const system = `You help the user manage their "actionables" (to-do items) in Smart Networks.
Current local time: ${now} (${timezone}). Resolve relative dates ("tomorrow", "next Friday") against it.
Call exactly one tool when the user asks for an action.
For deletes, call the tool directly: the app shows its own confirmation. Never ask the user to confirm yourself.
"query" holds only the words of the actionable's title, never the command verb or connecting words (for "delete review budget" or "under review budget add...", query is "review budget").
If the request is unclear, ask a short clarifying question without calling a tool.
If it is unrelated to actionables, say in one sentence that you only help with actionables.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: system }, ...history],
      tools: TOOLS,
      parallel_tool_calls: false,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("OpenAI error:", data?.error);
    throw new Error("Assistant unavailable");
  }

  const msg = data.choices?.[0]?.message;
  const toolCall = msg?.tool_calls?.[0]?.function;
  if (toolCall && TOOL_NAMES.has(toolCall.name)) {
    return { call: { name: toolCall.name, args: JSON.parse(toolCall.arguments || "{}") } };
  }
  return { reply: msg?.content || "Didn't get that, try rephrasing." };
}

/* ---------- WhatsApp bot: every message becomes one actionable ---------- */

// gpt-5 models reason before answering (~4s); extracting a title and date needs almost none (~1s)
const TASK_REASONING = MODEL.startsWith("gpt-5") ? { reasoning_effort: process.env.OPENAI_REASONING_EFFORT || "minimal" } : {};

const CREATE_TASK_TOOL = fn(
  "create_actionable",
  "Add one actionable to the user's to-do list",
  {
    title: { type: "string", description: "The whole task with every detail the user gave" },
    due: {
      type: "string",
      description:
        "Only when the user mentions a date or time. YYYY-MM-DD for a day only; YYYY-MM-DDTHH:mm:ss±HH:MM (the user's UTC offset) when a time is given.",
    },
  },
  ["title"]
);

// Greetings go through a tool too, so tool_choice can be "required": with minimal reasoning the model
// otherwise sometimes writes the create call as plain text instead of calling it
const REPLY_TOOL = fn("reply", "Only for a greeting or thanks with no task in it: a short reply", { message: { type: "string" } });

/**
 * Turns one WhatsApp message into a create_actionable call ({ call }) or, for a bare greeting, a short reply ({ reply }).
 * Each message stands alone: no chat history. `now` should include the UTC offset. Throws if OpenAI fails.
 */
export async function interpretTask({ text = "", now, timezone }) {
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
      ...TASK_REASONING,
      messages: [
        { role: "system", content: system },
        { role: "user", content: String(text).slice(0, 2000) },
      ],
      tools: [CREATE_TASK_TOOL, REPLY_TOOL],
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
  if (toolCall?.name === "create_actionable") return { call: { name: toolCall.name, args } };
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
