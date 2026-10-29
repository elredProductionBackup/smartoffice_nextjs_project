"use client";

import React from "react";
import { FiX } from "react-icons/fi";

export default function BreakdownPopup({ isOpen, onClose, event }) {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="bg-white rounded-[20px] shadow-[0px_8px_32px_rgba(0,0,0,0.12)] w-full md:w-[800px] max-h-[90dvh] md:h-[902px] max-w-[95vw] md:max-h-[95vh] flex flex-col p-5 md:p-8 relative animate-scaleUp">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4 md:mb-6 shrink-0">
          <h3 className="font-nunito font-bold text-[18px] md:text-[24px] text-[#1E293B] tracking-tight">
            Detailed Budget Breakdown
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 shrink-0 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B] transition-colors outline-none cursor-pointer border-0"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 min-h-0 md:flex-initial md:h-[620px] overflow-y-auto no-scrollbar flex flex-col gap-[10px] md:gap-[15px] mb-4 md:mb-6">
          {event.detailedBreakdown?.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 shrink-0 bg-[#F2F7FF] border-[0.8px] border-[#E2E8F0] rounded-sm px-3 py-3 md:px-5 md:py-4 hover:bg-[#F1F5F9] transition-colors"
            >
              <span className="font-nunito font-bold leading-[120%] md:leading-[100%] tracking-[-2%] text-[15px] md:text-[16px] text-[#333333] min-w-0 break-words">
                {index + 1}. {item.name}
              </span>
              <span
                className={`font-nunito font-bold text-[15px] md:text-[16px] leading-[100%] tracking-[-2%] shrink-0 ${item.amount > 0 ?"text-[#0B57D0]" : "text-[#94A3B8]"
                  }`}
              >
                ₹{item.amount.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>

        {/* Footer Summary / Actions */}
        <div className="border-t border-[#F1F5F9] shrink-0">
          <div className="flex items-center justify-between gap-3 mb-5 md:mb-8">
            <span className="font-nunito font-bold text-[16px] md:text-[24px] text-[#333333]">
              Total Estimated Cost:
            </span>
            <span className="font-nunito font-bold text-[20px] md:text-[26px] text-[#0B57D0] shrink-0">
              ₹{event.actualExpense?.toLocaleString("en-IN") || 0}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 md:gap-4">
            <button
              onClick={onClose}
              className="flex-1 md:flex-none md:w-[180px] h-[43px] flex items-center justify-center rounded-full bg-[#9E9E9E] hover:bg-[#8E8E8E] text-white font-nunito font-medium text-[18px] md:text-[20px] transition-colors border-0 outline-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert("Exporting budget breakdown...");
                onClose();
              }}
              className="flex-1 md:flex-none md:w-[180px] h-[43px] flex items-center justify-center rounded-full bg-gradient-to-r from-[#3a7cf5] to-[#0B57D0] hover:opacity-90 text-white font-nunito font-medium text-[18px] md:text-[20px] transition-all border-0 outline-none cursor-pointer shadow-[0px_4px_12px_rgba(11,87,208,0.2)]"
            >
              Export
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
