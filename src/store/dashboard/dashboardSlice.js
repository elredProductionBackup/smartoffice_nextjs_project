import { createSlice } from "@reduxjs/toolkit";
import { fetchDashboardActionables, fetchDashboardApprovals } from "./dashboardThunks";

const initialState = {
  // actionables (same keys as before, so existing components keep working)
  items: [],
  loading: false,
  error: null,

  // approvals
  approvals: [],
  approvalsTotal: 0,
  approvalsLoading: false,
  approvalsError: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ----- actionables -----
      .addCase(fetchDashboardActionables.pending, (state, action) => {
        if (!action.meta.arg?.silent) state.loading = true; // silent = background refresh, no shimmer
        state.error = null;
      })
      .addCase(fetchDashboardActionables.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDashboardActionables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ----- approvals -----
      .addCase(fetchDashboardApprovals.pending, (state, action) => {
        if (!action.meta.arg?.silent) state.approvalsLoading = true;
        state.approvalsError = null;
      })
      .addCase(fetchDashboardApprovals.fulfilled, (state, action) => {
        state.approvalsLoading = false;
        state.approvals = action.payload.list;
        state.approvalsTotal = action.payload.totalCount;
      })
      .addCase(fetchDashboardApprovals.rejected, (state, action) => {
        state.approvalsLoading = false;
        state.approvalsError = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
