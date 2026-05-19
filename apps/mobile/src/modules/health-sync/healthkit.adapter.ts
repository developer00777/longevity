import type { HealthSnapshot, SyncStatus, DailyMetric } from '@longevity/shared';
import { format, subDays } from 'date-fns';

function generateMockData(days: number): DailyMetric[] {
  return Array.from({ length: days }, (_, i) => ({
    date: format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd'),
    value: Math.floor(Math.random() * 3000 + 5000),
  }));
}

export async function requestPermissions(): Promise<SyncStatus> {
  // In production: use react-native-health to request HealthKit permissions
  // For MVP web/simulator: return granted with mock data
  return { state: 'synced', snapshot: await fetchHealthData() };
}

export async function fetchHealthData(): Promise<HealthSnapshot> {
  // In production: replace with actual react-native-health calls
  return {
    steps: generateMockData(30),
    heartRate: Array.from({ length: 30 }, (_, i) => ({
      date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
      value: Math.floor(Math.random() * 20 + 65),
    })),
    sleep: Array.from({ length: 30 }, (_, i) => ({
      date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
      value: Math.random() * 2 + 6,
    })),
    calories: Array.from({ length: 30 }, (_, i) => ({
      date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
      value: Math.floor(Math.random() * 400 + 400),
    })),
    syncedAt: new Date(),
    source: 'apple',
  };
}
