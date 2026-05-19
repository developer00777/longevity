import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../lib/theme';

type TagProps = {
  children: React.ReactNode;
  color?: string;
  textColor?: string;
  size?: number;
};

export function Tag({ children, color = Colors.goldDk, textColor = Colors.goldLt, size = 9 }: TagProps) {
  return (
    <View style={[styles.tag, { backgroundColor: color + '33', borderColor: color + '55' }]}>
      <Text style={[styles.text, { color: textColor, fontSize: size }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
});
