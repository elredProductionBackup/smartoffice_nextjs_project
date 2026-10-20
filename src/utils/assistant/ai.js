// Server-only: OpenAI calls shared by /api/assistant, /api/assistant/transcribe and /api/whatsapp.

const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";
const STT_MODEL = process.env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe";

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

  const system = `You help the user manage their "actionables" (to-do items) in SmartOffice.
Current local time: ${now} (${timezone}). Resolve relative dates ("tomorrow", "next Friday") against it.
Call exactly one tool when the user asks for an action.
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

/** Speech to text. `audio` is a Blob/File; `filename` extension tells OpenAI the format. */
export async function transcribe(audio, filename) {
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", STT_MODEL);
  form.append("language", "en");

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
