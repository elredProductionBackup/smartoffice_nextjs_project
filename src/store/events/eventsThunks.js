// redux/events/eventThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { addDocument, addMemberMedia, closeEvent, deleteMemberMedia, deleteMyDocument, getEventDetails, getEventMembers, getEventsList, getMasterList, getMembersMedia, getMyDocuments, updateMasterList  } from "@/services/events.service";

import { addActionable, addComment, addSubTask, deleteActionable, deleteComment, deleteSubTask, getActionables, getCollaborators } from "@/services/actionable.service";

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
        eventId,
        list: res.data?.result || [],
        total: res.data?.totalCount || 0,
        page,
        limit,
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

export const fetchMembersMedia = createAsyncThunk(
  "media/fetchMembersMedia",
  async ({ eventId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const start = (page - 1) * limit + 1;
      const offset = limit;

      const res = await getMembersMedia({ eventId, start, offset });

      return {
        eventId,
        list: res.data?.result || [],
        total: res.data?.memberMediaFileCount || 0,
        page,
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err.message
      );
    }
  }
);
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
        page,
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


// ─── Event Checklist Thunks ─────────────────────

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
      return {
        list: res.data.result || [],
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