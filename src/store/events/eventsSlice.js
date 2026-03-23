import { createSlice } from "@reduxjs/toolkit";
import moment from "moment";
import {
  fetchCollaborators,
  fetchEventMembers,
  fetchEvents,
  fetchMasterConfig,
  saveMasterConfig,
  fetchEventChecklist,
  createEventActionable,
  updateEventActionable,
  removeEventActionable,
  toggleEventActionable,
  createEventSubTask,
  updateEventSubTask,
  removeEventSubTask,
  createEventComment,
  removeEventComment,
  fetchEventTaskSummaries,
  fetchEventDetails,
  closeEventThunk
} from "./eventsThunks";

const initialState = {
  groupedEvents: [],
  rawEvents: [],
  loading: false,
  error: null,

  selectedEvent: null,
  eventDetailsMap: {},
  eventDetailsFetched: {},
  eventDetailsError: {},

  page: 1,
  limit: 10,
  total: 0,

  collaboratorsList: [],
  collaboratorsLoading: false,

  checklistMaster: [],
  pointsMaster: [],
  masterLoading: false,

  membersMap: {},
  membersFetched: {},
  membersLoading: {},
  membersTotal: {},
  membersPage: {},

  membersMediaMap: {},
  membersMediaUploadingCount: {},
  membersMediaFetched: {},
  membersMediaLoading: false,
  membersMediaPage: {},
  membersMediaTotal: {},

  documentsPage: {},
  documentsTotal: {},
  documentsMap: {},
  documentsUploadingCount: {},
  documentsFetched: {},
  documentsLoading: false,

  eventChecklist: [],
  eventChecklistLoading: false,
  eventChecklistTotal: 0,

  // Central track for all event task counts by eventId
  eventTaskSummaries: {},
};

const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const mapEventToUI = (event) => {
  const start = moment(event.startDateTime);
  const end = moment(event.endDateTime);
  const startDay = getOrdinal(start.date());
  const endDay = getOrdinal(end.date());

  const rawTasks = event.tasks || {};
  const mappedTasks = {
    hard: rawTasks.veryDifficult || rawTasks.hard || { completed: 0, total: 0 },
    medium: rawTasks.mildlyDifficult || rawTasks.medium || { completed: 0, total: 0 },
    easy: rawTasks.easyToDo || rawTasks.easy || { completed: 0, total: 0 },
  };

  return {
    id: event.eventId,
    eventImage: event.eventImage,
    name: event.eventName,
    date: startDay !== endDay ? `${startDay} - ${endDay}` : endDay,
    // For Redux Event - START
    eventDescription: event.eventDescription,
    startDate: event.startDateTime,
    endDate: event.endDateTime,
    isRegistration: event.isRegistration,
    resource: event.resource,
    additionalNotes: event.additionalNotes,
    // END
    attendees: event.whoCanAttend?.length || 0,
    location: event.eventLocation || "—",
    tasks: mappedTasks,
  };
};

const calculateTaskSummary = (taskList = []) => {
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
    else return; // Skip if unknown category

    summary[key].total++;
    const isDone = task.isCompleted === true || task.isCompleted === "true";
    if (isDone) {
      summary[key].completed++;
    }
  });

  return summary;
};

const updateSummaryInGroupedEvents = (state) => {
  if (!state.selectedEvent || !state.selectedEvent.id) return;

  // Recalculate based on current checklist data
  const newSummary = calculateTaskSummary(state.eventChecklist);

  // Store it in a map keyed by eventId for isolated tracking
  state.eventTaskSummaries[state.selectedEvent.id] = newSummary;

  // Sync selectedEvent object as well (common UI helper)
  state.selectedEvent = { ...state.selectedEvent, tasks: newSummary };
};

const groupEventsByMonth = (events = []) => {
  const grouped = {};

  events.forEach((event) => {
    if (!event?.startDateTime) return;

    const m = moment(event.startDateTime);
    if (!m.isValid()) return;

    const month = m.format("MMMM, YYYY");
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(mapEventToUI(event));
  });

  return Object.keys(grouped).map((month) => ({
    month,
    items: grouped[month],
  }));
};


