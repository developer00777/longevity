export type DailyMetric = {
  date: string;
  value: number;
};

export type HealthSnapshot = {
  steps: DailyMetric[];
  heartRate: DailyMetric[];
  sleep: DailyMetric[];
  calories: DailyMetric[];
  syncedAt: Date;
  source: 'apple' | 'google';
};

export type SyncStatus =
  | { state: 'idle' }
  | { state: 'syncing' }
  | { state: 'synced'; snapshot: HealthSnapshot }
  | { state: 'denied'; platform: 'ios' | 'android' }
  | { state: 'not_installed' }
  | { state: 'error'; reason: string };
