import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../lib/theme';

const STATUS_COLORS: Record<string, string> = {
  upcoming: Colors.primary,
  completed: Colors.textSecondary,
  cancelled: Colors.error,
  no_show: Colors.warning,
};

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? Colors.textSecondary;
  return (
    <View style={[styles.badge, { backgroundColor: color + '22' }]}>
      <Text style={[styles.text, { color }]}>
        {status.replace('_', ' ').toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  text: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
});
