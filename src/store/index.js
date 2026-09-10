import { configureStore } from "@reduxjs/toolkit";
import actionableReducer from "./actionable/actionableSlice";
import actionableUiReducer from "./actionable/actionableUiSlice";
import eventSlice from "./events/eventsSlice";
// import eventCostingSlice from "./events/eventCosting/eventCostingSlice";
import budgetReducer from "./events/budgetChecklist/budgetSlice";
import eventUiReducer from "./events/eventsUiSlice";
import dashboardReducer from "./dashboard/dashboardSlice";
import authReducer from "./auth/authSlice";
import toastReducer from "./toastSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    actionable: actionableReducer,
    actionableUi: actionableUiReducer,
    events:eventSlice,
    // eventCostingSlice:eventCostingSlice,
    eventsUi: eventUiReducer,
    dashboard:dashboardReducer,
    toast: toastReducer,
    budget:budgetReducer
  },
});
