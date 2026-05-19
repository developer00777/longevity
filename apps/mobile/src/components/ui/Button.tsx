import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '../../lib/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = 'primary', loading, disabled, style }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, styles[variant], (disabled || loading) && styles.disabled, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? '#000' : Colors.primary} />
        : <Text style={[styles.label, variant !== 'primary' && styles.labelAlt]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },
  primary: { backgroundColor: Colors.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.4 },
  label: { fontSize: FontSize.md, fontWeight: '700', color: '#000' },
  labelAlt: { color: Colors.primary },
});
