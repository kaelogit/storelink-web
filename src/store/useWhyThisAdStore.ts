import { create } from 'zustand';
import type { WhyThisAdPayload } from '@/lib/adWhyThis';

type WhyThisAdState = {
  open: boolean;
  payload: WhyThisAdPayload | null;
  /** Bumps when a campaign is hidden so feeds can drop it immediately. */
  hiddenEpoch: number;
  show: (payload: WhyThisAdPayload) => void;
  close: () => void;
  bumpHidden: () => void;
};

export const useWhyThisAdStore = create<WhyThisAdState>((set) => ({
  open: false,
  payload: null,
  hiddenEpoch: 0,
  show: (payload) => set({ open: true, payload }),
  close: () => set({ open: false, payload: null }),
  bumpHidden: () =>
    set((s) => ({ open: false, payload: null, hiddenEpoch: s.hiddenEpoch + 1 })),
}));
