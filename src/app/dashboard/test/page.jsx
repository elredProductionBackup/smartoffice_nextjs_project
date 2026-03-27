"use client";

import { useDispatch, useSelector } from "react-redux";
import { fetchCollaborators } from "@/store/actionable/actionableThunks";
import { useState, useRef, useEffect } from "react";
import moment from "moment";

const channels = [
  { id: 1, name: "general" },
  { id: 2, name: "development" },
  { id: 3, name: "design" },
];

export default function MentionInput() {
  const [isSelecting, setIsSelecting] = useState(false);
  const [hoveredUserId, setHoveredUserId] = useState(null);
  const [value, setValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [type, setType] = useState(null);
  const [filtered, setFiltered] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const textareaRef = useRef(null);
  const dispatch = useDispatch();

  const { collaboratorsList } = useSelector(
    (state) => state.actionable
  );

  const users = collaboratorsList.map((c) => ({
    id: c.userCode,
    name: c.name,
    avatar: c.dpURL,
  }));

  useEffect(() => {
    dispatch(fetchCollaborators({ search: "", offset: 0 }));
  }, [dispatch]);

  const getMatches = (trigger, q) => {
    const list = trigger === "@" ? users : channels;

    return list.filter((item) =>
      item.name.toLowerCase().includes(q.toLowerCase())
    );
  };

  const handleChange = (e) => {
    const text = e.target.value;
    setValue(text);

    const cursorPos = e.target.selectionStart;
    const textUntilCursor = text.slice(0, cursorPos);

    const match = textUntilCursor.match(/([@#])([\w\s]*)$/);

    if (match) {
      const trigger = match[1];
      const q = match[2];

      setType(trigger === "@" ? "user" : "channel");
      setFiltered(getMatches(trigger, q));
      setShowDropdown(true);
      setActiveIndex(0);
    } else {
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : prev
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) {
        handleSelect(filtered[activeIndex]);
      }
    }
  };

  const handleSelect = (item) => {
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;

    const textUntilCursor = value.slice(0, cursorPos);
    const match = textUntilCursor.match(/([@#])([\w\s]*)$/);

    if (!match) return;

    const start = cursorPos - match[0].length;
    const insertText = match[1] + item.name + " ";

    const newText =
      value.slice(0, start) + insertText + value.slice(cursorPos);

    const newCursorPos = start + insertText.length;

    setValue(newText);
    setShowDropdown(false);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  };



const parseDateTime = (text) => {
  const now = moment();

  // ✅ PRIORITY: combined date + time first
  const regex =
    /\b((\d{1,2}\s\w+\s\d{1,2}\s?(AM|PM))|((next\s)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s\d{1,2}\s?(AM|PM))|((next\s)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday))|(today|tomorrow)|(\d{1,2}:\d{2})|(\d{1,2}\s?(AM|PM)))\b/gi;

  const matches = [...text.matchAll(regex)];

  return matches.map((match) => {
    const raw = match[0].trim().toLowerCase();
    let parsed = null;

    // =============================
    // ✅ HANDLE "28 March 6 PM"
    // =============================
    parsed = moment(raw, ["D MMMM h A", "D MMM h A"], true);

    // =============================
    // ✅ HANDLE "Monday 5 PM"
    // =============================
    if (!parsed.isValid()) {
      parsed = moment(raw, ["dddd h A"], true);
      if (parsed.isValid() && parsed.isBefore(now)) {
        parsed.add(7, "days"); // next week
      }
    }

    // =============================
    // ✅ HANDLE "Monday"
    // =============================
    if (!parsed.isValid()) {
      const dayMatch = raw.match(
        /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/
      );

      if (dayMatch) {
        parsed = moment().day(dayMatch[0]);
        if (parsed.isBefore(now)) parsed.add(7, "days");
      }
    }

    // =============================
    // ✅ HANDLE TODAY / TOMORROW
    // =============================
    if (!parsed.isValid()) {
      if (raw === "today") parsed = moment();
      if (raw === "tomorrow") parsed = moment().add(1, "day");
    }

    // =============================
    // ✅ HANDLE TIME ONLY
    // =============================
    if (!parsed.isValid()) {
      parsed = moment(raw, ["h:mm", "h:mm A", "h A"], true);

      if (parsed.isValid()) {
        parsed.set({
          year: now.year(),
          month: now.month(),
          date: now.date(),
        });

        // if time passed → next day
        if (parsed.isBefore(now)) {
          parsed.add(1, "day");
        }
      }
    }

    // =============================
    // FINAL FALLBACK
    // =============================
    if (!parsed.isValid()) {
      parsed = moment(raw);
    }

    return {
      text: match[0],
      date: parsed.toDate(),
      isFuture: parsed.isValid() && parsed.isAfter(now),
      start: match.index,
      end: match.index + match[0].length,
    };
  });
};

const getStyledText = () => {
  const parts = value.split(/(@[^\s]+(?:\s[^\s]+)?)|(#\w+)/g);

  return parts.map((part, i) => {
    if (!part) return null;

    // =============================
    // ✅ USER MENTION (UNCHANGED)
    // =============================
    if (part.startsWith("@")) {
      const clean = part.slice(1).trim();

      const user = users.find(
        (u) =>
          clean === u.name ||
          clean.startsWith(u.name + " ")
      );

      if (user) {
        return (
          <span
            key={i}
            className="relative text-blue-500 font-medium pointer-events-auto"
          >
            <span
              onMouseEnter={() => setHoveredUserId(user.id)}
              onMouseLeave={() => setHoveredUserId(null)}
              className="inline-block"
            >
              @{user.name}
            </span>

            {hoveredUserId === user.id && (
              <div className="absolute bg-[#1f1f1f] text-white text-xs px-3 py-2 rounded-xl -top-14 left-0 z-50 shadow-xl min-w-[180px]">
                <div className="flex items-center gap-2">
                  <img
                    src={user.avatar || "/fallback.png"}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <div className="font-semibold">
                      {user.name}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </span>
        );
      }

      return <span key={i}>{part}</span>;
    }

    // =============================
    // ✅ CHANNEL (UNCHANGED)
    // =============================
    if (part.startsWith("#")) {
      const name = part.slice(1);

      const ch = channels.find(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      );

      if (ch) {
        return (
          <span key={i} className="text-green-500 font-medium">
            #{ch.name}
          </span>
        );
      }
    }

    // =============================
    // 🚀 DATE/TIME PARSING (NEW)
    // =============================

    const parsed = parseDateTime(part);

    if (!parsed.length) {
      return <span key={i}>{part}</span>;
    }

    let subParts = [];
    let lastIndex = 0;

    parsed.forEach(({ text, isFuture }, idx) => {
      const index = part.indexOf(text, lastIndex);
      if (index === -1) return;

      // normal text before match
      if (index > lastIndex) {
        subParts.push(part.slice(lastIndex, index));
      }

      // styled date/time
      subParts.push(
        <span
          key={`${i}-${idx}`}
          className={
            isFuture
              ? "underline decoration-gray-500 font-medium"
              : ""
          }
        >
          {text}
        </span>
      );

      lastIndex = index + text.length;
    });

    subParts.push(part.slice(lastIndex));

    return <span key={i}>{subParts}</span>;
  });
};

  return (
    <div className="w-full flex justify-center pt-20">
      <div className="w-full max-w-xl relative">

<textarea
  ref={textareaRef}
  value={value}
  onChange={handleChange}
  onKeyDown={handleKeyDown}
  placeholder="Type @ for users or # for channels..."
  className="w-full p-4 border border-black rounded-xl shadow-sm focus:outline-none bg-transparent relative z-10 text-transparent caret-black resize-none placeholder:text-gray-400 selection:bg-[#0002] selection:text-[#0002]
  
  whitespace-pre-wrap break-words
  leading-[1.5] tracking-normal
  [word-spacing:normal]
  [tab-size:4]
  "
  rows={4}
/>

<div
  className="absolute inset-0 p-4 z-20 pointer-events-none
  
  whitespace-pre-wrap break-words
  leading-[1.5] tracking-normal
  [word-spacing:normal]
  [tab-size:4]
  "
>
  {getStyledText()}
</div>

        {showDropdown && filtered.length > 0 && (
          <div className="border mt-2 rounded-xl shadow bg-white absolute z-30 w-full max-h-60 overflow-y-auto">
            {filtered.map((item, index) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className={`p-3 cursor-pointer flex items-center gap-2 ${index === activeIndex
                    ? "bg-gray-200"
                    : "hover:bg-gray-100"
                  }`}
              >
                {type === "user" && (
                  <img
                    src={item.avatar}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="font-medium">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}