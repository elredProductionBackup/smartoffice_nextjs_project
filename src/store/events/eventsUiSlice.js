import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  modalStack: [],
};

const eventsUiSlice = createSlice({
  name: "eventsUi",
  initialState,
  reducers: {
    openEventsModal: (state, action) => {
      state.modalStack.push(action.payload);
    },
    closeTopEventsModal: (state) => {
      state.modalStack.pop();
    },
    closeAllEventsModals: (state) => {
      state.modalStack = [];
    },
  },
});

export const {
  openEventsModal,
  closeTopEventsModal,
  closeAllEventsModals,
} = eventsUiSlice.actions;

export default eventsUiSlice.reducer;
