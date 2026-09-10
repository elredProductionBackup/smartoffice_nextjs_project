import { createSlice } from "@reduxjs/toolkit";
import {
  fetchBudgetTypes,
  fetchBudgetCategories,
  addBudgetCategory,
  removeBudgetCategory,
  fetchEventBudgetExpense,
  fetchBudgetCategoryVersions,
  patchBudgetCategoryVersion,
  fetchExpenses,
  addEditEventExpense,
  deleteExpense,
  updateEventBudget,
} from "./eventCostingThunks";

const initialState = {
  budgetTypes: [],
  categories: [],
  eventBudget: [], // #7 rows { budgetCategoryId, budgetType, percentage, amount }
  versions: [], // #9 rows
  expenses: [], // #5 rows
  budgetTotal: 0, // event's total budget (from #7 sum or updateEventBudget)
  versionMeta: {}, // UI: { [versionId]: { label } } — the editable PAX heading
  loading: {
    budgetTypes: false,
    categories: false,
    eventBudget: false,
    versions: false,
    expenses: false,
  },
  saving: false,
  error: null,
};

const slice = createSlice({
  name: "eventCosting",
  initialState,
  reducers: {
    // Editable version heading (e.g. type "120 PAX"). UI/session only —
    // there's no server field for it in the current spec.
    setVersionMeta(state, action) {
      const { versionId, label } = action.payload;
      state.versionMeta[versionId] = {
        ...(state.versionMeta[versionId] || {}),
        label,
      };
    },
    resetEventCosting() {
      return initialState;
    },
  },
  extraReducers: (b) => {
    b
      // #1 budget types
      .addCase(fetchBudgetTypes.pending, (s) => {
        s.loading.budgetTypes = true;
      })
      .addCase(fetchBudgetTypes.fulfilled, (s, a) => {
        s.loading.budgetTypes = false;
        s.budgetTypes = a.payload.items;
      })
      .addCase(fetchBudgetTypes.rejected, (s, a) => {
        s.loading.budgetTypes = false;
        s.error = a.payload;
      })

      // #8 categories
      .addCase(fetchBudgetCategories.pending, (s) => {
        s.loading.categories = true;
      })
      .addCase(fetchBudgetCategories.fulfilled, (s, a) => {
        s.loading.categories = false;
        s.categories = a.payload.items;
      })
      .addCase(fetchBudgetCategories.rejected, (s, a) => {
        s.loading.categories = false;
        s.error = a.payload;
      })
      // #2 / #3 category add / remove
      .addCase(addBudgetCategory.fulfilled, (s, a) => {
        s.categories.push(a.payload);
      })
      .addCase(removeBudgetCategory.fulfilled, (s, a) => {
        s.categories = s.categories.filter(
          (c) => (c.budgetCategoryId || c._id) !== a.payload
        );
      })

      // #7 event budget breakup
      .addCase(fetchEventBudgetExpense.pending, (s) => {
        s.loading.eventBudget = true;
      })
      .addCase(fetchEventBudgetExpense.fulfilled, (s, a) => {
        s.loading.eventBudget = false;
        s.eventBudget = a.payload;
        s.budgetTotal = a.payload.reduce((sum, r) => sum + (r.amount || 0), 0);
      })
      .addCase(fetchEventBudgetExpense.rejected, (s, a) => {
        s.loading.eventBudget = false;
        s.error = a.payload;
      })

      // #9 versions
      .addCase(fetchBudgetCategoryVersions.pending, (s) => {
        s.loading.versions = true;
      })
      .addCase(fetchBudgetCategoryVersions.fulfilled, (s, a) => {
        s.loading.versions = false;
        s.versions = a.payload;
      })
      .addCase(fetchBudgetCategoryVersions.rejected, (s, a) => {
        s.loading.versions = false;
        s.error = a.payload;
      })
      // #10 patch split
      .addCase(patchBudgetCategoryVersion.pending, (s) => {
        s.saving = true;
      })
      .addCase(patchBudgetCategoryVersion.fulfilled, (s, a) => {
        s.saving = false;
        const v = s.versions.find(
          (x) =>
            (x.budgetCategoryVersionId || x._id) ===
            a.payload.budgetCategoryVersionId
        );
        if (v && Array.isArray(v.splits)) {
          const split = v.splits.find(
            (sp) => sp.splitName === a.payload.splitName
          );
          if (split) {
            split.qty = a.payload.qty;
            split.rate = a.payload.rate;
            split.totalSplit = a.payload.totalSplit;
          }
        }
      })
      .addCase(patchBudgetCategoryVersion.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload;
      })

      // #5 expenses
      .addCase(fetchExpenses.pending, (s) => {
        s.loading.expenses = true;
      })
      .addCase(fetchExpenses.fulfilled, (s, a) => {
        s.loading.expenses = false;
        s.expenses = a.payload.items;
      })
      .addCase(fetchExpenses.rejected, (s, a) => {
        s.loading.expenses = false;
        s.error = a.payload;
      })
      // #11 add event expense
      .addCase(addEditEventExpense.pending, (s) => {
        s.saving = true;
      })
      .addCase(addEditEventExpense.fulfilled, (s) => {
        s.saving = false;
      })
      .addCase(addEditEventExpense.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload;
      })
      // #6 delete expense
      .addCase(deleteExpense.fulfilled, (s, a) => {
        s.expenses = s.expenses.filter(
          (e) => (e.budgetExpenseId || e.expenseId || e._id) !== a.payload
        );
      })

      // addEvents — update total budget
      .addCase(updateEventBudget.pending, (s) => {
        s.saving = true;
      })
      .addCase(updateEventBudget.fulfilled, (s, a) => {
        s.saving = false;
        s.budgetTotal = a.payload.eventBudget; // optimistic; #7 refetch follows
      })
      .addCase(updateEventBudget.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload;
      });
  },
});

export const { setVersionMeta, resetEventCosting } = slice.actions;
export default slice.reducer;

// ── selectors ─────────────────────────────────────────────────────────────
export const selectCategories = (st) => st.eventCosting.categories;
export const selectEventBudget = (st) => st.eventCosting.eventBudget;
export const selectVersions = (st) => st.eventCosting.versions;
export const selectExpenses = (st) => st.eventCosting.expenses;
export const selectBudgetTotal = (st) => st.eventCosting.budgetTotal;
export const selectVersionMeta = (st) => st.eventCosting.versionMeta;
export const selectSaving = (st) => st.eventCosting.saving;
export const selectLoading = (st) => st.eventCosting.loading;
export const selectError = (st) => st.eventCosting.error;