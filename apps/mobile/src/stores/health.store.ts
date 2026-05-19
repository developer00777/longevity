import { create } from 'zustand';
import type { SyncStatus, HealthSnapshot } from '@longevity/shared';

type HealthState = {
  syncStatus: SyncStatus;
  snapshot: HealthSnapshot | null;
  setSyncStatus: (status: SyncStatus) => void;
  setSnapshot: (snapshot: HealthSnapshot) => void;
};

export const useHealthStore = create<HealthState>((set) => ({
  syncStatus: { state: 'idle' },
  snapshot: null,
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setSnapshot: (snapshot) => set({ snapshot, syncStatus: { state: 'synced', snapshot } }),
}));
