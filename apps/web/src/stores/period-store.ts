import { create } from "zustand";
import { persist } from "zustand/middleware";

type Period = "1h" | "24h" | "7d" | "30d";

interface PeriodStore {
  period: Period;
  setPeriod: (period: Period) => void;
}

export const usePeriodStore = create<PeriodStore>()(
  persist(
    (set) => ({
      period: "24h",
      setPeriod: (period) => set({ period }),
    }),
    { name: "deko-period" },
  ),
);
