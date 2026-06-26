import { create } from "zustand";

export const FINANCE_ITEMS_STORAGE_KEY = "smartoffice_finance_items";

export const initialFinanceItems = [
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

function getInitials(name) {
  if (!name?.trim()) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

function readFromStorage() {
  if (typeof window === "undefined") return initialFinanceItems;
  try {
    const stored = localStorage.getItem(FINANCE_ITEMS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return initialFinanceItems;
}

function persistItems(items) {
  if (typeof window !== "undefined") {
    localStorage.setItem(FINANCE_ITEMS_STORAGE_KEY, JSON.stringify(items));
  }
}

export const useFinanceStore = create((set, get) => ({
  items: initialFinanceItems,
  hydrated: false,

  hydrateFromStorage: () => {
    if (get().hydrated) return;
    const items = readFromStorage();
    set({ items, hydrated: true });
  },

  addExpenseFromForm: (expense) => {
    const newItem = expenseToFinanceItem(expense);
    const items = [newItem, ...get().items];
    persistItems(items);
    set({ items, hydrated: true });
    return newItem;
  },
}));
