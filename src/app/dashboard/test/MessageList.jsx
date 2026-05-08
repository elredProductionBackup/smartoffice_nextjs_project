'use client';

import moment from "moment";
import { useState } from "react";
import * as chrono from "chrono-node";

// =========================
// 🔧 NORMALIZE TIME EXPRESSIONS
// =========================
const normalizeTimeText = (text) => {
  return text
    // 5.p.m / 5.p.m. / 5.pm / 5pm -> 5 PM
    .replace(
      /\b(\d{1,2})\s*\.?\s*p\.?\s*m\.?\b/gi,
      (_, hour) => `${hour} PM`
    )
    // 5 a.m / 5.am / 5a.m -> 5 AM
    .replace(
      /\b(\d{1,2})\s*\.?\s*a\.?\s*m\.?\b/gi,
      (_, hour) => `${hour} AM`
    )
    // 5pm / 5 am (no dot, no space)
    .replace(/\b(\d{1,2})(am|pm)\b/gi, (_, hour, meridiem) => {
      return `${hour} ${meridiem.toUpperCase()}`;
    });
};

// =========================
// 🧠 DATE PARSER (SAFE)
// =========================
const highlightFutureDates = (text) => {
  if (!text) return text;

  const now = moment();

  // =========================
  // 1. Protect mentions first
  // =========================
  const mentionMap = [];
  let safeText = text.replace(/@[^\s]+(?:\s[^\s]+)?/g, (match) => {
    const token = `__MENTION_${mentionMap.length}__`;
    mentionMap.push(match);
    return token;
  });

  // =========================
  // 2. Normalize time text
  // =========================
  safeText = normalizeTimeText(safeText);

  // =========================
  // 3. Parse dates
  // =========================
  const results = chrono.parse(safeText);

  if (!results.length) {
    // restore mentions
    return restoreMentions(safeText, mentionMap);
  }

  let output = safeText;
  let offset = 0;

  results
    .filter((r) => r.start?.date())
    .sort((a, b) => a.index - b.index)
    .forEach((res, i) => {
      const date = moment(res.start.date());
      if (!date.isValid() || date.isBefore(now)) return;

      const textMatch = res.text;

      const safeSpan = `
        <span 
          class="underline cursor-pointer decoration-gray-500 font-medium"
          data-time="${date.toISOString()}"
        >${textMatch}</span>
      `;

      const startIndex = res.index + offset;
      const endIndex = startIndex + textMatch.length;

      output =
        output.slice(0, startIndex) +
        safeSpan +
        output.slice(endIndex);

      offset += safeSpan.length - textMatch.length;
    });

  // =========================
  // 4. Restore mentions
  // =========================
  return restoreMentions(output, mentionMap);
};

// =========================
// restore @mentions safely
// =========================
const restoreMentions = (text, map) => {
  return text.replace(/__MENTION_(\d+)__/g, (_, i) => {
    return map[i] || "";
  });
};

// =========================
// COMPONENTS
// =========================
export default function MessageList({ messages, onHover }) {
  const [selectedTime, setSelectedTime] = useState(null);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);

  const addToGoogleCalendar = (isoTime) => {
    const start = moment(isoTime);
    const end = moment(start).add(1, "hour");

    const format = "YYYYMMDDTHHmmss";

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Meeting&dates=${start.format(format)}/${end.format(format)}&details=Created from chat&sf=true&output=xml`;

    window.open(url, "_blank");
  };

  const handleClick = (e) => {
    const el = e.target.closest("[data-time]");
    if (!el) return;

    const isoTime = el.getAttribute("data-time");

    setSelectedTime(isoTime);
    setShowCalendarPopup(true);
  };

  return (
    <div className="mt-6 space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          onMouseMove={onHover}
          onClick={handleClick}
          className="p-3  rounded-[8px] bg-[#F2F7FF]"
        >
          <div
            dangerouslySetInnerHTML={{
              __html: highlightFutureDates(msg.html),
            }}
          />
        </div>
      ))}

      {showCalendarPopup && (
        <div className="fixed bottom-6 right-6 bg-white shadow-xl rounded-xl p-4 border z-50">
          <div className="text-sm font-semibold mb-2">
            Add to Calendar?
          </div>

          <button
            onClick={() => {
              addToGoogleCalendar(selectedTime);
              setShowCalendarPopup(false);
            }}
            className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
          >
            Google Calendar
          </button>

          <button
            onClick={() => setShowCalendarPopup(false)}
            className="text-gray-500"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}