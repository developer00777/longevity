import React from 'react';

const COLORS: Record<string, { bg: string; text: string }> = {
  upcoming: { bg: '#00C89622', text: '#00C896' },
  completed: { bg: '#55555522', text: '#888' },
  cancelled: { bg: '#FF444422', text: '#FF4444' },
  no_show: { bg: '#FFB80022', text: '#FFB800' },
  open: { bg: '#00C89622', text: '#00C896' },
  booked: { bg: '#FFB80022', text: '#FFB800' },
  blocked: { bg: '#FF444422', text: '#FF4444' },
};

export function Badge({ status }: { status: string }) {
  const c = COLORS[status] ?? { bg: '#55555522', text: '#888' };
  return (
    <span style={{ background: c.bg, color: c.text, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {status.replace('_', ' ')}
    </span>
  );
}
