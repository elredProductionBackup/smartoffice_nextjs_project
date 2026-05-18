import { create } from "zustand";

export const useDatepicker = create((set) => ({
  isOpen: false,

  viewDate: new Date(),      
  selectedDate: null,

  hoveredDate: null,

  openDatepicker(date = new Date()) {
    set({
      isOpen: true,
      viewDate: date,
      selectedDate: date,
    });
  },

  closeDatepicker() {
    set({ isOpen: false, hoveredDate: null });
  },

  setViewDate(date) {
    set({ viewDate: date });
  },

  setSelectedDate(date) {
    set({ selectedDate: date });
  },

  setHoveredDate(day) {
    set({ hoveredDate: day });
  },
}));
