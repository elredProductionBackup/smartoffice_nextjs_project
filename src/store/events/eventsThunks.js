// redux/events/eventThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { addDocument, addMemberMedia, closeEvent, deleteMemberMedia, deleteMyDocument, getEventDetails, getEventMembers, getEventsList, getMasterList, getMembersMedia, getMyDocuments, updateMasterList  } from "@/services/events.service";

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

      const start = (page - 1) * limit + 1;
      const offset = limit;
      
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


// GET
export const fetchMasterConfig = createAsyncThunk(
  "events/fetchMasterConfig",
  async (_, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");
      const res = await getMasterList(networkClusterCode);
      return res.data.result[0];
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// PATCH (Checklist + Points together)
export const saveMasterConfig = createAsyncThunk(
  "events/saveMasterConfig",
  async (_, { getState, rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");
      const { checklistMaster, pointsMaster } = getState().events;

      const payload = {
        networkClusterCode,
        checkList: checklistMaster.map((c) => ({
          itemName: c.label,
          priority:
            c.difficulty === "hard"
              ? "veryDifficult"
              : c.difficulty === "medium"
              ? "mildlyDifficult"
              : "easyToDo",
        })),
        pointsList: pointsMaster.map((p) => ({
          pointName: p.label,
          point: Number(p.points),
        })),
      };

      const res = await updateMasterList(payload);

      return res.data.result[0];

    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// Events Attendees
export const fetchEventMembers = createAsyncThunk(
  "events/fetchEventMembers",
  async (
    { eventId, page = 1, limit = 10, searchKey = "", searchBy = "all" },
    { rejectWithValue }
  ) => {
    try {
      const start = (page - 1) * limit + 1;
      const offset = limit;

      const res = await getEventMembers({
        eventId,
        start,
        offset,
      });

      return {
        list: res.data?.result || [],
        total: res.data?.totalCount || 0,
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err.message
      );
    }
  }
);

export const fetchEventDetails = createAsyncThunk(
  "events/fetchEventDetails",
  async ({ eventId }, { getState, rejectWithValue }) => {
    try {
      const { events } = getState();

      if (events.eventDetailsFetched?.[eventId]) {
        return { eventId, skip: true };
      }

      const res = await getEventDetails({ eventId });
      return {
        eventId,
        data: res?.data.result[0]
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err.message
      );
    }
  }
);

export const closeEventThunk = createAsyncThunk(
  "events/closeEvent",
  async ({ eventId }, { rejectWithValue }) => {
    try {
      const res = await closeEvent({ eventId });
      return res?.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err.message
      );
    }
  }
);

// Fetch Member Media
export const fetchMembersMedia = createAsyncThunk(
  "media/fetchMembersMedia",
  async ({ eventId, page = 1, limit = 30 }, { rejectWithValue }) => {
    try {
      const start = (page - 1) * limit + 1;
      const offset = limit;

      const res = await getMembersMedia({ eventId, start, offset });

      return {
        eventId, 
        list: res.data?.result || [],
        total: res.data?.memberMediaFileCount || 0,
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err.message
      );
    }
  }
);

// Fetch Documents
export const fetchDocuments = createAsyncThunk(
  "media/fetchDocuments",
  async ({ eventId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const start = (page - 1) * limit + 1;
      const offset = limit;

      const res = await getMyDocuments({ eventId, start, offset });

      return {
        eventId,
        list: res.data?.result || [],
        total: res.data?.documentFileCount || 0,
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err.message
      );
    }
  }
);

// Upload Member Media
export const uploadMemberMedia = createAsyncThunk(
  "media/uploadMemberMedia",
  async ({ files, eventId }, { rejectWithValue }) => {
    try {
      const res = await addMemberMedia({
        mediaFiles: files,
        eventId,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err.message
      );
    }
  }
);

export const uploadDocument = createAsyncThunk(
  "media/uploadDocument",
  async ({ files, eventId }, { rejectWithValue }) => {
    try {
      const res = await addDocument({
        documentFiles: files,
        eventId,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err.message
      );
    }
  }
);

export const deleteMembersMedia = createAsyncThunk(
  "media/deleteMembersMedia",
  async ({ eventId, deleteURL }, { rejectWithValue }) => {
    try {
      const res = await deleteMemberMedia({ eventId, deleteURL });
      return { eventId, deleteURL, data: res.data };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err.message
      );
    }
  }
);

export const deleteDocument = createAsyncThunk(
  "media/deleteDocument",
  async ({ eventId, deleteURL }, { rejectWithValue }) => {
    try {
      const res = await deleteMyDocument({ eventId, deleteURL });
      return { eventId, deleteURL, data: res.data };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err.message
      );
    }
  }
);