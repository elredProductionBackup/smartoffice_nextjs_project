// store/dashboardActionableThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { getActionables } from "@/services/actionable.service";

// store/dashboardActionableThunks.js
export const fetchDashboardActionables = createAsyncThunk(
  "dashboardActionable/fetchDashboardActionables",
  async (_, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");

      const res = await getActionables({
        networkClusterCode,
        start: 1,
        offset: 5,
        dueSearchKey: "all",
        category: "all",
      });

      const list = res.data?.result || [];

      return list;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);