"use client";

import { useEffect, useRef, useState } from "react";
import { FiMoreVertical } from "react-icons/fi";

// Closes on outside click or Escape
function useDismiss(open, setOpen) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);
  return ref;
}

// Three-dot actions menu for a row; opens upwards near the bottom of the table.
// Items take { label, icon, onClick, danger?, disabled?, divider? }; divider draws a line above the item
export default function RowMenu({ items, openUp }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-label="More actions"
        onClick={() => setOpen((v) => !v)}
        className={`w-9 h-9 rounded-full flex items-center justify-center text-[#475569] transition cursor-pointer ${
          open ? "bg-[#E3EDFD] text-[#0B57D0]" : "hover:bg-[#F1F5F9]"
        }`}
      >
        <FiMoreVertical className="text-[18px]" />
      </button>

      {open && (
        <div
          className={`absolute right-0 z-20 min-w-[180px] bg-white rounded-xl border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.12)] py-1.5 text-left ${
            openUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {items.map(({ label, icon: Icon, danger, disabled, divider, onClick }) => (
            <div key={label}>
              {divider && <div className="my-1.5 mx-3 border-t border-[#E2E8F0]" />}
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onClick();
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[14px] font-semibold whitespace-nowrap transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                  danger ? "text-[#DC2626] hover:bg-[#FEF2F2]" : "text-[#1E293B] hover:bg-[#F8FAFC]"
                }`}
              >
                <Icon className="text-[16px]" />
                {label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
