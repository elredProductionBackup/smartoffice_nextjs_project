// redux/events/eventThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { addDocument, addMemberMedia, closeEvent, deleteMemberMedia, deleteMyDocument, getEventDetails, getEventMembers, getEventsList, getMasterList, getMembersMedia, getMyDocuments, updateMasterList  } from "@/services/events.service";

import { addActionable, addComment, addSubTask, deleteActionable, deleteComment, deleteSubTask, getActionables, getCollaborators } from "@/services/actionable.service";

const mapTabToFilter = (tab) => {
  if (tab === "upcoming") return "upcomming";
  return tab;
};

const mergeUniqueActionables = (lists = []) => {
  const map = new Map();
  lists.flat().forEach((item) => {
    const id = item?.actionableId || item?._id || item?.id;
    if (!id) return;
    map.set(id, item);
  });
  return Array.from(map.values());
};

const actionableBelongsToEvent = (item, eventId) => {
  if (!eventId) return true;
  const target = String(eventId);

  if (item?.eventId && String(item.eventId) === target) return true;
  if (item?.linkedEventId && String(item.linkedEventId) === target) return true;

  const linked = item?.linkedEvent || item?.linkedEvents;
  if (Array.isArray(linked)) {
    return linked.some((entry) => {
      if (!entry) return false;
      if (typeof entry === "string") return entry === target;
      if (entry.eventId && String(entry.eventId) === target) return true;
      if (entry._id && String(entry._id) === target) return true;
      return false;
    });
  }

  return false;
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
  async ({ eventId, noSkip=false }, { getState, rejectWithValue }) => {
    try {
      const { events } = getState();

      if (!noSkip && events.eventDetailsFetched?.[eventId]) {
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
  async ({ eventId, page = 1, limit = 100 }, { getState, rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");
      const start = (page - 1) * limit + 1;
      const [allRes, pastRes] = await Promise.all([
        getActionables({
          networkClusterCode,
          start,
          offset: limit,
          eventId,
          dueSearchKey: "all",
        }),
        getActionables({
          networkClusterCode,
          start,
          offset: limit,
          eventId,
          dueSearchKey: "past",
        }),
      ]);

      const mergedList = mergeUniqueActionables([
        allRes?.data?.result || [],
        pastRes?.data?.result || [],
      ]);
      const list = mergedList.filter((item) => actionableBelongsToEvent(item, eventId));

      if (process.env.NODE_ENV !== "production") {
        const previous = getState()?.events?.eventChecklist || [];
        const incomingIds = new Set(
          list.map((item) => item.actionableId || item._id || item.id).filter(Boolean)
        );
        const missingCompleted = previous
          .filter((item) => (item.isCompleted === true || item.isCompleted === "true"))
          .filter((item) => !incomingIds.has(item.actionableId || item._id || item.id))
          .map((item) => item.actionableId || item._id || item.id);

        console.log("[events] fetchEventChecklist debug", {
          eventId,
          fetchedCount: list.length,
          fetchedAllCount: (allRes?.data?.result || []).length,
          fetchedPastCount: (pastRes?.data?.result || []).length,
          prevCount: previous.length,
          missingCompletedCount: missingCompleted.length,
          missingCompletedIds: missingCompleted,
        });
      }

      return {
        list,
        total: list.length,
        eventId, // pass eventId to the slicer
      };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);


export const fetchEventTaskSummaries = createAsyncThunk(
  "events/fetchEventTaskSummaries",
  async ({ eventIds }, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");
      const summaries = {};

      await Promise.all(
        eventIds.map(async (eventId) => {
          try {
            const [allRes, pastRes] = await Promise.all([
              getActionables({
                networkClusterCode,
                start: 1,
                offset: 100,
                eventId,
                dueSearchKey: "all",
              }),
              getActionables({
                networkClusterCode,
                start: 1,
                offset: 100,
                eventId,
                dueSearchKey: "past",
              }),
            ]);

            const taskList = mergeUniqueActionables([
              allRes?.data?.result || [],
              pastRes?.data?.result || [],
            ]).filter((item) => actionableBelongsToEvent(item, eventId));

            // Replicated calculation logic
            const summary = {
              hard: { completed: 0, total: 0 },
              medium: { completed: 0, total: 0 },
              easy: { completed: 0, total: 0 },
            };

            taskList.forEach((task) => {
              let key = "easy";
              const cat = (task.category || task.priority || "").toLowerCase();
              if (cat.includes("very") || cat === "hard") key = "hard";
              else if (cat.includes("mildly") || cat === "medium") key = "medium";
              else if (cat.includes("easy") || cat === "easy") key = "easy";
              else return;

              summary[key].total++;
              const isDone = task.isCompleted === true || task.isCompleted === "true";
              if (isDone) summary[key].completed++;
            });

            summaries[eventId] = summary;
          } catch {
            // silent fail for individual event
          }
        })
      );

      return summaries;
    } catch (err) {
      return rejectWithValue(err.message);
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
  async ({ actionableId, isCompleted }, { getState, rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");
      const { events } = getState();
      const existingTask = (events?.eventChecklist || []).find(
        (item) => item.actionableId === actionableId || item._id === actionableId || item.id === actionableId
      );

      const payload = {
        actionableId,
        isCompleted,
        networkClusterCode,
      };

      if (existingTask) {
        if (typeof existingTask.title === "string") payload.title = existingTask.title;
        if (typeof existingTask.category === "string") payload.category = existingTask.category;
        if (typeof existingTask.notes === "string") payload.notes = existingTask.notes;
        if (existingTask.dueDateTimeStamp) payload.dueDateTimeStamp = existingTask.dueDateTimeStamp;

        if (Array.isArray(existingTask.collaborators)) {
          payload.collaborators = existingTask.collaborators
            .map((c) => (typeof c === "string" ? c : c?.userCode))
            .filter(Boolean);
        }

        if (Array.isArray(existingTask.linkedEvent) && existingTask.linkedEvent.length > 0) {
          payload.linkedEvent = existingTask.linkedEvent;
        } else if (events?.selectedEvent?.id) {
          payload.linkedEvent = [{ eventId: events.selectedEvent.id, name: "", url: "" }];
        }
      }

      const res = await addActionable(payload);

      if (process.env.NODE_ENV !== "production") {
        console.log("[events] toggleEventActionable debug", {
          actionableId,
          isCompleted,
          responseSuccess: res?.data?.success,
          responseResult: res?.data?.result,
        });
      }

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