import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  modal: {
    type: null,
    taskId: null,
  },
};

const actionableUiSlice = createSlice({
  name: "actionableUi",
  initialState,
  reducers: {
    openModal: (state, action) => {
      const { type, taskId } = action.payload;
      state.modal.type = type;
      state.modal.taskId = taskId;
    },
    closeModal: (state) => {
      state.modal.type = null;
      state.modal.taskId = null;
    },
  },
});

export const { openModal, closeModal } = actionableUiSlice.actions;
export default actionableUiSlice.reducer;
