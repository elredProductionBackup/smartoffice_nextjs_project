import { createSlice } from "@reduxjs/toolkit";
import { fetchCollaborators, fetchEventMembers, fetchEvents,  fetchMasterConfig, 
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
  removeEventComment
} from "./eventsThunks";
import moment from "moment";

const initialState = {
  groupedEvents: [],
  rawEvents: [],
  loading: false,
  error: null,

  selectedEvent: null,

  page: 1,
  limit: 10,
  total: 0,

  collaboratorsList: [],
  collaboratorsLoading: false,

  checklistMaster: [],
  pointsMaster: [],
  masterLoading: false,

  membersList: [],
  membersLoading: false,
  membersError: null,
  membersTotal: 0,
  membersPage: 1,
  membersFetched: false, // 👈 KEY FLAG

  activeTab: "upcomming",
  search: "",

  eventChecklist: [],
  eventChecklistLoading: false,
  eventChecklistTotal: 0,
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
  return {
    id: event.eventId,
    eventImage: event.eventImage,
    name: event.eventName,
    date: startDay !== endDay
      ? `${startDay} - ${endDay}`
      : endDay,
    // For Redux Event - START
    eventDescription: event.eventDescription,
    startDate: event.startDateTime,
    endDate: event.endDateTime,
    isRegistration: event.isRegistration,
    resource: event.resource,
    additionalNotes: event.additionalNotes,
    // END
    attendees: event.whoCanAttend?.length || 0,
    location:
      event.eventLocation || "—",

    tasks: event.tasks || null,
  };
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
      .addCase(fetchEventMembers.pending, (state) => {
        if (!state.membersFetched) {
          state.membersLoading = true;
        }
      })
      .addCase(fetchEventMembers.fulfilled, (state, action) => {
        state.membersLoading = false;
        state.membersList = action.payload.list;
        state.membersTotal = action.payload.total;
        state.membersFetched = true;
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
        })
        .addCase(fetchEventChecklist.rejected, (state) => {
          state.eventChecklistLoading = false;
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
        })
        .addCase(removeEventActionable.fulfilled, (state, action) => {
          const { actionableId } = action.payload;
          state.eventChecklist = state.eventChecklist.filter((t) => t.actionableId !== actionableId);
          state.eventChecklistTotal -= 1;
        })
        .addCase(updateEventActionable.fulfilled, (state, action) => {
          const { actionableId, ...updates } = action.payload;
          const item = state.eventChecklist.find((t) => t.actionableId === actionableId);
          if (item) Object.assign(item, updates);
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

export const { setPage, setSearch, setActiveTab, resetEventsState, setChecklistMaster, setPointsMaster, setSelectedEvent } =
  eventSlice.actions;

export default eventSlice.reducer;