const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    setPage(state, action) {
      state.page = action.payload;
    },
    setSearch(state, action) {
      state.search = action.payload;
      state.page = 1;
    },
    setActiveTab(state, action) {
      state.activeTab = action.payload;
      state.page = 1;
    },
    resetEventsState: () => initialState,
    setChecklistMaster(state, action) {
      state.checklistMaster = action.payload;
    },
    setPointsMaster(state, action) {
      state.pointsMaster = action.payload;
    },
    setSelectedEvent(state, action) {
      state.selectedEvent = action.payload;
      // CLEAR the checklist when selecting a new event to avoid stale data logic bugs
      state.eventChecklist = [];
      state.eventChecklistTotal = 0;
    },
    localToggleChecklist(state, action) {
      // Pure local toggle — does NOT call the API, task never disappears
      const { actionableId } = action.payload;
      const item = state.eventChecklist.find(
        (t) => t.actionableId === actionableId || t.id === actionableId
      );
      if (item) {
        item.isCompleted = !item.isCompleted;
      }
      updateSummaryInGroupedEvents(state);
    }
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        try {
          state.loading = false;
          state.rawEvents = action.payload.list;
          state.total = action.payload.total;
          state.groupedEvents = groupEventsByMonth(action.payload.list);
          // Re-apply local task summary if we have a selected event
          updateSummaryInGroupedEvents(state);
        } catch (err) {
          console.log("Reducer crash:", err);
        }
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Collaborators 
      .addCase(fetchCollaborators.pending, (state, action) => {
        state.collaboratorsLoading = true;
      })

      .addCase(fetchCollaborators.fulfilled, (state, action) => {
        state.collaboratorsLoading = false;
        state.collaboratorsList = action.payload || [];
      })

      .addCase(fetchCollaborators.rejected, (state, action) => {
        state.collaboratorsLoading = false;
      })
      // Checklist
      .addCase(fetchMasterConfig.pending, (state) => {
        state.masterLoading = true;
      })
      .addCase(fetchMasterConfig.fulfilled, (state, action) => {
        state.masterLoading = false;

        const payload = action.payload || {};
        const checkList = Array.isArray(payload.checkList) ? payload.checkList : [];
        const pointsList = Array.isArray(payload.pointsList) ? payload.pointsList : [];

        state.checklistMaster = checkList.map((c) => ({
          label: c.itemName,
          difficulty:
            c.priority === "veryDifficult"
              ? "hard"
              : c.priority === "mildlyDifficult"
                ? "medium"
                : "easy",
          _id: c._id,
        }));

        state.pointsMaster = pointsList.map((p) => ({
          label: p.pointName,
          points: p.point,
        }));
      })
      .addCase(fetchMasterConfig.rejected, (state) => {
        state.masterLoading = false;
      })
      .addCase(saveMasterConfig.pending, (state) => {
        state.masterLoading = false;
      })

      .addCase(saveMasterConfig.fulfilled, (state, action) => {
        state.masterLoading = false;

        const serverChecklist = action.payload.checkList || [];
        const serverPoints = action.payload.pointsList || [];

        serverChecklist.forEach((serverItem) => {
          const existing = state.checklistMaster.find(
            (c) => c.label === serverItem.itemName
          );

          const mapped = {
            label: serverItem.itemName,
            difficulty:
              serverItem.priority === "veryDifficult"
                ? "hard"
                : serverItem.priority === "mildlyDifficult"
                  ? "medium"
                  : "easy",
            _id: serverItem._id,
          };

          if (existing) {
            Object.assign(existing, mapped);
          } else {
            state.checklistMaster.push(mapped);
          }
        });

        state.checklistMaster = state.checklistMaster.filter((local) =>
          serverChecklist.some((s) => s._id === local._id)
        );

        serverPoints.forEach((p) => {
          const existing = state.pointsMaster.find(
            (x) => x.label === p.pointName
          );

          const mapped = { label: p.pointName, points: p.point };

          if (existing) Object.assign(existing, mapped);
          else state.pointsMaster.push(mapped);
        });

        state.pointsMaster = state.pointsMaster.filter((local) =>
          serverPoints.some((s) => s.pointName === local.label)
        );
      })
      .addCase(saveMasterConfig.rejected, (state) => {
        state.masterLoading = false;
      })
      // Attendees
// Attendees
.addCase(fetchEventMembers.pending, (state, action) => {
  const { eventId, page } = action.meta.arg;

  if (page === 1) {
    state.membersLoading[eventId] = true;
  }
})

.addCase(fetchEventMembers.fulfilled, (state, action) => {
  const { eventId, list, total, page } = action.payload;

  state.membersLoading[eventId] = false;

  if (!state.membersMap[eventId]) {
    state.membersMap[eventId] = [];
  }

  state.membersMap[eventId] = list;

  state.membersPage[eventId] = page;
  state.membersTotal[eventId] = total;
  state.membersFetched[eventId] = true;
})

