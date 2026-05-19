import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { Button } from '../../src/components/ui/Button';
import { Colors, Spacing, FontSize, Radius } from '../../src/lib/theme';

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!phone) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.error, fontSize: FontSize.md, textAlign: 'center' }}>
          Invalid verification link. Please sign up again.
        </Text>
        <Button label="Go Back" onPress={() => router.replace('/(auth)/signup')} />
      </View>
    );
  }

  async function handleVerify() {
    setLoading(true); setError('');
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.replace('/(auth)/profile-setup');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.sub}>Sent to {phone}</Text>
      <TextInput style={styles.input} placeholder="6-digit code" placeholderTextColor={Colors.textMuted} value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} textAlign="center" accessibilityLabel="OTP code" />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button label="Verify" onPress={handleVerify} loading={loading} disabled={otp.length < 6} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg, justifyContent: 'center', gap: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  sub: { color: Colors.textSecondary, textAlign: 'center', fontSize: FontSize.md },
  input: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, color: Colors.text, fontSize: 28, fontWeight: '700', borderWidth: 1, borderColor: Colors.border, letterSpacing: 8 },
  error: { color: Colors.error, textAlign: 'center', fontSize: FontSize.sm },
});
