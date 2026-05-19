import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../lib/theme';

type GoldButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function GoldButton({ label, onPress, variant = 'solid', size = 'md', loading, disabled, style }: GoldButtonProps) {
  const isSolid = variant === 'solid';
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        isSolid && styles.solid,
        isOutline && styles.outline,
        variant === 'ghost' && styles.ghost,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={isSolid ? '#080A0C' : Colors.gold} size="small" />
        : <Text style={[styles.label, { color: isSolid ? '#080A0C' : Colors.gold, fontSize: size === 'sm' ? 12 : 14 }]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:     { borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  md:       { paddingVertical: 13, paddingHorizontal: 22 },
  sm:       { paddingVertical: 8, paddingHorizontal: 14 },
  solid:    { backgroundColor: Colors.gold },
  outline:  { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.goldDk },
  ghost:    { backgroundColor: 'transparent' },
  disabled: { opacity: 0.45 },
  label:    { fontWeight: '600', letterSpacing: 0.4 },
});
