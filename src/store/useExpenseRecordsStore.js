import { create } from "zustand";

export const EXPENSE_RECORDS_STORAGE_KEY = "smartoffice_expense_records_v2";

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
    reminderCount: 2,
    lastReminderDate: "2026-06-08",
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
    reminderCount: 1,
    lastReminderDate: "2026-06-05",
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
    reminderCount: 3,
    lastReminderDate: "2026-06-09",
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
  description,
  narrative,
  category,
  eventName,
  portfolio,
  date,
  totalAmount,
  remark,
  vendorName,
  billFileName,
  approvalStatus = "Pending",
  budgetExpenseId = "",   // ← real backend ID returned by addEditExpense
}) {
  const total = parseAmount(totalAmount);
  const status = approvalStatus === "Approved" ? "Approved" : "Pending Approval";

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    budgetExpenseId,                         // ← persisted so delete works after reload
    description: description?.trim() || narrative?.trim() || category || "Event expense",
    type: "Event Related",
    event: eventName || "-",
    portfolio: portfolio || "-",
    date: formatExpenseDate(date),
    totalAmount: total,
    remark: remark,
    vendor: vendorName?.trim() || "-",
    bill: billFileName || "-",
    paymentStatus: "Pending",
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
    addedFromPopup: true,
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
  totalCount: 0,
  loading: false,
  error: null,
  stats: { totalExpenses: 0, pendingCount: 0, totalAmount: 0 },
  hydrated: false,

  hydrateFromStorage: () => {
    if (get().hydrated) return;
    const expenses = readFromStorage();
    set({ expenses, hydrated: true });
  },

  /**
   * Fetch expenses from the local Next.js API route:
   *   GET /smartOffice/expense?start=&offset=&type=&eventId=&approvedStatus=
   */
  fetchExpenses: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const {
        start = 0,
        offset = 10,
        type = "all",
        eventId = "",
        approvedStatus = "",
      } = filters;

      const queryParams = new URLSearchParams({
        start: String(start),
        offset: String(offset),
        type: type || "all",
        eventId: eventId || "",
        approvedStatus: approvedStatus || "",
      });

      const response = await fetch(`/smartOffice/expense?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch expenses: ${response.statusText}`);
      }
      const data = await response.json();
      set({
        expenses: data.expenses || [],
        totalCount: data.totalCount || 0,
        stats: data.stats || { totalExpenses: 0, pendingCount: 0, totalAmount: 0 },
        loading: false,
      });
      return data;
    } catch (err) {
      console.error("fetchExpenses API Error:", err);
      set({ error: err.message || "Failed to load expenses", loading: false });
      // Fallback to localStorage if API fails
      const expenses = readFromStorage();
      set({ expenses, hydrated: true });
    }
  },

  addExpenseFromEventCosting: (payload) => {
    const record = eventCostingToExpenseRecord(payload);
    const expenses = [record, ...get().expenses];
    persistExpenses(expenses);
    set({ expenses, hydrated: true });

    // Background sync to local API
    fetch("/smartOffice/expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    }).catch((err) => console.error("Failed to sync costing expense to server:", err));

    return record;
  },

  addExpenseFromForm: (expense) => {
    const record = formExpenseToRecord(expense);
    const expenses = [record, ...get().expenses];
    persistExpenses(expenses);
    set({ expenses, hydrated: true });

    // Background sync to local API
    fetch("/smartOffice/expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    }).catch((err) => console.error("Failed to sync form expense to server:", err));

    return record;
  },

  updateExpense: (id, updatedFields) => {
    let matchedExpense = null;
    const expenses = get().expenses.map((e) => {
      if (String(e.id) === String(id)) {
        matchedExpense = {
          ...e,
          description: updatedFields.description,
          type: updatedFields.expenseType || updatedFields.type || e.type,
          event: updatedFields.event || "-",
          portfolio: updatedFields.portfolio || "-",
          totalAmount: Number(updatedFields.totalAmount) || 0,
          remark: updatedFields.remark,
          vendor: updatedFields.vendorName || updatedFields.vendor || "-",
          bill: updatedFields.fileName || updatedFields.bill || "-",
        };
        return matchedExpense;
      }
      return e;
    });
    persistExpenses(expenses);
    set({ expenses });

    // Background sync to local API
    if (matchedExpense) {
      fetch("/smartOffice/expense", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...matchedExpense }),
      }).catch((err) => console.error("Failed to sync updated expense to server:", err));
    }
  },

  updatePaymentStatus: (id, paymentStatus) => {
    let matchedExpense = null;
    const expenses = get().expenses.map((e) => {
      if (e.id === id) {
        matchedExpense = { ...e, paymentStatus };
        return matchedExpense;
      }
      return e;
    });
    persistExpenses(expenses);
    set({ expenses });

    // Background sync to local API
    if (matchedExpense) {
      fetch("/smartOffice/expense", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, paymentStatus }),
      }).catch((err) => console.error("Failed to sync payment status to server:", err));
    }
  },
}));
