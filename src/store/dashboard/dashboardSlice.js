// store/dashboardActionableSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { fetchDashboardActionables } from "./dashboardThunks";

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardActionables.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardActionables.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDashboardActionables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
