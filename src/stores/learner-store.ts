import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LearnerStore {
  selectedLearnerId: string | null;
  setSelectedLearnerId: (id: string | null) => void;
  clear: () => void;
}

export const useLearnerStore = create<LearnerStore>()(
  persist(
    (set) => ({
      selectedLearnerId: null,
      setSelectedLearnerId: (id) => set({ selectedLearnerId: id }),
      clear: () => set({ selectedLearnerId: null }),
    }),
    { name: "eigo-learner" },
  ),
);
