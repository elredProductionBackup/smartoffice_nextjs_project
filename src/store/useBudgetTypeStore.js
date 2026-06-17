import { create } from "zustand";
import { getBudgetType } from "@/services/expense.service";

export const useBudgetTypeStore = create((set, get) => ({
  budgetTypes: [],
  loading: false,
  error: null,
  fetched: false,

  fetchBudgetTypes: async (force = false) => {
    // Return cached data if already fetched and not forced
    if (get().fetched && !force) {
      return get().budgetTypes;
    }

    set({ loading: true, error: null });
    try {
      // Fetch with start=1 and offset=100 to ensure we load all budget types
      const response = await getBudgetType(1, 100);

      // Extract array from response wrapper
      const rawList =
        response?.data?.budgetTypes ??
        response?.data?.budgetType ??
        response?.data ??
        response?.result ??
        response?.budgetType ??
        (Array.isArray(response) ? response : []);

      set({ budgetTypes: rawList, fetched: true, loading: false });
      return rawList;
    } catch (err) {
      console.error("Error fetching budget types in store:", err);
      const errMsg = err?.message || "Failed to load budget types";
      set({ error: errMsg, loading: false });
      throw err;
    }
  },
}));
