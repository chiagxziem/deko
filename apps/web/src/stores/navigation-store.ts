import { create } from "zustand";

type NavigationStore = {
  isNavigating: boolean;
  startNavigation: () => void;
  stopNavigation: () => void;
};

export const useNavigationStore = create<NavigationStore>((set) => ({
  isNavigating: false,
  startNavigation: () => set({ isNavigating: true }),
  stopNavigation: () => set({ isNavigating: false }),
}));
