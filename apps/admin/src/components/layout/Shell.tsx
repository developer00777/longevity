import React, { useState } from 'react';
import { Sidebar } from './Sidebar';

export function Shell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 10 }} className="mobile-only" />
      )}

      {/* Sidebar - desktop always visible, mobile slide-in */}
      <div style={{ position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 20, transform: sidebarOpen ? 'translateX(0)' : undefined }} className="desktop-only">
        <Sidebar />
      </div>
      {sidebarOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 20 }} className="mobile-only">
          <Sidebar />
        </div>
      )}

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 240, minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="desktop-only-margin">
        {/* Mobile topbar */}
        <div className="mobile-only" style={{ padding: '16px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 5 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', color: 'var(--text)', fontSize: 22, padding: 0, border: 'none' }}>☰</button>
          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>⚡ LONGEVITY</span>
        </div>
        <div style={{ flex: 1, padding: 24, maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          {children}
        </div>
      </main>

      {/* Full page for mobile (no left margin) */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-only-margin { margin-left: 0 !important; }
        }
        @media (min-width: 769px) {
          .desktop-only { display: block !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
