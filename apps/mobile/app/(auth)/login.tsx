import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { Button } from '../../src/components/ui/Button';
import { Colors, Spacing, FontSize, Radius } from '../../src/lib/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const MSG: Record<string, string> = {
        'invalid_credentials': 'Incorrect email or password',
        'invalid_grant': 'Incorrect email or password',
        'email_not_confirmed': 'Please confirm your email first',
        'user_not_found': 'No account found with this email',
      };
      setError(MSG[error.code ?? ''] ?? MSG[error.message?.toLowerCase().includes('invalid') ? 'invalid_credentials' : ''] ?? 'Sign in failed. Please try again.');
      return;
    }
    router.replace('/(tabs)/dashboard');
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.logo}>⚡ LONGEVITY</Text>
        <Text style={styles.tagline}>Welcome back</Text>
      </View>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Email address" placeholderTextColor={Colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor={Colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Button label="Sign In" onPress={handleLogin} loading={loading} />
        <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={styles.link}>
          <Text style={styles.linkText}>Don't have an account? <Text style={{ color: Colors.primary }}>Sign up</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: Spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.xxl },
  logo: { fontSize: 36, fontWeight: '900', color: Colors.primary, letterSpacing: 2 },
  tagline: { color: Colors.textSecondary, marginTop: 8, fontSize: FontSize.md },
  form: { gap: 16 },
  input: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, color: Colors.text, fontSize: FontSize.md, borderWidth: 1, borderColor: Colors.border },
  error: { color: Colors.error, fontSize: FontSize.sm, textAlign: 'center' },
  link: { alignItems: 'center', paddingVertical: 8 },
  linkText: { color: Colors.textSecondary, fontSize: FontSize.sm },
});
