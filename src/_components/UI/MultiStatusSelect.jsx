"use client";

import { useEffect, useRef, useState } from "react";
import { HiCheck, HiOutlineClipboardDocumentCheck } from "react-icons/hi2";

// Icon button that opens a menu with a checkbox per option; any number can be ticked.
// value: array of selected option values. options: [{ value, label, dotClassName }]
// The menu stays open while options are toggled; it closes on outside click or Escape.
// openUp: open above the button (for rows near the bottom of a list)
export default function MultiStatusSelect({ value = [], onChange, options, label = "Select options", openUp = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const count = options.filter((o) => value.includes(o.value)).length;

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleEscape = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // Keeps the selection in the same order as the options
  const toggle = (optionValue) => {
    const next = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : options.map((o) => o.value).filter((v) => v === optionValue || value.includes(v));
    onChange(next);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={count ? `${label} (${count} selected)` : label}
        title={label}
        onClick={() => setOpen((prev) => !prev)}
        className={`relative w-10 h-10 rounded-full flex items-center justify-center text-[#666666] transition-colors cursor-pointer
          focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0B57D0]/20
          ${open ? "bg-[#D4DFF1]" : "bg-[#E6EBF2] hover:bg-[#D4DFF1]"}`}
      >
        <HiOutlineClipboardDocumentCheck className="text-xl" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0B57D0] text-white text-[11px] font-semibold leading-[18px] text-center">
            {count}
          </span>
        )}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-multiselectable="true"
          className={`absolute right-0 z-20 w-max min-w-[260px] rounded-[20px] bg-white p-3 ${
            openUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
          style={{ boxShadow: "0px 4px 4px 0px #99999940" }}
        >
          {options.map((o) => {
            const isSelected = value.includes(o.value);
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => toggle(o.value)}
                className="flex items-center justify-between gap-4 rounded-[8px] px-2 py-2 text-[14px] text-[#333] cursor-pointer select-none hover:bg-[#F2F7FF]"
              >
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${o.dotClassName}`} />
                  {/* Ticked options are shown as done */}
                  <span className={`transition-colors ${isSelected ? "text-[#A1A1AA] line-through" : ""}`}>
                    {o.label}
                  </span>
                </span>
                <span
                  className={`h-4 w-4 shrink-0 rounded-[4px] border flex items-center justify-center transition-colors
                    ${isSelected ? "bg-[#0B57D0] border-[#0B57D0]" : "border-[#A1A1AA] bg-white"}`}
                >
                  {isSelected && <HiCheck className="text-[12px] text-white" strokeWidth={1.5} />}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
