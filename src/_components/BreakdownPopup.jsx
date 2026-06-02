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

      <div className="bg-white rounded-[20px] shadow-[0px_8px_32px_rgba(0,0,0,0.12)] w-[800px] h-[902px] max-w-[95vw] max-h-[95vh] flex flex-col p-8 relative animate-scaleUp">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-nunito font-bold text-[24px] text-[#1E293B] tracking-tight">
            Detailed Budget Breakdown
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B] transition-colors outline-none cursor-pointer border-0"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="h-[620px] overflow-y-auto no-scrollbar flex flex-col gap-[15px] mb-6">
          {event.detailedBreakdown?.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-[#F2F7FF] border-[0.8px] border-[#E2E8F0] rounded-sm px-5 py-4 hover:bg-[#F1F5F9] transition-colors"
            >
              <span className="font-nunito font-bold leading-[100%] tracking-[-2%] text-[16px] text-[#333333]">
                {index + 1}. {item.name}
              </span>
              <span
                className={`font-nunito font-bold text-[16px] leading-[100%] tracking-[-2%] ${item.amount > 0 ? "text-[#0B57D0]" : "text-[#94A3B8]"
                  }`}
              >
                ₹{item.amount.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>

        {/* Footer Summary / Actions */}
        <div className="border-t border-[#F1F5F9]">
          <div className="flex items-center justify-between mb-8">
            <span className="font-nunito font-bold text-[24px] text-[#333333]">
              Total Estimated Cost:
            </span>
            <span className="font-nunito font-bold text-[26px] text-[#0B57D0]">
              ₹{event.actualExpense?.toLocaleString("en-IN") || 0}
            </span>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onClose}
              className="w-[180px] h-[43px] flex items-center justify-center rounded-full bg-[#9E9E9E] hover:bg-[#8E8E8E] text-white font-nunito font-medium text-[20px] transition-colors border-0 outline-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert("Exporting budget breakdown...");
                onClose();
              }}
              className="w-[180px] h-[43px] flex items-center justify-center rounded-full bg-gradient-to-r from-[#3a7cf5] to-[#0B57D0] hover:opacity-90 text-white font-nunito font-medium text-[20px] transition-all border-0 outline-none cursor-pointer shadow-[0px_4px_12px_rgba(11,87,208,0.2)]"
            >
              Export
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
