import { create } from "zustand";
import api from "@/services/axios";
import moment from "moment";

function formatExpenseDate(date) {
  if (!date) return "-";
  const parsed = moment(date);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "-";
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
  budgetExpenseId = "",
}) {
  const total = parseAmount(totalAmount);
  const status = approvalStatus === "Approved" ? "Approved" : "Pending Approval";

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    budgetExpenseId,
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
    remark: expense.remark,
    vendor: expense.vendorName?.trim() || "-",
    bill: expense.fileName || "-",
    paymentStatus,
    status: "Pending Approval",
    canSend: true,
    addedFromPopup: true,
  };
}

// Map a raw API expense record into the shape the table expects.
function apiExpenseToRecord(item) {
  return {
    id: item.expenseId,
    description: item.desc || "-",
    type: item.type || "-",
    event: item.eventName || item.event || "-",
    portfolio: item.budgetTypeDetails?.budgetType || "-",
    date: formatExpenseDate(item.date || item.createdAt),
    // Keep this numeric so aggregates and deltas stay reliable.
    totalAmount: parseAmount(item.total),
    remark: item.remark || "-",
    vendor: item.vendorName || item.vendor || "-",
    bill: item.billFileName || item.bill || "-",
    paymentStatus: item.paymentStatus || "Pending",
    status: item.approvalStatus || item.status || "Pending Approval",
    canSend: (item.approvalStatus || item.status) !== "Approved",
    reminderCount: item.reminderCount ?? 0,
    lastReminderDate: item.lastReminderDate || "",
  };
}

export const useExpenseRecordsStore = create((set, get) => ({
  expenses: [],
  totalCount: 0,
  totalExpense: 0,
  totalAmount: 0,
  pendingCount: 0,
  loading: false,
  error: null,
  stats: { totalExpenses: 0, pendingCount: 0, totalAmount: 0 },
  hydrated: false,

  hydrateFromStorage: () => {
    if (get().hydrated) return;
    set({ hydrated: true });
  },

  /**
   * Fetch expenses using the shared axios client.
   */
  fetchExpenses: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const {
        page = 1,
        limit = 10,
        type = "all",
        eventId = "",
        approvedStatus = "",
      } = filters;

      const start = (page - 1) * limit + 1;
      const offset = page * limit;
      const networkClusterCode = localStorage.getItem("networkClusterCode");

      const response = await api.get("/smartOffice/expense", {
        params: {
          networkClusterCode,
          start,
          offset,
          type: type || "all",
          eventId: eventId || "",
          approvedStatus: approvedStatus || "",
        },
      });

      if (response.status === 200 && response.data?.success) {
        const result = response.data.result || [];
        set({
          expenses: result.map(apiExpenseToRecord),
          totalCount: response.data.totalExpense || 0,
          totalExpense: response.data.totalExpense || 0,
          totalAmount: response.data.totalAmount || 0,
          pendingCount: response.data.pendingCount || 0,
          loading: false,
          hydrated: true,
        });
        return response.data;
      }

      set({
        expenses: [],
        totalCount: 0,
        stats: { totalExpenses: 0, pendingCount: 0, totalAmount: 0 },
        loading: false,
        hydrated: true,
      });
    } catch (err) {
      console.error("fetchExpenses API Error:", err);
      set({
        error: err.message || "Failed to load expenses",
        expenses: [],
        totalCount: 0,
        loading: false,
        hydrated: true,
      });
    }
  },

  addExpenseFromEventCosting: (payload) => {
    const record = eventCostingToExpenseRecord(payload);
    const isPending = record.status === "Pending Approval";

    // Keep summary cards in sync with the new row.
    set((state) => ({
      expenses: [record, ...state.expenses],
      totalCount: (Number(state.totalCount) || 0) + 1,
      totalExpense: (Number(state.totalExpense) || 0) + 1,
      totalAmount: (Number(state.totalAmount) || 0) + (Number(record.totalAmount) || 0),
      pendingCount: (Number(state.pendingCount) || 0) + (isPending ? 1 : 0),
      hydrated: true,
    }));

    api
      .post("/smartOffice/expense", record)
      .catch((err) => console.error("Failed to sync costing expense to server:", err));

    return record;
  },

  addExpenseFromForm: (expense) => {
    const record = formExpenseToRecord(expense);
    const isPending = record.status === "Pending Approval";

    // Keep summary cards in sync with the new row.
    set((state) => ({
      expenses: [record, ...state.expenses],
      totalCount: (Number(state.totalCount) || 0) + 1,
      totalExpense: (Number(state.totalExpense) || 0) + 1,
      totalAmount: (Number(state.totalAmount) || 0) + (Number(record.totalAmount) || 0),
      pendingCount: (Number(state.pendingCount) || 0) + (isPending ? 1 : 0),
      hydrated: true,
    }));

    api
      .post("/smartOffice/expense", record)
      .catch((err) => console.error("Failed to sync form expense to server:", err));

    return record;
  },

  updateExpense: (id, updatedFields) => {
    let matchedExpense = null;
    let amountDelta = 0;

    const expenses = get().expenses.map((e) => {
      if (String(e.id) !== String(id)) return e;

      const oldAmount = Number(e.totalAmount) || 0;
      const hasNewAmount =
        updatedFields.totalAmount !== undefined && updatedFields.totalAmount !== "";
      const newAmount = hasNewAmount ? Number(updatedFields.totalAmount) || 0 : oldAmount;
      amountDelta = newAmount - oldAmount;

      matchedExpense = {
        ...e,
        // Fall back to the existing value so unspecified fields aren't wiped to "-".
        description: updatedFields.description ?? e.description,
        type: updatedFields.expenseType || updatedFields.type || e.type,
        event: updatedFields.event || e.event || "-",
        portfolio: updatedFields.portfolio || e.portfolio || "-",
        totalAmount: newAmount,
        remark: updatedFields.remark ?? e.remark,
        vendor: updatedFields.vendorName || updatedFields.vendor || e.vendor || "-",
        bill: updatedFields.fileName || updatedFields.bill || e.bill || "-",
      };
      return matchedExpense;
    });

    // THE FIX: shift the summary "Total Amount" by the price delta so the
    // top cards reflect the edit immediately.
    set((state) => ({
      expenses,
      totalAmount: (Number(state.totalAmount) || 0) + amountDelta,
    }));

    if (matchedExpense) {
      api
        .patch("/smartOffice/expense", { id, ...matchedExpense })
        .catch((err) => console.error("Failed to sync updated expense to server:", err));
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
    set({ expenses });

    if (matchedExpense) {
      api
        .patch("/smartOffice/expense", { id, paymentStatus })
        .catch((err) => console.error("Failed to sync payment status to server:", err));
    }
  },
}));