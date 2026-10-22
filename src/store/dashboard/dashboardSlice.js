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
      .addCase(fetchDashboardActionables.pending, (state, action) => {
        if (!action.meta.arg?.silent) state.loading = true; // silent = background refresh, no shimmer
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
