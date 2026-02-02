// redux/events/eventSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { fetchCollaborators, fetchEvents, fetchMasterConfig, saveMasterConfig } from "./eventsThunks";
import moment from "moment";

const initialState = {
  groupedEvents: [],
  rawEvents: [],       
  loading: false,
  error: null,

  page: 1,
  limit: 10,
  total: 0,

  collaboratorsList:[],
  collaboratorsLoading:false,

  checklistMaster: [],
  pointsMaster: [],
  masterLoading: false,

  activeTab: "upcomming", 
  search: "",
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
    eventImage:event.eventImage,
    name: event.eventName,
    date: startDay !== endDay
    ? `${startDay} - ${endDay}`
    : endDay,
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

    const month = m.format("MMMM YYYY");
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

          state.checklistMaster = (action.payload.checkList || []).map((c) => ({
            label: c.itemName,
            difficulty:
              c.priority === "veryDifficult"
                ? "hard"
                : c.priority === "mildlyDifficult"
                ? "medium"
                : "easy",
            _id: c._id,
          }));

          state.pointsMaster = (action.payload.pointsList || []).map((p) => ({
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
        });
  },
});

export const { setPage, setSearch, setActiveTab, resetEventsState,setChecklistMaster,setPointsMaster} =
  eventSlice.actions;

export default eventSlice.reducer;
