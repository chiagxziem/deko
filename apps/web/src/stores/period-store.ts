import { create } from "zustand";

type Period = "1h" | "24h" | "7d" | "30d";

interface PeriodStore {
  period: Period;
  setPeriod: (period: Period) => void;
}

export const usePeriodStore = create<PeriodStore>((set) => ({
  period: "24h",
  setPeriod: (period) => set({ period }),
}));
