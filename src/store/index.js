import { configureStore } from "@reduxjs/toolkit";
import actionableReducer from "./actionable/actionableSlice";
import actionableUiReducer from "./actionable/actionableUiSlice";
import eventSlice from "./events/eventsSlice";
import eventUiReducer from "./events/eventsUiSlice";
import dashboardReducer from "./dashboard/dashboardSlice";
import authReducer from "./auth/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    actionable: actionableReducer,
    actionableUi: actionableUiReducer,
    events:eventSlice,
    eventsUi: eventUiReducer,
    dashboard:dashboardReducer,
  },
});
