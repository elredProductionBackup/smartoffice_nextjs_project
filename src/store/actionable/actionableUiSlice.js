import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  modal: {
    type: null,
    taskId: null,
  },
  // Bumped when actionables may have changed elsewhere (assistant, WhatsApp); lists refetch silently on change
  refreshKey: 0,
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
    refreshActionables: (state) => {
      state.refreshKey += 1;
    },
  },
});

export const { openModal, closeModal, refreshActionables } = actionableUiSlice.actions;
export default actionableUiSlice.reducer;
