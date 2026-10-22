"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, CircleCheck, CircleDashed, CircleX } from "lucide-react";

export const ATTENDANCE = {
  none: {
    label: "Not marked",
    icon: CircleDashed,
    pill: "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]",
    iconColor: "text-[#94A3B8]",
    dot: "bg-[#94A3B8]",
  },
  yes: {
    label: "Attended",
    icon: CircleCheck,
    pill: "bg-[#ECFDF3] text-[#15803D] border-[#BBF7D0] hover:border-[#86EFAC]",
    iconColor: "text-[#16A34A]",
    dot: "bg-[#16A34A]",
  },
  no: {
    label: "Didn't attend",
    icon: CircleX,
    pill: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA] hover:border-[#FCA5A5]",
    iconColor: "text-[#DC2626]",
    dot: "bg-[#DC2626]",
  },
};

const KEYS = Object.keys(ATTENDANCE);

// Status-coloured pill that opens a small menu; openUp for rows near the bottom of the table
export default function AttendanceSelect({ value = "none", onChange, openUp }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const current = ATTENDANCE[value] || ATTENDANCE.none;
  const Icon = current.icon;

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
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`inline-flex items-center gap-2 h-9 min-w-[156px] pl-3 pr-2.5 rounded-full border text-[14px] font-bold transition cursor-pointer
          focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0B57D0]/20 ${current.pill}`}
      >
        <Icon size={16} strokeWidth={2.25} className={current.iconColor} />
        <span className="flex-1 text-left whitespace-nowrap">{current.label}</span>
        <ChevronDown size={16} className={`shrink-0 opacity-70 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Attendance"
          className={`absolute left-0 z-30 w-[200px] rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.12)] ${
            openUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {KEYS.map((key, i) => {
            const opt = ATTENDANCE[key];
            const OptIcon = opt.icon;
            const isSelected = key === value;
            return (
              <li
                key={key}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(key)}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] font-semibold cursor-pointer select-none transition-colors ${
                  i === active ? "bg-[#F2F7FF]" : ""
                } ${isSelected ? "text-[#0B57D0]" : "text-[#1E293B]"}`}
              >
                <OptIcon size={17} strokeWidth={2.25} className={opt.iconColor} />
                <span className="flex-1">{opt.label}</span>
                {isSelected && <Check size={16} strokeWidth={2.5} className="text-[#0B57D0]" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
