import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../../lib/theme';

type AIBubbleType = 'info' | 'warn' | 'win' | 'ai';

type AIBubbleProps = {
  text: string;
  type?: AIBubbleType;
  loading?: boolean;
};

const CONFIG: Record<AIBubbleType, { bg: string; border: string; icon: string }> = {
  info: { bg: Colors.blueDk + '60',   border: Colors.blue + '30',   icon: '⚡' },
  warn: { bg: Colors.orangeDk + '60', border: Colors.orange + '30', icon: '⚠️' },
  win:  { bg: Colors.greenDk + '60',  border: Colors.green + '30',  icon: '✅' },
  ai:   { bg: Colors.purpleDk + '60', border: Colors.purple + '30', icon: '🤖' },
};

export function AIBubble({ text, type = 'ai', loading }: AIBubbleProps) {
  const cfg = CONFIG[type];
  return (
    <View style={[styles.wrap, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={styles.icon}>{cfg.icon}</Text>
      {loading
        ? <ActivityIndicator color={Colors.purple} size="small" />
        : <Text style={styles.text}>{text}</Text>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  icon:  { fontSize: 15, marginTop: 1, flexShrink: 0 },
  text:  { fontSize: 13, color: Colors.text, lineHeight: 21, flex: 1 },
});
