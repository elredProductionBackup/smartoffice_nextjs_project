"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { FiMoreVertical } from "react-icons/fi";
import { ANCHORED_MENU_STYLE, useAnchoredMenu } from "@/hooks/useAnchoredMenu";

// Three-dot actions menu for a row. The menu is portalled to the body so the table can't clip it,
// and opens upwards when there's no room below.
// Items take { label, icon, onClick, danger?, disabled?, divider? }; divider draws a line above the item
export default function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const { triggerRef, menuRef } = useAnchoredMenu(open, setOpen, { align: "end" });

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-label="More actions"
        onClick={() => setOpen((v) => !v)}
        className={`w-9 h-9 rounded-full flex items-center justify-center text-[#475569] transition cursor-pointer ${
          open ? "bg-[#E3EDFD] text-[#0B57D0]" : "hover:bg-[#F1F5F9]"
        }`}
      >
        <FiMoreVertical className="text-[18px]" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={ANCHORED_MENU_STYLE}
            className="z-50 min-w-[180px] bg-white rounded-xl border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.12)] py-1.5 text-left"
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
          </div>,
          document.body
        )}
    </div>
  );
}
