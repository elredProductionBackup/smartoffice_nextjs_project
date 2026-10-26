"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

// badge: tinted background + soft border + text; dot/halo: the ringed status dot
export const ATTENDANCE = {
  none: {
    label: "Not marked",
    badge: "bg-[#EEF1F6] border-[#DCE2EB] text-[#475467]",
    dot: "bg-[#8A94A6]",
    halo: "bg-[#8A94A6]/25",
  },
  yes: {
    label: "Attended",
    badge: "bg-[#EEF7EA] border-[#D3E8CB] text-[#3B7A2A]",
    dot: "bg-[#5BA142]",
    halo: "bg-[#5BA142]/25",
  },
  no: {
    label: "Didn't attend",
    badge: "bg-[#FDEEEE] border-[#F6D2D2] text-[#B42318]",
    dot: "bg-[#E5484D]",
    halo: "bg-[#E5484D]/20",
  },
};

const KEYS = Object.keys(ATTENDANCE);

// Solid dot inside a soft ring of the same colour
export function StatusDot({ status }) {
  const s = ATTENDANCE[status] || ATTENDANCE.none;
  return (
    <span aria-hidden className={`grid place-items-center w-3.5 h-3.5 rounded-full shrink-0 ${s.halo}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
    </span>
  );
}

const badgeBase = "inline-flex items-center gap-2 h-8 px-2.5 rounded-lg border text-[13px] font-bold whitespace-nowrap";

// Read-only version, e.g. for finance managers
export function AttendanceBadge({ value = "none" }) {
  const s = ATTENDANCE[value] || ATTENDANCE.none;
  return (
    <span className={`${badgeBase} ${s.badge}`}>
      <StatusDot status={value} />
      {s.label}
    </span>
  );
}

// Status badge that opens a small menu; openUp for rows near the bottom of the table.
// The chevron only shows on hover/focus/open so the badge reads like a plain status at rest.
export default function AttendanceSelect({ value = "none", onChange, openUp }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const current = ATTENDANCE[value] || ATTENDANCE.none;

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openMenu = () => {
    setActive(Math.max(KEYS.indexOf(value), 0));
    setOpen(true);
  };

  const pick = (key) => {
    if (key !== value) onChange(key);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") setActive((i) => (i + 1) % KEYS.length);
    else if (e.key === "ArrowUp") setActive((i) => (i - 1 + KEYS.length) % KEYS.length);
    else if (e.key === "Enter" || e.key === " ") pick(KEYS[active]);
    else return;
    e.preventDefault();
  };

  return (
    <div ref={ref} className="relative inline-block" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Attendance: ${current.label}. Change`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`group ${badgeBase} pr-1.5 transition cursor-pointer hover:brightness-[0.97]
          focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#147BFF]/20 ${current.badge}`}
      >
        <StatusDot status={value} />
        {current.label}
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className={`shrink-0 transition-all duration-200 ${
            open ? "opacity-70 rotate-180" : "opacity-0 group-hover:opacity-70 group-focus-visible:opacity-70"
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Attendance"
          className={`absolute left-0 z-30 w-[200px] rounded-xl border border-[#F0F1F3] bg-white p-1.5 shadow-[0_8px_24px_rgba(17,17,17,0.10)] ${
            openUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {KEYS.map((key, i) => {
            const isSelected = key === value;
            return (
              <li
                key={key}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(key)}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] font-semibold cursor-pointer select-none transition-colors ${
                  i === active ? "bg-[#F7F8FA]" : ""
                } ${isSelected ? "text-[#147BFF]" : "text-[#111]"}`}
              >
                <StatusDot status={key} />
                <span className="flex-1">{ATTENDANCE[key].label}</span>
                {isSelected && <Check size={16} strokeWidth={2.5} className="text-[#147BFF]" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
