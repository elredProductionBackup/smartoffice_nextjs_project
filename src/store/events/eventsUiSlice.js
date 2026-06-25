import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  modalStack: [],
    eventFormModal: {
    type: null,   
    payload: null,
  },
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
    openEventFormModal: (state, action) => {
      const { type, payload } = action.payload;
      state.eventFormModal.type = type;
      state.eventFormModal.payload = payload || null;
    },
    closeEventFormModal: (state) => {
      state.eventFormModal.type = null;
      state.eventFormModal.payload = null;
    },
  },
});

export const {
  openEventsModal,
  closeTopEventsModal,
  closeAllEventsModals,
  openEventFormModal,
  closeEventFormModal,
} = eventsUiSlice.actions;

export default eventsUiSlice.reducer;
