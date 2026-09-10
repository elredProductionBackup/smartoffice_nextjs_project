import { create } from "zustand";
import api from "@/services/axios";

function getInitials(name) {
  if (!name?.trim()) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function timeAgo(dateStr) {
  if (!dateStr) return "Just now";
  const then = new Date(dateStr);
  if (Number.isNaN(then.getTime())) return dateStr;
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

export function expenseToFinanceItem(expense) {
  const hasBalance = Number(expense.balance) > 0;
  const vendorName = expense.vendorName?.trim() || "Unknown vendor";

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    status: hasBalance ? "Payment pending" : "Approval pending",
    statusType: hasBalance ? "payment" : "approval",
    title: "Invoice Approval Request",
    description:
      expense.description?.trim() ||
      `${expense.expenseType || "General"} expense submission`,
    time: "Just now",
    timeType: hasBalance ? "danger" : "warning",
    user: {
      initials: getInitials(vendorName),
      name: vendorName,
      avatarColor: hasBalance ? "bg-[#0F9D58]" : "bg-[#1A73E8]",
    },
  };
}

// Map a raw API expense record into a finance-list item.
function apiExpenseToFinanceItem(item) {
  const isApproved = item.approvedStatus === "approved";
  const vendorName = (item.vendorName || "").trim() || "Unknown vendor";
  const rawDate = item.createdAt || null;

  return {
    id: item.expenseId,
    rawDate,
    status: isApproved ? "Approved" : "Approval pending",
    statusType: isApproved ? "payment" : "approval",
    title: item.desc?.trim(),
    description: item.desc?.trim() || "-",
    time: timeAgo(rawDate),
    timeType: isApproved ? "danger" : "warning",
    user: {
      initials: getInitials(vendorName),
      name: vendorName,
      avatarColor: isApproved ? "bg-[#0F9D58]" : "bg-[#1A73E8]",
    },
  };
}

export const useFinanceStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,
  hydrated: false,

  fetchFinanceItems: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const { page = 1, limit = 10 } = filters;
      const start = (page - 1) * limit + 1;
      const offset = page * limit;
      const networkClusterCode = localStorage.getItem("networkClusterCode");

      const response = await api.get("/smartOffice/expense", {
        params: {
          networkClusterCode,
          start,
          offset,
          type: "all",
        },
      });

      if (response.status === 200 && response.data?.success) {
        const result = response.data.result || [];
        set({
          items: result.map(apiExpenseToFinanceItem),
          loading: false,
          hydrated: true,
        });
        return response.data;
      }

      set({ items: [], loading: false, hydrated: true });
    } catch (err) {
      console.error("fetchFinanceItems API Error:", err);
      set({
        error: err.message || "Failed to load finance items",
        items: [],
        loading: false,
        hydrated: true,
      });
    }
  },

  addExpenseFromForm: (expense) => {
    const newItem = expenseToFinanceItem(expense);
    set({ items: [newItem, ...get().items], hydrated: true });
    return newItem;
  },
}));