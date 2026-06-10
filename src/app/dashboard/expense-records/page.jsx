"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  FiFileText,
  FiSend,
  FiDownload,
  FiDollarSign,
} from "react-icons/fi";
import { useExpenseRecordsStore } from "@/store/useExpenseRecordsStore";
import { FiChevronDown } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchEvents } from "@/store/events/eventsThunks";
import { UPCOMING_EVENTS, PAST_EVENTS, DRAFT_EVENTS } from "@/assets/helpers/sampleEvents";

const TABLE_COLUMNS =
  "minmax(160px,1.6fr) minmax(90px,1fr) minmax(140px,1.4fr) minmax(100px,1fr) minmax(100px,0.9fr) minmax(110px,1fr) minmax(90px,0.9fr) minmax(90px,0.9fr) minmax(130px,1.2fr) minmax(160px,1.3fr) minmax(110px,1fr) minmax(130px,1.1fr) minmax(120px,1fr) minmax(150px,1.2fr)";

function formatCurrency(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

const PAYMENT_STATUS_OPTIONS = ["Paid", "Pending", "Overdue"];

function StatusBadge({ children, variant }) {
  const styles = {
    paid: "bg-[#E6F4EA] text-[#137333]",
    pending: "bg-[#FEF7E0] text-[#B06000]",
    overdue: "bg-[#FEE2E2] text-[#B91C1C]",
    approved: "bg-[#E6F4EA] text-[#137333]",
    pendingApproval: "bg-[#FEF7E0] text-[#B06000]",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[12px] font-semibold font-nunito whitespace-nowrap ${styles[variant] ?? styles.pending}`}
    >
      {children}
    </span>
  );
}

function getPaymentBadgeVariant(status) {
  if (status === "Paid") return "paid";
  if (status === "Overdue") return "overdue";
  return "pending";
}

function PaymentStatusDropdown({ expenseId, currentStatus, onUpdate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const variant = getPaymentBadgeVariant(currentStatus);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[12px] font-semibold font-nunito whitespace-nowrap cursor-pointer border-0 outline-none transition-opacity hover:opacity-80 ${
          variant === "paid"
            ? "bg-[#E6F4EA] text-[#137333]"
            : variant === "overdue"
            ? "bg-[#FEE2E2] text-[#B91C1C]"
            : "bg-[#FEF7E0] text-[#B06000]"
        }`}
      >
        {currentStatus}
        <FiChevronDown
          className={`w-3 h-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-[120px] bg-white rounded-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.10)] border border-[#E8ECEF] py-1.5 font-nunito">
          {PAYMENT_STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onUpdate(expenseId, opt);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-[13px] font-medium transition-colors border-0 cursor-pointer bg-transparent outline-none hover:bg-[#F2F7FF] ${
                opt === currentStatus
                  ? "text-[#2B7FFF] font-semibold"
                  : "text-[#333333]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getStatusBadgeVariant(status) {
  if (status === "Approved") return "approved";
  return "pendingApproval";
}

export default function ExpenseRecordsPage() {
  const expenses = useExpenseRecordsStore((state) => state.expenses);
  const hydrateFromStorage = useExpenseRecordsStore((state) => state.hydrateFromStorage);
  const updatePaymentStatus = useExpenseRecordsStore((state) => state.updatePaymentStatus);

  const router = useRouter();
  const dispatch = useDispatch();
  const rawEvents = useSelector((state) => state.events.rawEvents);

  useEffect(() => {
    hydrateFromStorage();
    dispatch(fetchEvents({ page: 1, limit: 100 }));
  }, [hydrateFromStorage, dispatch]);

  const eventMap = useMemo(() => {
    const map = {};
    
    // 1. Static mock events from sampleEvents
    [UPCOMING_EVENTS, PAST_EVENTS, DRAFT_EVENTS].forEach((list) => {
      list.forEach((group) => {
        group.items?.forEach((item) => {
          if (item.name) {
            map[item.name.toLowerCase().trim()] = item.id;
          }
        });
      });
    });

    // 2. Dynamic events from Redux/API
    if (Array.isArray(rawEvents)) {
      rawEvents.forEach((evt) => {
        if (evt.eventName) {
          map[evt.eventName.toLowerCase().trim()] = evt.eventId;
        }
      });
    }

    return map;
  }, [rawEvents]);

  const handleExpenseClick = (expense) => {
    if (!expense?.event) return;
    const eventId = eventMap[expense.event.toLowerCase().trim()];
    if (eventId) {
      router.push(`/dashboard/events/${eventId}?tab=eventcosting&expenseId=${expense.id}`);
    }
  };

  const pendingCount = expenses.filter((e) => e.status === "Pending Approval").length;

  const summaryCards = useMemo(() => {
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);

    return [
      {
        label: "Total Expenses",
        value: String(expenses.length),
        sublabel: "All time submissions",
        icon: FiFileText,
        iconBg: "bg-[#E8F0FE]",
        iconColor: "text-[#1A73E8]",
      },
      {
        label: "Pending Approval",
        value: String(pendingCount),
        sublabel: "Awaiting review",
        icon: FiSend,
        iconBg: "bg-[#FFF4E5]",
        iconColor: "text-[#F59E0B]",
      },
      {
        label: "Total Amount",
        value: formatCurrency(totalAmount),
        sublabel: "Submitted this month",
        icon: FiDollarSign,
        iconBg: "bg-[#E6F4EA]",
        iconColor: "text-[#0F9D58]",
      },
    ];
  }, [expenses, pendingCount]);

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
        {summaryCards.map((card) => {
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

        {/* MODIFIED: Added styling hooks to the overflow-x-auto div 
          to make the scrollbar minimal, sleek, and matching the UI.
        */}
        <div className="overflow-x-auto pb-3 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-[#F8FAFC] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#CBD5E1] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#94A3B8] transition-colors duration-200 [scrollbar-width:thin] [scrollbar-color:#CBD5E1_#F8FAFC]">
          <div className="min-w-[1470px]">
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
              <div>Remark</div>
              {/* <div>Paid</div>
              <div>Balance</div> */}
              <div>Vendor</div>
              <div>Bill</div>
              <div>Payment Status</div>
              <div>Status</div>
              <div>Reminder Sent</div>
              <div>Action</div>
            </div>

            {/* Table rows */}
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="grid gap-3 py-6 border-b border-[#F1F5F9] last:border-b-0 items-center font-nunito text-[14px] text-[#333333]"
                style={{ gridTemplateColumns: TABLE_COLUMNS }}
              >
                 <div
                  className={`truncate font-medium ${
                    expense.type === "Event Related" && eventMap[expense.event?.toLowerCase()?.trim()]
                      ? "text-[#0B57D0] hover:underline cursor-pointer"
                      : ""
                  }`}
                  title={expense.description}
                  onClick={() => {
                    if (expense.type === "Event Related") {
                      handleExpenseClick(expense);
                    }
                  }}
                >
                  {expense.description}
                </div>
                <div className="font-medium">{expense.type}</div>
                <div
                  className={`truncate ${
                    expense.type === "Event Related" && eventMap[expense.event?.toLowerCase()?.trim()]
                      ? "text-[#0B57D0] hover:underline cursor-pointer font-semibold"
                      : ""
                  }`}
                  title={expense.event}
                  onClick={() => {
                    if (expense.type === "Event Related") {
                      handleExpenseClick(expense);
                    }
                  }}
                >
                  {expense.event}
                </div>
                <div>{expense.portfolio}</div>
                <div className="text-[#666666]">{expense.date}</div>
                <div className="font-bold">{formatCurrency(expense.totalAmount)}</div>
                <div className="font-bold line-clamp-1">{(expense.remark)}</div>
                {/* <div>{formatCurrency(expense.paid)}</div>
                <div>{formatCurrency(expense.balance)}</div> */}
                <div className="truncate" title={expense.vendor}>
                  {expense.vendor}
                </div>
                <div>
                  {expense.bill && expense.bill !== "-" ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-[#0B57D0] font-semibold text-[13px] bg-transparent border-0 p-0 cursor-pointer hover:underline max-w-full"
                    >
                      <FiFileText className="w-4 h-4 shrink-0" />
                      <span className="truncate max-w-[100px]">{expense.bill}</span>
                      <FiDownload className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  ) : (
                    <span className="text-[#94A3B8]">-</span>
                  )}
                </div>
                <div>
                  <PaymentStatusDropdown
                    expenseId={expense.id}
                    currentStatus={expense.paymentStatus}
                    onUpdate={updatePaymentStatus}
                  />
                </div>
                <div>
                  <StatusBadge variant={getStatusBadgeVariant(expense.status)}>
                    {expense.status}
                  </StatusBadge>
                </div>
                <div className="flex flex-col gap-0.5">
                  {expense.reminderCount > 0 ? (
                    <>
                      <span className="text-[13px] font-bold text-[#333333]">
                        {expense.reminderCount} sent
                      </span>
                      <span className="text-[12px] font-medium text-[#94A3B8]">
                        Last: {expense.lastReminderDate ?? "-"}
                      </span>
                    </>
                  ) : (
                    <span className="text-[13px] font-medium text-[#C0C8D4] italic">
                      No reminders
                    </span>
                  )}
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