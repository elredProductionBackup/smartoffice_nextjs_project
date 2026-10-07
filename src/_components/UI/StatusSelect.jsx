"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

// shadcn-style select: trigger button + popover list.
// options: [{ value, label, dotClassName }]
export default function StatusSelect({ value, onChange, options, placeholder = "Select status" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value);

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

  return (
    <div ref={ref} className="relative shrink-0 w-[160px]">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full h-9 flex items-center justify-between gap-2 rounded-md border bg-white px-3 text-[14px] shadow-xs transition-colors cursor-pointer
          focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0B57D0]/20 focus-visible:border-[#0B57D0]
          ${open ? "border-[#0B57D0] ring-[3px] ring-[#0B57D0]/20" : "border-[#E4E4E7] hover:bg-[#FAFAFA]"}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected && <span className={`h-2 w-2 rounded-full shrink-0 ${selected.dotClassName}`} />}
          <span className={`truncate ${selected ? "text-[#09090B] font-medium" : "text-[#71717A]"}`}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[#71717A] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-[calc(100%+4px)] z-20 w-full min-w-[160px] rounded-md border border-[#E4E4E7] bg-white p-1 shadow-md"
        >
          {options.map((o) => {
            const isSelected = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className="flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-[14px] text-[#09090B] cursor-pointer select-none hover:bg-[#F4F4F5]"
              >
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${o.dotClassName}`} />
                  {o.label}
                </span>
                {isSelected && <Check size={14} className="text-[#09090B]" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
