import React from 'react';

type Props = {
  label: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
};

export function Button({ label, onClick, type = 'button', variant = 'primary', loading, disabled, style }: Props) {
  const base: React.CSSProperties = {
    height: 44, borderRadius: 10, padding: '0 20px', fontSize: 14,
    fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, transition: 'opacity 0.15s, background 0.15s', whiteSpace: 'nowrap',
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--primary)', color: '#000' },
    outline: { background: 'transparent', border: '1.5px solid var(--primary)', color: 'var(--primary)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)' },
    danger: { background: '#FF444422', color: 'var(--error)', border: '1.5px solid var(--error)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} style={{ ...base, ...variants[variant], ...(disabled || loading ? { opacity: 0.4 } : {}), ...style }}>
      {loading ? '⏳' : label}
    </button>
  );
}
