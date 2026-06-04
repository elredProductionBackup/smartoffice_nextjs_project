"use client";

import React from "react";
import {
  FiFileText,
  FiSend,
  FiDownload,
  FiDollarSign,
} from "react-icons/fi";

const SUMMARY_CARDS = [
  {
    label: "Total Expenses",
    value: "5",
    sublabel: "All time submissions",
    icon: FiFileText,
    iconBg: "bg-[#E8F0FE]",
    iconColor: "text-[#1A73E8]",
  },
  {
    label: "Pending Approval",
    value: "4",
    sublabel: "Awaiting review",
    icon: FiSend,
    iconBg: "bg-[#FFF4E5]",
    iconColor: "text-[#F59E0B]",
  },
  {
    label: "Total Amount",
    value: "₹1,10,000",
    sublabel: "Submitted this month",
    icon: FiDollarSign,
    iconBg: "bg-[#E6F4EA]",
    iconColor: "text-[#0F9D58]",
  },
];

const EXPENSES = [
  {
    id: 1,
    description: "Office supplies purchase",
    type: "General",
    event: "-",
    portfolio: "Operations",
    date: "2026-05-20",
    totalAmount: 1500,
    paid: 1500,
    balance: 0,
    vendor: "Office Depot Inc.",
    bill: "invoice_may_2026.pdf",
    paymentStatus: "Paid",
    status: "Pending Approval",
    canSend: true,
  },
  {
    id: 2,
    description: "Venue rental for conference",
    type: "Event Related",
    event: "Annual Conference 2026",
    portfolio: "Marketing",
    date: "2026-05-22",
    totalAmount: 75000,
    paid: 50000,
    balance: 25000,
    vendor: "Grand Ballroom Hotel",
    bill: "venue_booking_receipt.pdf",
    paymentStatus: "Pending",
    status: "Pending Approval",
    canSend: true,
  },
  {
    id: 3,
    description: "Catering services for speaker event",
    type: "Event Related",
    event: "How to Become a TEDx Speaker!",
    portfolio: "Marketing",
    date: "2026-05-23",
    totalAmount: 15000,
    paid: 15000,
    balance: 0,
    vendor: "Delicious Catering Co.",
    bill: "catering_invoice_may.pdf",
    paymentStatus: "Paid",
    status: "Approved",
    canSend: false,
  },
];

const TABLE_COLUMNS =
  "minmax(160px,1.6fr) minmax(90px,1fr) minmax(140px,1.4fr) minmax(100px,1fr) minmax(100px,0.9fr) minmax(110px,1fr) minmax(90px,0.9fr) minmax(90px,0.9fr) minmax(130px,1.2fr) minmax(160px,1.3fr) minmax(110px,1fr) minmax(130px,1.1fr) minmax(150px,1.2fr)";

function formatCurrency(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function StatusBadge({ children, variant }) {
  const styles = {
    paid: "bg-[#E6F4EA] text-[#137333]",
    pending: "bg-[#FEF7E0] text-[#B06000]",
    approved: "bg-[#E6F4EA] text-[#137333]",
    pendingApproval: "bg-[#FEF7E0] text-[#B06000]",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[12px] font-semibold font-nunito whitespace-nowrap ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

function getPaymentBadgeVariant(status) {
  if (status === "Paid") return "paid";
  return "pending";
}

function getStatusBadgeVariant(status) {
  if (status === "Approved") return "approved";
  return "pendingApproval";
}

export default function ExpenseRecordsPage() {
  const pendingCount = EXPENSES.filter((e) => e.status === "Pending Approval").length;

  return (
    <div className="p-6 min-h-screen bg-white font-nunito">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-nunito font-bold text-[32px] leading-[136%] text-[#333333] tracking-normal">
          My Expenses
        </h1>
        <p className="font-nunito font-medium text-[18px] leading-[136%] text-[#777777] tracking-normal mt-1">
          Track and manage all your expense submissions
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-[#E8ECEF] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 flex justify-between items-start"
            >
              <div className="flex flex-col gap-1">
                <span className="font-nunito font-medium text-[14px] text-[#777777]">
                  {card.label}
                </span>
                <span className="font-nunito font-bold text-[28px] leading-tight text-[#1E293B]">
                  {card.value}
                </span>
                <span className="font-nunito font-medium text-[12px] text-[#94A3B8]">
                  {card.sublabel}
                </span>
              </div>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg}`}
              >
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
          );
        })}
      </div>


      {/* All Expenses table */}
      <div className="rounded-[20px] bg-white overflow-hidden mt-12 p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
          <h2 className="font-nunito font-bold text-[20px] text-[#333333]">
            All Expenses
          </h2>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 bg-[#2B7FFF] hover:bg-[#1a6fe6] text-white font-nunito font-semibold text-[14px] px-4 py-2.5 rounded-lg transition-colors cursor-pointer border-0 outline-none shrink-0"
          >
            <FiSend className="w-4 h-4" />
            Send All for Approval ({pendingCount})
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1350px]">
            {/* Table header */}
            <div
              className="grid gap-3 py-5 border-b border-[#E8ECEF] font-nunito font-bold text-[14px] text-[#666666]"
              style={{ gridTemplateColumns: TABLE_COLUMNS }}
            >
              <div>Description</div>
              <div>Type</div>
              <div>Event</div>
              <div>Portfolio</div>
              <div>Date</div>
              <div>Total Amount</div>
              <div>Paid</div>
              <div>Balance</div>
              <div>Vendor</div>
              <div>Bill</div>
              <div>Payment Status</div>
              <div>Status</div>
              <div>Action</div>
            </div>

            {/* Table rows */}
            {EXPENSES.map((expense) => (
              <div
                key={expense.id}
                className="grid gap-3 py-6 border-b border-[#F1F5F9] last:border-b-0 items-center font-nunito text-[14px] text-[#333333]"
                style={{ gridTemplateColumns: TABLE_COLUMNS }}
              >
                <div className="truncate font-medium" title={expense.description}>
                  {expense.description}
                </div>
                <div className="font-medium">{expense.type}</div>
                <div className="truncate" title={expense.event}>
                  {expense.event}
                </div>
                <div>{expense.portfolio}</div>
                <div className="text-[#666666]">{expense.date}</div>
                <div className="font-bold">{formatCurrency(expense.totalAmount)}</div>
                <div>{formatCurrency(expense.paid)}</div>
                <div>{formatCurrency(expense.balance)}</div>
                <div className="truncate" title={expense.vendor}>
                  {expense.vendor}
                </div>
                <div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-[#0B57D0] font-semibold text-[13px] bg-transparent border-0 p-0 cursor-pointer hover:underline max-w-full"
                  >
                    <FiFileText className="w-4 h-4 shrink-0" />
                    <span className="truncate max-w-[100px]">{expense.bill}</span>
                    <FiDownload className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
                <div>
                  <StatusBadge variant={getPaymentBadgeVariant(expense.paymentStatus)}>
                    {expense.paymentStatus}
                  </StatusBadge>
                </div>
                <div>
                  <StatusBadge variant={getStatusBadgeVariant(expense.status)}>
                    {expense.status}
                  </StatusBadge>
                </div>
                <div>
                  {expense.canSend ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 bg-[#2B7FFF] hover:bg-[#1a6fe6] text-white font-nunito font-semibold text-[12px] px-3 py-1.5 rounded-md transition-colors cursor-pointer border-0 outline-none whitespace-nowrap"
                    >
                      <FiSend className="w-3.5 h-3.5" />
                      Send for approval
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
