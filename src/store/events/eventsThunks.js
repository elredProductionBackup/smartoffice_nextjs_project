// redux/events/eventThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { getEventsList } from "@/services/events.service";
import { getCollaborators } from "@/services/actionable.service";

const mapTabToFilter = (tab) => {
  if (tab === "upcoming") return "upcomming";
  return tab;
};
export const fetchEvents = createAsyncThunk(
  "events/fetchEvents",
  async ({ page, limit, search, filterBy }, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");

      const safePage = Math.max(1, Number(page) || 1);
      const safeLimit = Math.max(1, Number(limit) || 10);

      const start = (safePage - 1) * safeLimit; 
      const offset = safeLimit;  

      const res = await getEventsList({
        networkClusterCode,
        start,
        offset,
        filterBy: mapTabToFilter(filterBy),
        searchKey: search || "",
      });

      return {
        list: res.data.result || [],
        total: res.data?.totalEventsCount || 0,
      };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// Fetch Collaborators
export const fetchCollaborators = createAsyncThunk(
  "events/fetchCollaborators",
  async ({ search = "", offset = 0 }, { rejectWithValue }) => {
    try {
      const networkClusterCode =
        localStorage.getItem("networkClusterCode");

      const res = await getCollaborators({
        networkClusterCode,
        search,
        offset,
      });

      return res?.data?.result; 
    } catch (err) {
      return rejectWithValue(err?.response?.data);
    }
  }
);