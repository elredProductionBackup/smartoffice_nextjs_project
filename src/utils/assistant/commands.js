import moment from "moment";

// Shared by the web widget and the WhatsApp webhook. Each passes its own `ops`
// (Redux thunks in the browser, direct API calls on the server).

export const DESTRUCTIVE = new Set(["delete_actionable", "delete_subtask"]);
export const needsTarget = (name) => !["create_actionable", "list_actionables"].includes(name);

const norm = (s = "") => s.trim().toLowerCase();
const isDate = (d) => moment(d, "YYYY-MM-DD", true).isValid();

// Same stamp format changeDueDateTime sends
export const toDueStamp = (dueDate) =>
  moment
    .utc(`${dueDate} ${moment.utc().format("HH:mm:ss")}`, "YYYY-MM-DD HH:mm:ss")
    .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");

const onlyActionables = (list) => list.filter((i) => !i.category || i.category === "all");

/** Actionables matching the query; an exact title match wins over partial ones. */
export async function findActionables(query, ops) {
  // Backend moves completed items out of "all" into "past", so search both (same as fetchEventChecklist)
  const [all, past] = await Promise.all([ops.list("all", query), ops.list("past", query)]);
  const list = onlyActionables([...new Map([...all, ...past].map((i) => [i.actionableId, i])).values()]);
  const exact = list.filter((i) => norm(i.title) === norm(query));
  return exact.length ? exact : list;
}

const findSubtask = (item, q) => {
  const subs = item.subTask || [];
  const exact = subs.filter((s) => norm(s.title) === norm(q));
  const partial = subs.filter((s) => norm(s.title).includes(norm(q)));
  const hits = exact.length ? exact : partial;
  if (hits.length !== 1) {
    throw new Error(hits.length ? `Several subtasks match "${q}", be more specific.` : `No subtask matching "${q}" in "${item.title}".`);
  }
  return hits[0];
};

export const confirmText = ({ name, args }, item) =>
  `Delete ${name === "delete_subtask" ? `subtask "${args.subtaskQuery}" from "${item.title}"` : `"${item.title}"`}?`;

const errText = (err) => err?.message || (typeof err === "string" ? err : "Request failed");

/** Runs one assistant tool call against `ops`. Returns the reply text; throws on failure. */
export async function runCall({ name, args }, item, ops) {
  try {
    switch (name) {
      case "create_actionable": {
        if (!args.title?.trim()) throw new Error("Title is missing.");
        if (args.dueDate && !isDate(args.dueDate)) throw new Error(`Bad date "${args.dueDate}".`);
        await ops.create({
          title: args.title.trim().slice(0, 1000),
          notes: args.notes || "",
          dueDateTimeStamp: args.dueDate ? toDueStamp(args.dueDate) : "",
        });
        return `Created "${args.title.trim()}"${args.dueDate ? `, due ${moment(args.dueDate).format("DD MMM YYYY")}` : ""}.`;
      }

      case "list_actionables": {
        const filter = ["today", "past", "all"].includes(args.filter) ? args.filter : "today";
        const list = onlyActionables(await ops.list(filter, args.search || ""));
        if (!list.length) return `No ${filter === "all" ? "" : filter + " "}actionables.`;
        return list.map((i) => `${i.isCompleted ? "✓" : "•"} ${i.title}`).join("\n");
      }

      case "show_actionable": {
        const subs = item.subTask || [];
        return [
          `${item.isCompleted ? "✓" : "•"} ${item.title}`,
          item.dueDateTimeStamp && `Due: ${moment(item.dueDateTimeStamp).format("DD MMM YYYY, h:mm A")}`,
          item.notes && `Notes: ${item.notes}`,
          subs.length
            ? `Subtasks:\n${subs.map((s) => `  ${s.isCompleted ? "✓" : "•"} ${s.title}`).join("\n")}`
            : "No subtasks.",
        ]
          .filter(Boolean)
          .join("\n");
      }

      case "set_completed":
        await ops.setCompleted(item, !!args.completed);
        return `Marked "${item.title}" as ${args.completed ? "done" : "not done"}.`;

      case "reschedule_actionable":
        if (!isDate(args.dueDate)) throw new Error(`Bad date "${args.dueDate}".`);
        await ops.setDue(item, args.dueDate);
        return `Moved "${item.title}" to ${moment(args.dueDate).format("DD MMM YYYY")}.`;

      case "update_actionable": {
        if (!args.newTitle && args.notes === undefined) throw new Error("Nothing to change.");
        const title = args.newTitle?.trim() || item.title;
        await ops.update(item, { title, notes: args.notes ?? item.notes ?? "" });
        return `Updated "${title}".`;
      }

      case "delete_actionable":
        await ops.remove(item);
        return `Deleted "${item.title}".`;

      case "add_subtask":
        if (!args.subtaskTitle?.trim()) throw new Error("Subtask title is missing.");
        await ops.addSubtask(item, args.subtaskTitle.trim());
        return `Added subtask "${args.subtaskTitle.trim()}" to "${item.title}".`;

      case "set_subtask_completed": {
        const sub = findSubtask(item, args.subtaskQuery);
        await ops.setSubtaskCompleted(item, sub, !!args.completed);
        return `Marked subtask "${sub.title}" as ${args.completed ? "done" : "not done"}.`;
      }

      case "delete_subtask": {
        const sub = findSubtask(item, args.subtaskQuery);
        await ops.removeSubtask(item, sub);
        return `Deleted subtask "${sub.title}".`;
      }

      case "add_comment":
        if (!args.comment?.trim()) throw new Error("Comment is empty.");
        await ops.comment(item, args.comment.trim());
        return `Commented on "${item.title}".`;

      default:
        throw new Error("Unsupported command.");
    }
  } catch (err) {
    throw new Error(errText(err));
  }
}
