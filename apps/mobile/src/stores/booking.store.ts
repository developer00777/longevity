import { create } from 'zustand';

type BookingState = {
  pendingSlotId: string | null;
  setPendingSlot: (slotId: string | null) => void;
};

export const useBookingStore = create<BookingState>((set) => ({
  pendingSlotId: null,
  setPendingSlot: (pendingSlotId) => set({ pendingSlotId }),
}));
