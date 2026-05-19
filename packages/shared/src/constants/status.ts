export const BOOKING_STATUS = {
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export const SLOT_STATUS = {
  OPEN: 'open',
  BOOKED: 'booked',
  BLOCKED: 'blocked',
  COMPLETED: 'completed',
} as const;

export const HEALTH_GOALS = [
  { value: 'energy', label: 'More Energy & Vitality' },
  { value: 'sleep', label: 'Better Sleep Quality' },
  { value: 'longevity', label: 'Longevity & Healthy Aging' },
  { value: 'pain', label: 'Pain Management & Recovery' },
  { value: 'wellness', label: 'General Wellness Optimization' },
] as const;

export const CANCELLATION_WINDOWS = {
  consultation: 4 * 60 * 60 * 1000,
  therapy: 24 * 60 * 60 * 1000,
} as const;
