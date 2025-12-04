import { create } from "zustand";

export const useModalStore = create((set) => ({
  isOpen: false,
  modalData: null, // <-- dynamic data

  open: (data) =>
    set({
      isOpen: true,
      modalData: data || null,
    }),

  close: () =>
    set({
      isOpen: false,
      modalData: null,
    }),
}));


