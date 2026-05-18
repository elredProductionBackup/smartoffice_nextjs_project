import { create } from "zustand";

export const useDatepicker = create((set) => ({
  isOpen: false,
  selectedDate: new Date(),
  hoveredDate: null,
  onConfirm: null,

  openDatepicker: ({ date = new Date(), onConfirm }) =>
    set({
      isOpen: true,
      selectedDate: date,
      onConfirm,
    }),

  closeDatepicker: () =>
    set({
      isOpen: false,
      hoveredDate: null,
      onConfirm: null,
    }),

  setDate: (date) => set({ selectedDate: date }),
  setHoveredDate: (date) => set({ hoveredDate: date }),
}));
