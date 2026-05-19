import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  // Supabase sends the recovery token as a hash fragment — the auth state
  // change event fires automatically when the page loads with that fragment.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    await supabase.auth.signOut();
    navigate('/login', { state: { resetSuccess: true } });
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--primary)', letterSpacing: 2 }}>⚡ LONGEVITY</div>
          <div style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Physician & Staff Portal</div>
        </div>

        {!ready ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
            Verifying reset link…
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Set a new password</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Choose a strong password for your account.
              </div>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input
                type="password"
                placeholder="New password (min 8 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
              {error && <div style={{ color: 'var(--error)', fontSize: 14, textAlign: 'center' }}>{error}</div>}
              <Button label="Update Password" type="submit" loading={loading} style={{ width: '100%' }} />
            </form>
          </>
        )}
      </div>
    </div>
  );
}
