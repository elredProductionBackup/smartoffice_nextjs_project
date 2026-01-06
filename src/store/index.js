import { configureStore } from "@reduxjs/toolkit";
import actionableReducer from "./actionable/actionableSlice";
import actionableUiReducer from "./actionable/actionableUiSlice";

export const store = configureStore({
  reducer: {
    actionable: actionableReducer,
    actionableUi: actionableUiReducer,
  },
});
