import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { Button } from '../../src/components/ui/Button';
import { Colors, Spacing, FontSize, Radius } from '../../src/lib/theme';

export default function SignupScreen() {
  const [mode, setMode] = useState<'phone' | 'email'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setLoading(true);
    setError('');
    if (mode === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) { setError('Please enter a valid email address'); setLoading(false); return; }
      if (password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return; }
    }
    if (mode === 'phone' && phone.length < 10) { setError('Please enter a valid 10-digit phone number'); setLoading(false); return; }
    try {
      if (mode === 'email') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        router.replace('/(auth)/profile-setup');
      } else {
        const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });
        if (error) throw error;
        router.push({ pathname: '/(auth)/verify', params: { phone: `+91${phone}` } });
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.logo}>⚡ LONGEVITY</Text>
        <Text style={styles.tagline}>Your longevity journey starts here</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.toggle}>
          <TouchableOpacity onPress={() => setMode('email')} style={[styles.toggleBtn, mode === 'email' && styles.toggleActive]}>
            <Text style={[styles.toggleText, mode === 'email' && styles.toggleTextActive]}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('phone')} style={[styles.toggleBtn, mode === 'phone' && styles.toggleActive]}>
            <Text style={[styles.toggleText, mode === 'phone' && styles.toggleTextActive]}>Phone OTP</Text>
          </TouchableOpacity>
        </View>

        {mode === 'email' ? (
          <>
            <TextInput style={styles.input} placeholder="Email address" placeholderTextColor={Colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" accessibilityLabel="Email address" />
            <TextInput style={styles.input} placeholder="Password (min 8 chars)" placeholderTextColor={Colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry accessibilityLabel="Password" />
          </>
        ) : (
          <View style={styles.phoneRow}>
            <View style={styles.countryCode}><Text style={styles.countryCodeText}>+91</Text></View>
            <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="10-digit mobile number" placeholderTextColor={Colors.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" accessibilityLabel="Phone number" />
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Button label={mode === 'phone' ? 'Send OTP' : 'Create Account'} onPress={handleSubmit} loading={loading} />

        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.link}>
          <Text style={styles.linkText}>Already have an account? <Text style={{ color: Colors.primary }}>Sign in</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: Spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.xxl },
  logo: { fontSize: FontSize.xxxl, fontWeight: '900', color: Colors.primary, letterSpacing: 2 },
  tagline: { color: Colors.textSecondary, marginTop: Spacing.sm, fontSize: FontSize.md },
  form: { gap: Spacing.md },
  toggle: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.sm },
  toggleActive: { backgroundColor: Colors.primary },
  toggleText: { color: Colors.textSecondary, fontWeight: '600' },
  toggleTextActive: { color: '#000' },
  input: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, color: Colors.text, fontSize: FontSize.md, borderWidth: 1, borderColor: Colors.border, marginBottom: 0 },
  phoneRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  countryCode: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  countryCodeText: { color: Colors.text, fontSize: FontSize.md },
  error: { color: Colors.error, fontSize: FontSize.sm, textAlign: 'center' },
  link: { alignItems: 'center', paddingVertical: Spacing.sm },
  linkText: { color: Colors.textSecondary, fontSize: FontSize.sm },
});
