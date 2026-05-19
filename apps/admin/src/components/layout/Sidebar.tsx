import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAdminAuthStore } from '../../stores/auth.store';

export function Sidebar() {
  const { adminUser, signOut } = useAdminAuthStore();
  const role = adminUser?.role ?? null;

  const NAV_ITEMS = role === 'physician'
    ? [
        { to: '/physician/schedule', icon: '📅', label: 'My Schedule' },
        { to: '/physician/slots', icon: '🕐', label: 'Manage My Slots' },
        { to: '/patients', icon: '👥', label: 'My Patients' },
      ]
    : [
        { to: '/dashboard', icon: '📊', label: 'Dashboard' },
        { to: '/slots', icon: '📅', label: 'Consultation Slots' },
        { to: '/therapy-slots', icon: '🗓️', label: 'Therapy Slots' },
        { to: '/therapies', icon: '💆', label: 'Therapy Catalog' },
        { to: '/patients', icon: '👥', label: 'Patients' },
      ];

  return (
    <aside style={{ width: 240, minHeight: '100vh', background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: 1 }}>⚡ LONGEVITY</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, textTransform: 'capitalize' }}>
          {role ? `${role} Portal` : 'Admin Portal'}
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10,
            background: isActive ? 'var(--primary)' : 'transparent',
            color: isActive ? '#000' : 'var(--text-secondary)',
            fontWeight: isActive ? 700 : 500, fontSize: 14, transition: 'all 0.15s',
          })}>
            <span>{icon}</span><span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Signed in as</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textTransform: 'capitalize', marginBottom: 12 }}>
          {role === 'physician' ? '👨‍⚕️' : role === 'admin' ? '🔑' : '👤'} {role ?? 'Unknown'}
        </div>
        <button onClick={signOut} style={{ background: 'transparent', color: 'var(--error)', fontSize: 13, fontWeight: 600, padding: 0, border: 'none', cursor: 'pointer' }}>Sign Out</button>
      </div>
    </aside>
  );
}
