import React from 'react';
export function Spinner() {
  return <div style={{ width: 24, height: 24, border: '3px solid #2A2A2A', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />;
}
