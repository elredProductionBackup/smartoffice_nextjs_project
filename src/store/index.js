import { configureStore } from "@reduxjs/toolkit";
import actionableReducer from "./actionable/actionableSlice";
import actionableUiReducer from "./actionable/actionableUiSlice";
import dashboardReducer from "./dashboard/dashboardSlice";

export const store = configureStore({
  reducer: {
    actionable: actionableReducer,
    actionableUi: actionableUiReducer,
    dashboard:dashboardReducer,
  },
});
