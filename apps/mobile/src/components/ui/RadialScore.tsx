import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../lib/theme';

type RadialScoreProps = {
  val: number;
  max?: number;
  size?: number;
  color?: string;
  label: string;
  sub?: string;
  thick?: number;
};

export function RadialScore({ val, max = 100, size = 80, color = Colors.gold, label, sub, thick = 6 }: RadialScoreProps) {
  const r = (size - thick * 2) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const fill = (val / max) * circ;

  return (
    <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={c} cy={c} r={r} fill="none" stroke={Colors.surf3} strokeWidth={thick} />
        <Circle
          cx={c} cy={c} r={r}
          fill="none"
          stroke={color}
          strokeWidth={thick}
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: size < 64 ? 13 : 18, fontWeight: '700', color, lineHeight: size < 64 ? 15 : 20 }}>{label}</Text>
        {sub && <Text style={{ fontSize: size < 64 ? 8 : 9, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2 }}>{sub}</Text>}
      </View>
    </View>
  );
}
