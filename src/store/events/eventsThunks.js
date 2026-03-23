// redux/events/eventThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { getEventMembers, getEventsList, getMasterList, updateMasterList } from "@/services/events.service";
import {
  getActionables,
  addActionable,
  deleteActionable,
  addComment,
  deleteComment,
  addSubTask,
  deleteSubTask
} from "@/services/actionable.service";

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

// ─── Event Checklist Thunks (Actionables within an Event) ─────────────────────

// ─── localStorage helpers for persisting completed states per event ────────────
const COMPLETED_KEY = (eventId) => `checklist_completed_${eventId}`;

export const loadPersistedCompleted = (eventId) => {
  try {
    const raw = localStorage.getItem(COMPLETED_KEY(eventId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const persistCompleted = (eventId, actionableId, isCompleted) => {
  try {
    const map = loadPersistedCompleted(eventId);
    if (isCompleted) {
      map[actionableId] = true;
    } else {
      delete map[actionableId];
    }
    localStorage.setItem(COMPLETED_KEY(eventId), JSON.stringify(map));
  } catch {}
};
// ──────────────────────────────────────────────────────────────────────────────

export const fetchEventChecklist = createAsyncThunk(
  "events/fetchEventChecklist",
  async ({ eventId, page = 1, limit = 100 }, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");
      const start = (page - 1) * limit + 1;
      const res = await getActionables({
        networkClusterCode,
        start,
        offset: limit,
        eventId,
      });

      // Merge persisted completed states so checked tasks survive page refresh
      const completedMap = loadPersistedCompleted(eventId);
      const list = (res.data.result || []).map((item) => {
        const id = item.actionableId || item._id || item.id;
        if (completedMap[id]) {
          return { ...item, isCompleted: true };
        }
        return item;
      });

      return {
        list,
        total: res.data?.totalEventsCount || 0,
      };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

export const createEventActionable = createAsyncThunk(
  "events/createEventActionable",
  async (payload, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");
      const { tempId, eventMeta, ...rest } = payload;
      const res = await addActionable({
        ...rest,
        networkClusterCode,
        // linkedEvent: [eventMeta], 
        actionableId: ""
      });
      return { item: res.data.result[0], tempId };
    } catch (err) {
      return rejectWithValue({
        message: err?.response?.data?.message || err.message,
        tempId: payload.tempId,
      });
    }
  }
);

export const updateEventActionable = createAsyncThunk(
  "events/updateEventActionable",
  async (payload, { rejectWithValue }) => {
    try {
      const { actionableId, ...updates } = payload;
      const networkClusterCode = localStorage.getItem("networkClusterCode");
      await addActionable({ ...updates, actionableId, networkClusterCode });
      return payload;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

export const toggleEventActionable = createAsyncThunk(
  "events/toggleEventActionable",
  async ({ actionableId, isCompleted }, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");
      await addActionable({ actionableId, isCompleted, networkClusterCode });
      return { actionableId, isCompleted };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

export const removeEventActionable = createAsyncThunk(
  "events/removeEventActionable",
  async ({ actionableId, networkClusterCode }, { rejectWithValue }) => {
    try {
      await deleteActionable({ actionableId, networkClusterCode });
      return { actionableId };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

export const createEventSubTask = createAsyncThunk(
  "events/createEventSubTask",
  async ({ actionableId, title, tempId }, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");
      const res = await addSubTask({ actionableId, title, networkClusterCode, _id: "" });
      return { actionableId, subTask: res.data.result[0], tempId };
    } catch (err) {
      return rejectWithValue({ actionableId, tempId });
    }
  }
);

export const updateEventSubTask = createAsyncThunk(
  "events/updateEventSubTask",
  async (payload, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");
      const res = await addSubTask({ ...payload, networkClusterCode });
      return { actionableId: payload.actionableId, subTask: res.data.result[0] };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

export const removeEventSubTask = createAsyncThunk(
  "events/removeEventSubTask",
  async ({ actionableId, subTaskId }, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");
      await deleteSubTask({ actionableId, _id: subTaskId, networkClusterCode });
      return { actionableId, subTaskId };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

export const createEventComment = createAsyncThunk(
  "events/createEventComment",
  async ({ actionableId, comment, tempId }, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");
      const res = await addComment({ actionableId, comment, networkClusterCode, _id: "" });
      return { actionableId, comment: res.data.result[0], tempId };
    } catch (err) {
      return rejectWithValue({ actionableId, tempId });
    }
  }
);

export const removeEventComment = createAsyncThunk(
  "events/removeEventComment",
  async ({ actionableId, commentId }, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");
      await deleteComment({ actionableId, commentId, networkClusterCode });
      return { actionableId, commentId };
    } catch (err) {
      return rejectWithValue({ actionableId });
    }
  }
);