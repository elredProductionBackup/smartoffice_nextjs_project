import { configureStore } from "@reduxjs/toolkit";
import actionableReducer from "./actionable/actionableSlice";

export const store = configureStore({
  reducer: {
    actionable: actionableReducer,
  },
});
