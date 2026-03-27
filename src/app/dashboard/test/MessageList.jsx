'use client';

import moment from "moment";
import { useState } from "react";
import * as chrono from "chrono-node";

// =========================
// 🧠 DATE PARSER (SAFE)
// =========================
const highlightFutureDates = (html) => {
  if (!html) return html;

  const now = moment();

  const results = chrono.parse(html);

  if (!results.length) return html;

  let output = html;

  // sort reverse to avoid index shifting issues
  results
    .filter(r => r.start?.date)
    .sort((a, b) => b.index - a.index)
    .forEach((res, i) => {
      const date = moment(res.start.date());

      if (!date.isValid()) return;
      if (date.isBefore(now)) return;

      const text = res.text;

      const safeSpan = `
        <span 
          class="underline cursor-pointer decoration-gray-500 font-medium"
          data-time="${date.toISOString()}"
          data-key="dt-${i}"
        >${text}</span>
      `;

      // replace only first occurrence from that index
      output =
        output.slice(0, res.index) +
        safeSpan +
        output.slice(res.index + text.length);
    });

  return output;
};

// =========================
// COMPONENT
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