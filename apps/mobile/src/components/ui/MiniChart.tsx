import React from 'react';
import { View } from 'react-native';

type MiniChartProps = {
  data: number[];
  color: string;
  height?: number;
};

// Bar-based sparkline (no SVG dependency issues on RN web)
export function MiniChart({ data, color, height = 44 }: MiniChartProps) {
  if (!data || data.length === 0) return <View style={{ height }} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 2 }}>
      {data.map((v, i) => {
        const h = Math.max(3, ((v - min) / range) * (height - 4));
        const isLast = i === data.length - 1;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: h,
              backgroundColor: isLast ? color : color + '55',
              borderRadius: 2,
            }}
          />
        );
      })}
    </View>
  );
}
