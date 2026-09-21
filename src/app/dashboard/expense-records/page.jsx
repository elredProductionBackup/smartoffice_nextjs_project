"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FiFileText,
  FiSend,
  FiDownload,
  FiDollarSign,
  FiLoader,
  FiChevronDown,
  FiMoreHorizontal,
  FiMessageCircle,
  FiMail,
  FiInbox,
  FiCheck,
  FiTrash2,
} from "react-icons/fi";
import { useExpenseRecordsStore } from "@/store/useExpenseRecordsStore";
import NewExpensesPopup from "@/_components/UI/NewExpensesPopup";
import { formatCompactAmount } from "@/utils/currency";

const TABLE_COLUMNS =
  "minmax(190px,1.6fr) minmax(100px,1fr) minmax(112px,1fr) minmax(118px,1fr) minmax(120px,1fr) minmax(130px,1.1fr) minmax(96px,0.9fr) minmax(112px,1fr) minmax(140px,1.1fr) minmax(150px,1.2fr) minmax(104px,1fr) minmax(52px,0.4fr)";

function formatCurrency(amount) {
  return `₹${formatCompactAmount(amount)}`;
}

const PAYMENT_STATUS_OPTIONS = ["Paid", "Pending", "Overdue"];

/* ─── Shared: anchor a fixed popover to a trigger, escape all overflow ───── */
function usePopover(open, setOpen, { width = 176, height = 150, align = "left" } = {}) {
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!open) return;

    const place = () => {
      const el = btnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const openUp = r.bottom + height > window.innerHeight - 8 && r.top > height;
      let left = align === "right" ? r.right - width : r.left;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      setPos({
        left,
        top: openUp ? Math.max(8, r.top - height - 6) : r.bottom + 6,
        width: Math.max(width, r.width),
        openUp,
      });
    };
    place();

    const close = () => setOpen(false);
    const onDoc = (e) => {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      )
        setOpen(false);
    };
    // capture=true so it also catches scrolling of the inner table container
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("mousedown", onDoc);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open, setOpen, width, height, align]);

  return { btnRef, menuRef, pos };
}

/* ─── Animated count-up (tweens from the last value to the new one) ──────── */
function useCountUp(target, active, duration = 900) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const to = Number(target) || 0;
    const from = fromRef.current;
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = from + (to - from) * eased;
      setDisplay(val);
      fromRef.current = val;
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        setDisplay(to);
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, active, duration]);

  return display;
}

