"use client";

import { useState } from "react";
import { FiUpload } from "react-icons/fi";
import NewExpensesPopup from "./UI/NewExpensesPopup";

const dummyFinanceItems = [
  {
    id: 1,
    status: "Approval pending",
    statusType: "approval",
    title: "Invoice Approval Request",
    description: "Stationary bill for office supplies and materials",
    time: "3d ago",
    timeType: "warning",
    user: {
      initials: "RK",
      name: "Rajesh Kumar",
      avatarColor: "bg-[#1A73E8]",
    },
  },
  {
    id: 2,
    status: "Approval pending",
    statusType: "approval",
    title: "Invoice Approval Request",
    description: "Travel expenses for Annual Conference 2026",
    time: "1d ago",
    timeType: "warning",
    user: {
      initials: "PS",
      name: "Priya Sharma",
      avatarColor: "bg-[#1A73E8]",
    },
  },
  {
    id: 3,
    status: "Payment pending",
    statusType: "payment",
    title: "Vendor Payment Required",
    description: "Office supplies and equipment",
    time: "5d ago",
    timeType: "danger",
    user: {
      initials: "OD",
      name: "Office Depot Inc.",
      avatarColor: "bg-[#0F9D58]",
    },
  },
  {
    id: 4,
    status: "Payment pending",
    statusType: "payment",
    title: "Reimbursement Pending",
    description: "Client meeting expenses at hotel",
    time: "2d ago",
    timeType: "danger",
    user: {
      initials: "RH",
      name: "The Ritz Hotel",
      avatarColor: "bg-[#0F9D58]",
    },
  },
];

export default function DashboardFinanceList() {
  const [showNewExpense, setShowNewExpense] = useState(false);

  return (
    <div className="flex flex-col mt-6 rounded-2xl bg-[#F2F7FF] px-6 py-6 min-h-[600px] max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <h3 className="text-[20px] font-bold text-[#333]">Finance</h3>
        <button
          type="button"
          className="text-[14px] font-semibold text-[#0B57D0] border border-[#0B57D0] px-3.5 py-1 rounded-full cursor-pointer bg-transparent hover:bg-[#0B57D0]/5 transition-colors"
        >
          View All
        </button>
      </div>

      {/* List */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {dummyFinanceItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-4 flex flex-col gap-2.5 border border-[#E8ECEF] shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          >
            {/* Status & Time */}
            <div className="flex justify-between items-center">
              <span
                className={`px-2 py-0.5 text-[12px] font-semibold rounded-[6px] ${
                  item.statusType === "approval"
                    ? "bg-[#E8F0FE] text-[#1A73E8]"
                    : "bg-[#F3E8FF] text-[#681DA8]"
                }`}
              >
                {item.status}
              </span>
              <span
                className={`px-2 py-0.5 text-[12px] font-semibold rounded-[6px] ${
                  item.timeType === "warning"
                    ? "bg-[#FFEFE2] text-[#A64F05]"
                    : "bg-[#FCE8E6] text-[#C5221F]"
                }`}
              >
                {item.time}
              </span>
            </div>

            {/* Title & Description */}
            <div className="flex flex-col gap-0.5">
              <h4 className="text-[16px] font-bold text-[#1F1F1F] leading-snug">
                {item.title}
              </h4>
              <p className="text-[13px] text-[#5F6368] leading-normal font-medium">
                {item.description}
              </p>
            </div>

            {/* User Avatar & Name */}
            <div className="flex items-center gap-2 mt-0.5">
              <div
                className={`w-[28px] h-[28px] rounded-full flex items-center justify-center text-white text-[11px] font-bold ${item.user.avatarColor}`}
              >
                {item.user.initials}
              </div>
              <span className="text-[13px] font-semibold text-[#5F6368]">
                {item.user.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Horizontal Ray (Divider) */}
      <hr className="border-t border-[#D4DFF1] my-4 shrink-0" />

      {/* Upload Button */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={() => setShowNewExpense(true)}
          className="w-full flex items-center justify-center gap-2 bg-[#1A73E8] text-white font-bold py-3.5 px-6 rounded-[14px] cursor-pointer hover:bg-[#1557B0] transition-colors"
        >
          <FiUpload className="w-[18px] h-[18px]" />
          Upload an expense
        </button>
      </div>

      {/* NewExpensesPopup Modal */}
      {showNewExpense && (
        <NewExpensesPopup onClose={() => setShowNewExpense(false)} />
      )}
    </div>
  );
}


