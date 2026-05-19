import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--primary)', letterSpacing: 2 }}>⚡ LONGEVITY</div>
          <div style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Physician & Staff Portal</div>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Check your email</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
              We sent a password reset link to <strong>{email}</strong>.<br />
              It may take a minute to arrive.
            </div>
            <Link to="/login" style={{ color: 'var(--primary)', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Forgot your password?</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Enter your email and we'll send you a reset link.
              </div>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              {error && <div style={{ color: 'var(--error)', fontSize: 14, textAlign: 'center' }}>{error}</div>}
              <Button label="Send Reset Link" type="submit" loading={loading} style={{ width: '100%' }} />
            </form>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: 14, textDecoration: 'none' }}>
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
