import moment from "moment";

// Shared by the web widget and the WhatsApp webhook: the assistant only adds actionables.

export const ADMIN_ONLY = "Only admins can add actionables.";

const isDateOnly = (due) => moment(due, "YYYY-MM-DD", true).isValid();

/**
 * The model's `due` as the stamp the backend stores (same format changeDueDateTime sends).
 * "YYYY-MM-DD" = that day at the current UTC time, like the Actionable page's date picker;
 * an ISO date-time with offset ("2026-10-24T17:00:00+05:30") = that exact moment.
 */
export function toDueStamp(due) {
  if (!due) return "";
  const m = isDateOnly(due)
    ? moment.utc(`${due} ${moment.utc().format("HH:mm:ss")}`, "YYYY-MM-DD HH:mm:ss")
    : moment.parseZone(due, moment.ISO_8601, true);
  if (!m.isValid()) throw new Error(`Couldn't understand the date "${due}".`);
  return m.utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
}

/** Creates one actionable from the model's create_actionable call via `create(fields)`. Returns the reply text. */
export async function createFromCall({ args = {} }, create) {
  const title = args.title?.trim().slice(0, 1000);
  if (!title) throw new Error("Couldn't find a task in that message.");
  const dueDateTimeStamp = toDueStamp(args.due);
  await create({ title, notes: "", dueDateTimeStamp }); // everything the user said goes in the title, never notes
  return "Added ✅";
}
