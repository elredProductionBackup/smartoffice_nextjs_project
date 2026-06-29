import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getBudgetTypesApi,
  getBudgetCategoriesApi,
  addBudgetCategoryApi,
  removeBudgetCategoryApi
} from "./budgetService";

export const fetchBudgetTypes = createAsyncThunk(
  "budget/fetchTypes",
  async (_, thunkAPI) => {
    try {
      const response = await getBudgetTypesApi({
        start: 1,
        offset: 10,
      });

      return response.data.result;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data);
    }
  }
);

export const fetchBudgetCategories = createAsyncThunk(
  "budget/fetchCategories",
  async (budgetTypeId, thunkAPI) => {
    try {
      const response = await getBudgetCategoriesApi({
        budgetTypeId,
      });

      return {
        budgetTypeId,
        categories: response.data.result,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data);
    }
  }
);

export const addBudgetCategory = createAsyncThunk(
  "budget/addCategory",
  async (payload, thunkAPI) => {
    try {
      await addBudgetCategoryApi(payload);

      thunkAPI.dispatch(
        fetchBudgetCategories(payload.budgetTypeId)
      );

      thunkAPI.dispatch(fetchBudgetTypes());

      return payload;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data);
    }
  }
);

export const removeBudgetCategory = createAsyncThunk(
  "budget/removeBudgetCategory",
  async (
    { budgetCategoryId, budgetTypeId },
    thunkAPI
  ) => {
    try {
      await removeBudgetCategoryApi({
        budgetCategoryId,
      });

      thunkAPI.dispatch(
        fetchBudgetCategories(budgetTypeId)
      );

      thunkAPI.dispatch(
        fetchBudgetTypes()
      );

      return budgetCategoryId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data
      );
    }
  }
);