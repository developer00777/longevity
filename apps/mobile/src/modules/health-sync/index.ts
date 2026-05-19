import { Platform } from 'react-native';
import type { HealthSnapshot, SyncStatus, DailyMetric } from '@longevity/shared';
import { supabase } from '../../lib/supabase';

export type { HealthSnapshot, SyncStatus };

export async function requestHealthPermissions(): Promise<SyncStatus> {
  if (Platform.OS === 'web') {
    return { state: 'denied', platform: 'android' };
  }
  if (Platform.OS === 'ios') {
    try {
      const { requestPermissions } = await import('./healthkit.adapter');
      return requestPermissions();
    } catch {
      return { state: 'error', reason: 'HealthKit unavailable' };
    }
  }
  if (Platform.OS === 'android') {
    try {
      const { requestPermissions } = await import('./health-connect.adapter');
      return requestPermissions();
    } catch {
      return { state: 'not_installed' };
    }
  }
  return { state: 'error', reason: 'Unsupported platform' };
}

export async function syncHealthData(userId: string): Promise<HealthSnapshot | null> {
  if (Platform.OS === 'web') return null;

  let snapshot: HealthSnapshot | null = null;

  if (Platform.OS === 'ios') {
    try {
      const { fetchHealthData } = await import('./healthkit.adapter');
      snapshot = await fetchHealthData();
    } catch {
      return null;
    }
  } else if (Platform.OS === 'android') {
    try {
      const { fetchHealthData } = await import('./health-connect.adapter');
      snapshot = await fetchHealthData();
    } catch {
      return null;
    }
  }

  if (!snapshot) return null;

  const rows = [
    ...snapshot.steps.map(m => ({ uuid: userId, metric_type: 'steps' as const, value: m.value, recorded_at: m.date, source: snapshot!.source })),
    ...snapshot.heartRate.map(m => ({ uuid: userId, metric_type: 'heart_rate' as const, value: m.value, recorded_at: m.date, source: snapshot!.source })),
    ...snapshot.sleep.map(m => ({ uuid: userId, metric_type: 'sleep' as const, value: m.value, recorded_at: m.date, source: snapshot!.source })),
    ...snapshot.calories.map(m => ({ uuid: userId, metric_type: 'calories' as const, value: m.value, recorded_at: m.date, source: snapshot!.source })),
  ];

  await supabase.from('health_metrics').upsert(rows, { onConflict: 'uuid,metric_type,recorded_at,source' });

  return snapshot;
}

export function getInstallHealthConnectUrl(): string {
  return 'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';
}
