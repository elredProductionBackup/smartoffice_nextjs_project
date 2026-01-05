import { create } from "zustand";

const useGlobalLoader = create((set) => ({
  loading: false,
  showLoader: () => set({ loading: true }),
  hideLoader: () => set({ loading: false }),
}));

export default useGlobalLoader;
