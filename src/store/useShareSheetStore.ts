import { create } from 'zustand';
import type { SharePayload } from '@/lib/shareTypes';

interface ShareSheetState {
  visible: boolean;
  payload: SharePayload | null;
  open: (payload: SharePayload) => void;
  close: () => void;
}

export const useShareSheetStore = create<ShareSheetState>((set) => ({
  visible: false,
  payload: null,
  open: (payload) => set({ payload, visible: true }),
  close: () => set({ visible: false }),
}));
