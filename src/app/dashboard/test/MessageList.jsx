'use client';
import moment from "moment";

// =========================
// 🧠 DATE PARSER
// =========================
const highlightFutureDates = (html) => {
  if (!html) return html;

  const now = moment();

  // 🔥 MASTER REGEX (covers everything)
  const regex =
    /\b((today|tomorrow)?\s*\d{1,2}(:\d{2})?\s?(am|pm)?|\d{1,2}(:\d{2})|\d{1,2}\s(?:Jan|Feb|Mar|March|April|May|Jun|July|Aug|Sep|Oct|Nov|Dec)\s?\d{0,2}(:\d{2})?\s?(am|pm)?)\b/gi;

  return html.replace(regex, (match) => {
    let parsed = null;
    const clean = match.trim().toLowerCase();

    // =========================
    // 🧠 DETECT CONTEXT
    // =========================
    const isTomorrow = clean.includes("tomorrow");
    const isToday = clean.includes("today");

    // extract time part
    const timeMatch = clean.match(/\d{1,2}(:\d{2})?\s?(am|pm)?/);

    if (!timeMatch) return match;

    let timeStr = timeMatch[0];

    // =========================
    // 🧠 NORMALIZE TIME
    // =========================

    // handle 24-hour (17:40)
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      parsed = moment(timeStr, "HH:mm");
    } else {
      parsed = moment(timeStr, ["h:mm A", "h:mmA", "h A", "hA"]);
    }

    if (!parsed.isValid()) return match;

    // =========================
    // 🧠 ATTACH DATE
    // =========================

    if (isTomorrow) {
      parsed.set({
        year: now.year(),
        month: now.month(),
        date: now.date() + 1,
      });
    } else {
      // today OR no keyword → assume today
      parsed.set({
        year: now.year(),
        month: now.month(),
        date: now.date(),
      });
    }

    // =========================
    // 🧠 DATE FORMAT CASE
    // =========================
    if (/\d{1,2}\s(?:jan|feb|mar|march|april|may|jun|july|aug|sep|oct|nov|dec)/i.test(clean)) {
      parsed = moment(clean, [
        "D MMMM h:mm A",
        "D MMM h:mm A",
        "D MMMM h:mmA",
        "D MMM h:mmA",
        "D MMMM",
        "D MMM",
      ]);
    }

    // ❌ invalid
    if (!parsed || !parsed.isValid()) return match;

    // ❌ past
    if (parsed.isBefore(now)) return match;

    // ✅ FUTURE → underline
    return `<span class="underline decoration-gray-500 font-medium">${match}</span>`;
  });
};

// =========================
// COMPONENT
// =========================
export default function MessageList({
  messages,
  onHover,
}) {
  return (
    <div className="mt-6 space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          onMouseMove={onHover}
          className="p-3 border rounded-xl bg-gray-50"
        >
          <div
            dangerouslySetInnerHTML={{
              __html: highlightFutureDates(msg.html),
            }}
          />
        </div>
      ))}
    </div>
  );
}