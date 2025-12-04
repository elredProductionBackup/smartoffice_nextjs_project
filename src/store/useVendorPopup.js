// store/useVendorPopup.js
import { create } from "zustand";

export const useVendorPopup = create((set) => ({
  isOpen: false,
  activeNote: { id: null, note: "" },

  openPopup: (payload) =>
    set({
      isOpen: true,
      activeNote: payload,
    }),

  closePopup: () =>
    set({
      isOpen: false,
      activeNote: { id: null, note: "" },
    }),

  updateNote: (newNote) =>
    set((state) => ({
      activeNote: { ...state.activeNote, note: newNote },
    })),
}));
