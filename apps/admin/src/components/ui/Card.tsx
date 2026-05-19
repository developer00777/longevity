import React from 'react';

type Props = { children: React.ReactNode; style?: React.CSSProperties; className?: string; onClick?: () => void };

export function Card({ children, style, className, onClick }: Props) {
  return (
    <div onClick={onClick} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, ...style }} className={className}>
      {children}
    </div>
  );
}
