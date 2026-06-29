import { createSlice } from "@reduxjs/toolkit";
import {
  fetchBudgetTypes,
  fetchBudgetCategories,
  addBudgetCategory,
  removeBudgetCategory,
} from "./budgetThunks";

const initialState = {
  budgetTypes: [],
  categories: [],
  selectedBudgetType: null,

  loadingTypes: false,
  loadingCategories: false,
  addingCategory: false,
  deletingCategory: false,
};

const budgetSlice = createSlice({
  name: "budget",

  initialState,

  reducers: {
    setSelectedBudgetType: (state, action) => {
      state.selectedBudgetType = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(fetchBudgetTypes.pending, (state) => {
        state.loadingTypes = true;
      })

.addCase(fetchBudgetTypes.fulfilled, (state, action) => {
  state.loadingTypes = false;
  state.budgetTypes = action.payload;
})
      .addCase(fetchBudgetCategories.pending, (state) => {
        state.loadingCategories = true;
      })

      .addCase(fetchBudgetCategories.fulfilled, (state, action) => {
        state.loadingCategories = false;
        state.categories = action.payload.categories;
      })

      .addCase(addBudgetCategory.pending, (state) => {
        state.addingCategory = true;
      })

      .addCase(addBudgetCategory.fulfilled, (state) => {
        state.addingCategory = false;
      })

      .addCase(addBudgetCategory.rejected, (state) => {
        state.addingCategory = false;
      })
      .addCase(removeBudgetCategory.pending, (state) => {
            state.deletingCategory = true;
        })

        .addCase(removeBudgetCategory.fulfilled, (state) => {
            state.deletingCategory = false;
        })

        .addCase(removeBudgetCategory.rejected, (state) => {
            state.deletingCategory = false;
        })
  },
});

export const { setSelectedBudgetType } =
  budgetSlice.actions;

export default budgetSlice.reducer;