/* ─── Summary card with skeleton + count-up ──────────────────────────────── */
function StatCard({ card, loading }) {
  const animated = useCountUp(card.rawValue, !loading);
  const Icon = card.icon;

  return (
    <div className="group relative bg-white rounded-2xl border border-[#EAEEF2] shadow-[0_1px_3px_rgba(16,24,40,0.04)] p-5 pl-6 flex justify-between items-start overflow-hidden transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_12px_30px_rgba(16,24,40,0.10)] hover:border-[#DDE3EA]">
      <span className="absolute left-0 top-0 h-full w-[3px]" style={{ backgroundColor: card.accent }} />
      <div className="flex flex-col gap-2">
        <span className="font-nunito font-semibold text-[14px] text-[#64748B]">{card.label}</span>

        {loading ? (
          <span
            className="mt-1 h-[30px] rounded-lg bg-[linear-gradient(100deg,#EEF2F7_30%,#F7FAFD_50%,#EEF2F7_70%)] bg-[length:200%_100%] animate-[statShimmer_1.2s_ease-in-out_infinite]"
            style={{ width: card.money ? 140 : 72 }}
          />
        ) : (
          <span className="font-nunito font-extrabold text-[30px] leading-none text-[#0F172A] tabular-nums tracking-tight">
            {card.format(animated)}
          </span>
        )}

        {loading ? (
          <span className="h-3 w-28 rounded bg-[linear-gradient(100deg,#EEF2F7_30%,#F7FAFD_50%,#EEF2F7_70%)] bg-[length:200%_100%] animate-[statShimmer_1.2s_ease-in-out_infinite]" />
        ) : (
          <span className="font-nunito font-medium text-[12px] text-[#94A3B8]">{card.sublabel}</span>
        )}
      </div>

      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
        <Icon className={`w-5 h-5 ${card.iconColor}`} />
      </div>
    </div>
  );
}

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
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-semibold font-nunito whitespace-nowrap ${styles[variant] ?? styles.pending}`}
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

const PAYMENT_DOT = { Paid: "#16A34A", Pending: "#D97706", Overdue: "#DC2626" };

/* ─── Payment status: portal popover (never clipped by the table) ────────── */
function PaymentStatusDropdown({ expenseId, currentStatus, onUpdate }) {
  const [open, setOpen] = useState(false);
  const { btnRef, menuRef, pos } = usePopover(open, setOpen, { width: 180, height: 150 });
  const variant = getPaymentBadgeVariant(currentStatus);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-semibold font-nunito whitespace-nowrap cursor-pointer border-0 outline-none transition-opacity hover:opacity-80 ${
          variant === "paid"
            ? "bg-[#E6F4EA] text-[#137333]"
            : variant === "overdue"
            ? "bg-[#FEE2E2] text-[#B91C1C]"
            : "bg-[#FEF7E0] text-[#B06000]"
        }`}
      >
        {currentStatus}
        <FiChevronDown className={`w-3 h-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && pos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", left: pos.left, top: pos.top, width: pos.width, transformOrigin: pos.openUp ? "bottom" : "top" }}
            className="z-[9999] bg-white rounded-xl shadow-[0_16px_40px_rgba(16,24,40,0.18)] border border-[#EAECEF] p-1.5 font-nunito animate-[menuIn_0.14s_ease-out]"
          >
            {PAYMENT_STATUS_OPTIONS.map((opt) => {
              const isCur = opt === currentStatus;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onUpdate(expenseId, opt);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors border-0 cursor-pointer bg-transparent outline-none hover:bg-[#F5F8FF] ${
                    isCur ? "text-[#0F172A]" : "text-[#475569]"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PAYMENT_DOT[opt] }} />
                  <span className="flex-1 text-left">{opt}</span>
                  {isCur && <FiCheck className="w-4 h-4 text-[#2B7FFF]" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}

function getStatusBadgeVariant(status) {
  if (status === "Approved") return "approved";
  return "pendingApproval";
}

/* ─── Row "…" actions: portal popover with icon chips ────────────────────── */
function RowActionsMenu({ onPick, onDelete }) {
  const [open, setOpen] = useState(false);
  const { btnRef, menuRef, pos } = usePopover(open, setOpen, { width: 232, height: 220, align: "right" });

  const items = [
    { channel: "whatsapp", label: "Send via WhatsApp", icon: <FiMessageCircle className="w-4 h-4" />, chip: "bg-green-50 text-green-600" },
    { channel: "email", label: "Send via Email", icon: <FiMail className="w-4 h-4" />, chip: "bg-blue-50 text-blue-600" },
    { channel: "both", label: "Send via Email & WhatsApp", icon: <FiSend className="w-4 h-4" />, chip: "bg-purple-50 text-purple-600" },
  ];

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More options"
        className={`w-8 h-7 flex items-center justify-center rounded-md border transition-colors ${
          open ? "border-[#2B7FFF] text-[#2B7FFF] bg-[#F2F7FF]" : "border-[#E2E8F0] text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#334155]"
        }`}
      >
        <FiMoreHorizontal className="w-4 h-4 rotate-[90deg]" />
      </button>

      {open && pos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", left: pos.left, top: pos.top, width: 232, transformOrigin: pos.openUp ? "bottom" : "top" }}
            className="z-[9999] bg-white rounded-xl border border-[#EAECEF] shadow-[0_16px_40px_rgba(16,24,40,0.18)] overflow-hidden font-nunito animate-[menuIn_0.14s_ease-out]"
          >
            {items.map(({ channel, label, icon, chip }) => (
              <button
                key={channel}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onPick(channel);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] text-[#334155] hover:bg-[#F5F8FF] border-b border-[#F1F5F9] transition-colors"
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${chip}`}>{icon}</span>
                <span className="font-medium text-left">{label}</span>
              </button>
            ))}

            {/* Destructive action */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
            >
              <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-red-50 text-red-600">
                <FiTrash2 className="w-4 h-4" />
              </span>
              <span className="font-medium text-left">Delete expense</span>
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

/* ─── Sleek Filter Dropdown ─────────────────────────────────────────────── */
function FilterDropdown({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));
  const displayLabel = selected ? selected.label : options[0]?.label;

  return (
    <div ref={ref} className="relative font-nunito">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 h-[40px] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-[13px] transition-all cursor-pointer outline-none whitespace-nowrap"
      >
        <span className="text-[#777777] font-medium">{label}:</span>
        <span className="text-[#2B7FFF] font-bold">{displayLabel}</span>
        <FiChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 min-w-[200px] bg-white rounded-xl border border-[#E2E8F0] p-1.5 z-40 overflow-y-auto max-h-[240px]"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer border-0 bg-transparent outline-none hover:bg-[#F2F7FF] ${
                String(opt.value) === String(value) ? "text-[#2B7FFF] bg-[#F2F7FF]" : "text-[#333333]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function ExpenseRecordsPage() {
  const expenses = useExpenseRecordsStore((state) => state.expenses);
  const totalCount = useExpenseRecordsStore((state) => state.totalCount);
  const totalExpense = useExpenseRecordsStore((state) => state.totalExpense);
  const totalAmount = useExpenseRecordsStore((state) => state.totalAmount);
  const pendingCount = useExpenseRecordsStore((state) => state.pendingCount);
  const loading = useExpenseRecordsStore((state) => state.loading);
  const error = useExpenseRecordsStore((state) => state.error);
  const fetchExpenses = useExpenseRecordsStore((state) => state.fetchExpenses);
  const hydrateFromStorage = useExpenseRecordsStore((state) => state.hydrateFromStorage);
  const updatePaymentStatus = useExpenseRecordsStore((state) => state.updatePaymentStatus);
  const updateExpense = useExpenseRecordsStore((state) => state.updateExpense);
  const deleteExpense = useExpenseRecordsStore((state) => state.deleteExpense);

  const [reminderModal, setReminderModal] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  // Delete confirm state
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filter state
  const [type, setType] = useState("all");
  const [approvedStatus, setApprovedStatus] = useState("");
  const [eventId, setEventId] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Horizontal-scroll edge indicator (drives the pinned-column shadow)
  const scrollRef = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const updateEdges = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, []);

  useEffect(() => {
    updateEdges();
  }, [expenses, loading]);

  useEffect(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    fetchExpenses({ start, offset: PAGE_SIZE, type, eventId, approvedStatus });
  }, [fetchExpenses, type, eventId, approvedStatus, currentPage]);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const handleExpenseClick = (expense) => {
    setSelectedExpense(expense);
    setShowPopup(true);
  };

  const handleSendReminder = (expenseId, channel) => {
    console.log(`Sending reminder for ${expenseId} via ${channel}`);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal?.expense || deleting) return;
    setDeleting(true);
    const res = await deleteExpense(deleteModal.expense.id);
    setDeleting(false);
    setDeleteModal(null);
    // Auth failures already redirect to login via the axios interceptor.
    if (!res?.success && res?.isAuth !== false && res?.message) {
      alert(res.message);
    }
  };

  const summaryCards = useMemo(
    () => [
      {
        label: "Total Expenses",
        rawValue: Number(totalExpense) || 0,
        format: (v) => Math.round(v).toLocaleString("en-IN"),
        sublabel: "All time submissions",
        icon: FiFileText,
        iconBg: "bg-[#E8F0FE]",
        iconColor: "text-[#1A73E8]",
        accent: "#1A73E8",
        money: false,
      },
      {
        label: "Pending Approval",
        rawValue: Number(pendingCount) || 0,
        format: (v) => Math.round(v).toLocaleString("en-IN"),
        sublabel: "Awaiting review",
        icon: FiSend,
        iconBg: "bg-[#FFF4E5]",
        iconColor: "text-[#F59E0B]",
        accent: "#F59E0B",
        money: false,
      },
      {
        label: "Total Amount",
        rawValue: Number(totalAmount) || 0,
        format: (v) => formatCurrency(v),
        sublabel: "Submitted all time",
        icon: FiDollarSign,
        iconBg: "bg-[#E6F4EA]",
        iconColor: "text-[#0F9D58]",
        accent: "#0F9D58",
        money: true,
      },
    ],
    [totalAmount, totalExpense, pendingCount]
  );

  const STATUS_OPTIONS = [
    { label: "All Statuses", value: "" },
    { label: "Pending Approval", value: "pending" },
    { label: "Approved", value: "approved" },
  ];

  const filtersActive = type !== "all" || approvedStatus !== "" || eventId !== "";
  const pinShadow = edges.left ? "shadow-[10px_0_14px_-10px_rgba(16,24,40,0.16)]" : "";

  return (
    <div className="p-6 min-h-screen font-nunito">
      {/* one-off keyframes: card skeletons + popover entrance */}
      <style jsx global>{`
        @keyframes statShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes menuIn {
          0% { opacity: 0; transform: translateY(-6px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Header */}
      <div className="mb-7">
        <h1 className="font-nunito font-bold text-[32px] leading-[136%] text-[#1E293B] tracking-tight">My Expenses</h1>
        <p className="font-nunito font-medium text-[17px] leading-[136%] text-[#64748B] tracking-normal mt-1">
          Track and manage all your expense submissions
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {summaryCards.map((card) => (
          <StatCard key={card.label} card={card} loading={loading} />
        ))}
      </div>

      {/* All Expenses table */}
      <div className="rounded-[22px] bg-white overflow-hidden p-6 md:p-8 border border-[#EAEEF2] shadow-[0_6px_28px_rgba(16,24,40,0.06)] mb-[20px]">
        {/* Table top bar */}
        <div className="flex items-center gap-2.5">
          <h2 className="font-nunito font-bold text-[20px] text-[#1E293B]">All Expenses</h2>
          {!loading && totalCount > 0 && (
            <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[#F1F5F9] text-[12px] font-bold text-[#64748B]">
              {totalCount}
            </span>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 pt-5 pb-6 border-b border-[#F1F5F9] mb-2">
          <FilterDropdown
            label="Status"
            value={approvedStatus}
            onChange={(v) => {
              setApprovedStatus(v);
              setCurrentPage(1);
            }}
            options={STATUS_OPTIONS}
          />
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setType("all");
                setApprovedStatus("");
                setEventId("");
                setCurrentPage(1);
              }}
              className="text-[13px] text-red-500 hover:text-red-700 font-bold bg-transparent border-0 cursor-pointer outline-none hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Pinned first column + scrollbar (thumb only, no track pad) */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="overflow-x-auto pb-3 scroll-smooth [scrollbar-width:thin] [scrollbar-color:#AEB9C8_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#AEB9C8] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:transition-colors hover:[&::-webkit-scrollbar-thumb]:bg-[#8B98AB]"
          >
            <div className="min-w-[1560px]">
              {/* Header row */}
              <div
                className="grid gap-3 py-4 border-b border-[#EAEEF2] font-nunito font-bold text-[13px] text-[#64748B]"
                style={{ gridTemplateColumns: TABLE_COLUMNS }}
              >
                <div className={`sticky left-0 z-[4] bg-white pr-2 ${pinShadow}`}>Description</div>
                <div>Portfolio</div>
                <div>Date</div>
                <div>Total Amount</div>
                <div>Remark</div>
                <div>Vendor</div>
                <div>Bill</div>
                <div>Reminder</div>
                <div>Payment Status</div>
                <div>Status</div>
                <div>Approval</div>
                <div className="sr-only">Actions</div>
              </div>

              {/* Body */}
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-20 text-[#666666]">
                  <FiLoader className="w-6 h-6 animate-spin text-[#2B7FFF]" />
                  <span className="text-[14px] font-semibold">Loading expenses…</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                  <span className="text-[15px] font-bold text-[#B91C1C]">Couldn&apos;t load expenses</span>
                  <span className="text-[13px] text-[#94A3B8] font-medium">
                    {error}. Try adjusting the filters or reloading the page.
                  </span>
                </div>
              ) : expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] flex items-center justify-center">
                    <FiInbox className="w-6 h-6 text-[#94A3B8]" />
                  </div>
                  <span className="text-[15px] font-bold text-[#334155]">No expenses to show</span>
                  <span className="text-[13px] text-[#94A3B8] font-medium">
                    {filtersActive
                      ? "Nothing matches the current filters — reset them to see everything."
                      : "New submissions will appear here."}
                  </span>
                </div>
              ) : (
                expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="group grid gap-3 py-5 border-b border-[#EBEFF4] last:border-b-0 items-center font-nunito text-[14px] text-[#334155] transition-colors hover:bg-[#EEF4FF]"
                    style={{ gridTemplateColumns: TABLE_COLUMNS }}
                  >
                    <div
                      className={`sticky left-0 z-[2] bg-white group-hover:bg-[#EEF4FF] pl-2 pr-2 truncate font-bold text-[#0B57D0] hover:underline cursor-pointer capitalize ${pinShadow}`}
                      title={expense.description}
                      onClick={() => handleExpenseClick(expense)}
                    >
                      {expense.description}
                    </div>
                    <div className="text-[#475569]">{expense.portfolio}</div>
                    <div className="text-[#64748B]">{expense.date}</div>
                    <div className="font-bold text-[#0F172A] tabular-nums">{formatCurrency(expense.totalAmount)}</div>
                    <div className="font-semibold line-clamp-1 text-[#475569]" title={expense.remark}>
                      {expense.remark}
                    </div>
                    <div className="truncate text-[#475569]" title={expense.vendor}>
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
                        <span className="text-[#CBD5E1]">—</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {expense.reminderCount > 0 ? (
                        <>
                          <span className="font-bold text-[15px] text-[#334155]">{expense.reminderCount} sent</span>
                          {expense.lastReminderDate && (
                            <span className="text-[12px] text-[#94A3B8] font-medium">Last: {expense.lastReminderDate}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-[13px] text-[#94A3B8] font-medium">No reminders</span>
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
                      <StatusBadge variant={getStatusBadgeVariant(expense.status)}>{expense.status}</StatusBadge>
                    </div>
                    <div>
                      {expense.canSend ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 bg-[#2B7FFF] hover:bg-[#1a6fe6] active:scale-[0.97] text-white font-nunito font-semibold text-[12px] px-3 py-1.5 rounded-md transition-all cursor-pointer border-0 outline-none whitespace-nowrap"
                        >
                          <FiSend className="w-3.5 h-3.5" />
                          Send
                        </button>
                      ) : (
                        <span className="text-[#CBD5E1]">—</span>
                      )}
                    </div>

                    {/* Actions — portal popover, opens in front of everything */}
                    <div className="flex justify-center">
                      <RowActionsMenu
                        onPick={(channel) => setReminderModal({ expenseId: expense.id, expense, channel })}
                        onDelete={() => setDeleteModal({ expense })}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#F1F5F9] pt-6 mt-6 gap-4 font-nunito">
            <span className="text-[14px] text-[#777777] font-medium">
              Showing{" "}
              <span className="font-bold text-[#334155]">
                {Math.min(totalCount, (currentPage - 1) * PAGE_SIZE + 1)}–
                {Math.min(totalCount, currentPage * PAGE_SIZE)}
              </span>{" "}
              of <span className="font-bold text-[#334155]">{totalCount}</span> records
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[14px] font-semibold text-[#333333] bg-white hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-[13px] font-semibold text-[#64748B] px-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage * PAGE_SIZE >= totalCount}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[14px] font-semibold text-[#333333] bg-white hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {reminderModal && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center" onClick={() => setReminderModal(null)}>
          <div
            className="bg-white rounded-2xl border border-[#E2E8F0] w-[400px] overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 ${
                  reminderModal.channel === "whatsapp" ? "bg-green-50" : reminderModal.channel === "email" ? "bg-blue-50" : "bg-purple-50"
                }`}
              >
                {reminderModal.channel === "whatsapp" && <FiMessageCircle className="w-5 h-5 text-green-600" />}
                {reminderModal.channel === "email" && <FiMail className="w-5 h-5 text-blue-600" />}
                {reminderModal.channel === "both" && <FiSend className="w-5 h-5 text-purple-600" />}
              </div>

              <p className="font-semibold text-[15px] text-[#0F172A] mb-1.5">
                {reminderModal.channel === "whatsapp" && "Send reminder via WhatsApp?"}
                {reminderModal.channel === "email" && "Send reminder via Email?"}
                {reminderModal.channel === "both" && "Send via Email and WhatsApp?"}
              </p>
              <p className="text-[13px] text-[#64748B] leading-relaxed">
                This will send a payment reminder to the vendor for{" "}
                <span className="font-semibold text-[#333333]">{reminderModal.expense.description}</span>. Confirm to proceed.
              </p>

              <div className="mt-3.5 flex items-center gap-2 px-3 py-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                {reminderModal.channel === "whatsapp" && <FiMessageCircle className="w-4 h-4 text-green-600" />}
                {reminderModal.channel === "email" && <FiMail className="w-4 h-4 text-blue-600" />}
                {reminderModal.channel === "both" && <FiSend className="w-4 h-4 text-purple-600" />}
                <span className="text-[13px] font-medium text-[#334155]">
                  {reminderModal.channel === "whatsapp" && "WhatsApp reminder"}
                  {reminderModal.channel === "email" && "Email reminder"}
                  {reminderModal.channel === "both" && "Email + WhatsApp reminder"}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 px-5 pb-5">
              <button
                type="button"
                className="flex-1 py-2 border border-[#CBD5E1] rounded-lg text-[13px] text-[#64748B] font-medium hover:bg-[#F8FAFC] transition-colors"
                onClick={() => setReminderModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`flex-[2] py-2 rounded-lg text-[13px] font-semibold text-white transition-colors ${
                  reminderModal.channel === "whatsapp"
                    ? "bg-[#25D366] hover:bg-[#1ebe5e]"
                    : reminderModal.channel === "email"
                    ? "bg-[#2B7FFF] hover:bg-[#1a6fe6]"
                    : "bg-[#7c3aed] hover:bg-[#6d28d9]"
                }`}
                onClick={() => {
                  handleSendReminder(reminderModal.expenseId, reminderModal.channel);
                  setReminderModal(null);
                }}
              >
                {reminderModal.channel === "whatsapp" && "Send via WhatsApp"}
                {reminderModal.channel === "email" && "Send via Email"}
                {reminderModal.channel === "both" && "Send to both"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center"
          onClick={() => !deleting && setDeleteModal(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E2E8F0] w-[400px] overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 bg-red-50">
                <FiTrash2 className="w-5 h-5 text-red-600" />
              </div>
              <p className="font-semibold text-[15px] text-[#0F172A] mb-1.5">Delete this expense?</p>
              <p className="text-[13px] text-[#64748B] leading-relaxed">
                You&apos;re about to permanently delete{" "}
                <span className="font-semibold text-[#333333]">{deleteModal.expense.description}</span>. This can&apos;t be undone.
              </p>
            </div>
            <div className="flex gap-2.5 px-5 pb-5">
              <button
                type="button"
                disabled={deleting}
                className="flex-1 py-2 border border-[#CBD5E1] rounded-lg text-[13px] text-[#64748B] font-medium hover:bg-[#F8FAFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setDeleteModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                className="flex-[2] py-2 rounded-lg text-[13px] font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] transition-colors disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                onClick={handleConfirmDelete}
              >
                {deleting && <FiLoader className="w-4 h-4 animate-spin" />}
                {deleting ? "Deleting..." : "Delete expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPopup && (
        <NewExpensesPopup
          initialData={selectedExpense}
          onClose={() => {
            setShowPopup(false);
            setSelectedExpense(null);
          }}
          onSave={(updatedPayload) => {
            if (updatedPayload.id) {
              updateExpense(updatedPayload.id, updatedPayload);
            }
            setShowPopup(false);
            setSelectedExpense(null);
          }}
        />
      )}
    </div>
  );
}