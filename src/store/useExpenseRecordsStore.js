import { create } from "zustand";

export const EXPENSE_RECORDS_STORAGE_KEY = "smartoffice_expense_records";

export const initialExpenseRecords = [
  {
    id: 1,
    description: "Office supplies purchase",
    type: "General",
    event: "-",
    portfolio: "Operations",
    date: "2026-05-20",
    totalAmount: 1500,
    remark:"Monthly office supplies replenishment.",
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
    remark: "Procurement of office materials for administrative use.",
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
    remark: "Procurement of office materials for administrative use.",
    vendor: "Delicious Catering Co.",
    bill: "catering_invoice_may.pdf",
    paymentStatus: "Paid",
    status: "Approved",
    canSend: false,
  },
];

function formatExpenseDate(date) {
  if (!date) return "-";
  if (typeof date === "string") return date;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toISOString().split("T")[0];
}

function parseAmount(value) {
  const num = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(num) ? num : 0;
}

export function eventCostingToExpenseRecord({
  narrative,
  category,
  eventName,
  portfolio,
  date,
  totalAmount,
  // paid,
  // balance,
  remark,
  vendorName,
  billFileName,
  approvalStatus = "Pending",
}) {
  const total = parseAmount(totalAmount);
  const paidAmount = parseAmount(paid);
  const balanceAmount =
    balance !== "" && balance != null
      ? parseAmount(balance)
      : Math.max(0, total - paidAmount);

  const status = approvalStatus === "Approved" ? "Approved" : "Pending Approval";
  const paymentStatus =
    balanceAmount === 0 && paidAmount > 0 ? "Paid" : "Pending";

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    description: narrative?.trim() || category || "Event expense",
    type: "Event Related",
    event: eventName || "-",
    portfolio: portfolio || "-",
    date: formatExpenseDate(date),
    totalAmount: total,
    // paid: paidAmount,
    // balance: balanceAmount,
    remark:remark,
    vendor: vendorName?.trim() || "-",
    bill: billFileName || "-",
    paymentStatus,
    status,
    canSend: status === "Pending Approval",
    category,
  };
}

export function formExpenseToRecord(expense) {
  const total = parseAmount(expense.totalAmount);
  const paidAmount = parseAmount(expense.paid);
  const balanceAmount =
    expense.balance !== "" && expense.balance != null
      ? parseAmount(expense.balance)
      : Math.max(0, total - paidAmount);

  const paymentStatus =
    balanceAmount === 0 && paidAmount > 0 ? "Paid" : "Pending";

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    description:
      expense.description?.trim() ||
      `${expense.expenseType || "General"} expense submission`,
    type: expense.expenseType || "General",
    event: expense.event || "-",
    portfolio: expense.portfolio || "-",
    date: formatExpenseDate(expense.date),
    totalAmount: total,
    paid: paidAmount,
    balance: balanceAmount,
    remark:expense.remark,
    vendor: expense.vendorName?.trim() || "-",
    bill: expense.fileName || "-",
    paymentStatus,
    status: "Pending Approval",
    canSend: true,
  };
}

function readFromStorage() {
  if (typeof window === "undefined") return initialExpenseRecords;
  try {
    const stored = localStorage.getItem(EXPENSE_RECORDS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return initialExpenseRecords;
}

function persistExpenses(expenses) {
  if (typeof window !== "undefined") {
    localStorage.setItem(EXPENSE_RECORDS_STORAGE_KEY, JSON.stringify(expenses));
  }
}

export const useExpenseRecordsStore = create((set, get) => ({
  expenses: initialExpenseRecords,
  hydrated: false,

  hydrateFromStorage: () => {
    if (get().hydrated) return;
    const expenses = readFromStorage();
    set({ expenses, hydrated: true });
  },

  addExpenseFromEventCosting: (payload) => {
    const record = eventCostingToExpenseRecord(payload);
    const expenses = [record, ...get().expenses];
    persistExpenses(expenses);
    set({ expenses, hydrated: true });
    return record;
  },

  addExpenseFromForm: (expense) => {
    const record = formExpenseToRecord(expense);
    const expenses = [record, ...get().expenses];
    persistExpenses(expenses);
    set({ expenses, hydrated: true });
    return record;
  },
}));
