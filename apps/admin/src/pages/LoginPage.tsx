import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAdminAuthStore } from '../stores/auth.store';
import { Button } from '../components/ui/Button';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loadSession } = useAdminAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetSuccess = (location.state as { resetSuccess?: boolean } | null)?.resetSuccess;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    await loadSession();
    setLoading(false);
    navigate('/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--primary)', letterSpacing: 2 }}>⚡ LONGEVITY</div>
          <div style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Physician & Staff Portal</div>
        </div>

        {resetSuccess && (
          <div style={{ background: '#00C89B22', border: '1.5px solid #00C89B', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#00C89B', fontSize: 14, textAlign: 'center' }}>
            Password updated successfully. Please sign in with your new password.
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div style={{ color: 'var(--error)', fontSize: 14, textAlign: 'center' }}>{error}</div>}
          <Button label="Sign In" type="submit" loading={loading} style={{ width: '100%' }} />
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/forgot-password" style={{ color: 'var(--text-secondary)', fontSize: 14, textDecoration: 'none' }}>
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
}
