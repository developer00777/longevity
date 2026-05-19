import type { Consultation, TherapyBooking } from './database';

export type BookingError =
  | { code: 'SLOT_TAKEN' }
  | { code: 'CANCELLATION_WINDOW_PASSED' }
  | { code: 'RESCHEDULE_LIMIT_REACHED' }
  | { code: 'CAPACITY_FULL' }
  | { code: 'NETWORK_ERROR'; message: string };

export type UnifiedBooking = {
  id: string;
  type: 'consultation' | 'therapy';
  title: string;
  startsAt: Date;
  status: 'upcoming' | 'completed' | 'cancelled' | 'no_show';
  slotId: string;
  raw: Consultation | TherapyBooking;
};
