import { createSlice } from "@reduxjs/toolkit";

const toastSlice = createSlice({
  name: "toast",
  initialState: {
    toast: null,
  },
  reducers: {
    addToast: (state, action) => {
      const { message, type } = action.payload;

      state.toast = {
        id: Date.now(),
        message,
        type,
        mounted: false,
        hiding: false,
      };
    },

    mountToast: (state) => {
      if (state.toast) state.toast.mounted = true;
    },

    hideToast: (state) => {
      if (state.toast && !state.toast.hiding) {
        state.toast.hiding = true;
      }
    },

    removeToast: (state) => {
      state.toast = null;
    },

    clearAllToasts: (state) => {
      state.toast = null;
    },
  },
});

export const {
  addToast,
  mountToast,
  hideToast,
  removeToast,
  clearAllToasts,
} = toastSlice.actions;

export default toastSlice.reducer;