.addCase(fetchEventMembers.rejected, (state, action) => {
  const { eventId } = action.meta.arg;
  state.membersLoading[eventId] = false;
})
      .addCase(fetchEventDetails.fulfilled, (state, action) => {
        const { eventId, data, skip } = action.payload;

        if (skip) return;

        state.eventDetailsMap[eventId] = data;
        state.eventDetailsFetched[eventId] = true;
      })
      .addCase(fetchEventDetails.rejected, (state, action) => {
        const eventId = action.meta.arg.eventId;
        state.eventDetailsError[eventId] = action.payload;
      })
      .addCase(closeEventThunk.fulfilled, (state, action) => {
      })
      .addCase(closeEventThunk.rejected, (state, action) => {
        console.error("Close event failed:", action.payload);
      })
      // ================= MEMBERS MEDIA =================
      .addCase(fetchMembersMedia.pending, (state, action) => {
        const eventId = action.meta.arg.eventId;

        const existing = state.membersMediaMap[eventId];

        if (!existing || existing.length === 0) {
          state.membersMediaLoading = true;
        }
      })
      .addCase(fetchMembersMedia.fulfilled, (state, action) => {
        const { eventId, list, total, page } = action.payload;

        if (!state.membersMediaMap[eventId]) {
          state.membersMediaMap[eventId] = [];
        }

        if (page === 1) {
          state.membersMediaMap[eventId] = list;
        } else {
          state.membersMediaMap[eventId] = [
            ...state.membersMediaMap[eventId],
            ...list,
          ];
        }

        state.membersMediaPage[eventId] = page;
        state.membersMediaTotal[eventId] = total;
        state.membersMediaFetched[eventId] = true;
        state.membersMediaLoading = false;
      })
      .addCase(fetchEventMembers.rejected, (state, action) => {
        state.membersLoading = false;
        state.membersError = action.payload;
      })
      // ─── Event Checklist ──────────────────────────────────────────────────
      .addCase(fetchEventChecklist.pending, (state) => {
        state.eventChecklistLoading = true;
      })
      .addCase(fetchEventChecklist.fulfilled, (state, action) => {
        state.eventChecklistLoading = false;
        state.eventChecklist = action.payload.list;
        state.eventChecklistTotal = action.payload.total;
        updateSummaryInGroupedEvents(state);
      })
      .addCase(fetchEventChecklist.rejected, (state) => {
        state.eventChecklistLoading = false;
      })
      .addCase(fetchEventTaskSummaries.fulfilled, (state, action) => {
        state.eventTaskSummaries = {
          ...state.eventTaskSummaries,
          ...action.payload,
        };
      })
      .addCase(createEventActionable.pending, (state, action) => {
        const tempId = action.meta.arg.tempId;
        const tempItem = {
          ...action.meta.arg,
          actionableId: tempId,
          isOptimistic: true,
        };
        state.eventChecklist.unshift(tempItem);
        state.eventChecklistTotal += 1;
      })
      .addCase(createEventActionable.fulfilled, (state, action) => {
        const { item, tempId } = action.payload;
        const index = state.eventChecklist.findIndex((t) => t.actionableId === tempId);
        if (index !== -1) {
          state.eventChecklist[index] = { ...item, isOptimistic: false };
        }
        updateSummaryInGroupedEvents(state);
      })
      .addCase(createEventActionable.rejected, (state, action) => {
        const tempId = action.payload?.tempId;
        state.eventChecklist = state.eventChecklist.filter((t) => t.actionableId !== tempId);
        state.eventChecklistTotal -= 1;
      })
      .addCase(toggleEventActionable.fulfilled, (state, action) => {
        const { actionableId, isCompleted } = action.payload;
        const item = state.eventChecklist.find((t) => t.actionableId === actionableId);
        if (item) item.isCompleted = isCompleted;
        updateSummaryInGroupedEvents(state);
      })
      .addCase(removeEventActionable.fulfilled, (state, action) => {
        const { actionableId } = action.payload;
        state.eventChecklist = state.eventChecklist.filter((t) => t.actionableId !== actionableId);
        state.eventChecklistTotal -= 1;
        updateSummaryInGroupedEvents(state);
      })
      .addCase(updateEventActionable.fulfilled, (state, action) => {
        const { actionableId, ...updates } = action.payload;
        const item = state.eventChecklist.find((t) => t.actionableId === actionableId);
        if (item) Object.assign(item, updates);
        updateSummaryInGroupedEvents(state);
      })
      // Subtasks
      .addCase(createEventSubTask.fulfilled, (state, action) => {
        const { actionableId, subTask } = action.payload;
        const item = state.eventChecklist.find((t) => t.actionableId === actionableId);
        if (item) {
          if (!item.subTask) item.subTask = [];
          item.subTask.unshift(subTask);
        }
      })
      .addCase(updateEventSubTask.fulfilled, (state, action) => {
        const { actionableId, subTask } = action.payload;
        const item = state.eventChecklist.find((t) => t.actionableId === actionableId);
        if (item && item.subTask) {
          const index = item.subTask.findIndex(s => s._id === subTask._id);
          if (index !== -1) item.subTask[index] = subTask;
        }
      })
      .addCase(removeEventSubTask.fulfilled, (state, action) => {
        const { actionableId, subTaskId } = action.payload;
        const item = state.eventChecklist.find((t) => t.actionableId === actionableId);
        if (item && item.subTask) {
          item.subTask = item.subTask.filter(s => s._id !== subTaskId);
        }
      })
      // Comments
      .addCase(createEventComment.fulfilled, (state, action) => {
        const { actionableId, comment } = action.payload;
        const item = state.eventChecklist.find((t) => t.actionableId === actionableId);
        if (item) {
          if (!item.comments) item.comments = [];
          item.comments.unshift(comment);
        }
      })
      .addCase(removeEventComment.fulfilled, (state, action) => {
        const { actionableId, commentId } = action.payload;
        const item = state.eventChecklist.find((t) => t.actionableId === actionableId);
        if (item && item.comments) {
          item.comments = item.comments.filter(c => c._id !== commentId);
        }
      });
  },
});

export const { setPage, setSearch, setActiveTab, resetEventsState, setChecklistMaster, setPointsMaster, setSelectedEvent, localToggleChecklist } =
  eventSlice.actions;

export default eventSlice.reducer;