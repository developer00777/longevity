import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/auth.store';
import { Button } from '../../src/components/ui/Button';
import { HEALTH_GOALS } from '@longevity/shared';
import { Colors, Spacing, FontSize, Radius } from '../../src/lib/theme';

export default function ProfileSetupScreen() {
  const { session, loadSession } = useAuthStore();
  const [step, setStep] = useState<'profile' | 'goals' | 'consent'>('consent');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggleGoal(value: string) {
    setGoals(prev => prev.includes(value) ? prev.filter(g => g !== value) : [...prev, value]);
  }

  async function handleFinish() {
    if (!name || !age || !gender) { setError('Please fill all required fields'); return; }
    if (parseInt(age) < 18) { setError('You must be 18 or older'); return; }
    setLoading(true); setError('');
    // Use session from store first; fall back to live getUser() call
    const userId = session?.user?.id;
    if (!userId) { setError('Session expired — please sign in again'); setLoading(false); router.replace('/(auth)/signup'); return; }
    const { error } = await supabase.from('users').upsert({
      uuid: userId, name, age: parseInt(age), gender, height_cm: parseFloat(height) || null,
      weight_kg: parseFloat(weight) || null, health_goals: goals, consent_given_at: new Date().toISOString(),
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    await loadSession();
    router.replace('/(tabs)/dashboard');
  }

  if (step === 'consent') return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Privacy & Consent</Text>
      <Text style={styles.body}>We collect your basic health data and sync with Apple Health / Google Fit to provide personalized wellness insights. Your data is stored securely and never shared without consent. Health data is stored anonymously (UUID only).</Text>
      <TouchableOpacity onPress={() => setConsented(!consented)} style={styles.checkRow} accessibilityRole="checkbox" accessibilityLabel="I agree to the Privacy Policy">
        <View style={[styles.checkbox, consented && styles.checkboxChecked]}>{consented && <Text style={{ color: '#000', fontWeight: '900' }}>✓</Text>}</View>
        <Text style={styles.checkLabel}>I agree to the <Text style={{ color: Colors.primary }}>Privacy Policy</Text> and <Text style={{ color: Colors.primary }}>Terms of Service</Text></Text>
      </TouchableOpacity>
      <Button label="Continue" onPress={() => setStep('profile')} disabled={!consented} />
    </ScrollView>
  );

  if (step === 'profile') return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Your Profile</Text>
      <TextInput style={styles.input} placeholder="Full name *" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} accessibilityLabel="Full name" />
      <TextInput style={styles.input} placeholder="Age *" placeholderTextColor={Colors.textMuted} value={age} onChangeText={setAge} keyboardType="number-pad" accessibilityLabel="Age" />
      <View style={styles.genderRow}>
        {(['male', 'female', 'other'] as const).map(g => (
          <TouchableOpacity key={g} onPress={() => setGender(g)} style={[styles.genderBtn, gender === g && styles.genderBtnActive]} accessibilityRole="button" accessibilityLabel={g}>
            <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={styles.input} placeholder="Height (cm)" placeholderTextColor={Colors.textMuted} value={height} onChangeText={setHeight} keyboardType="decimal-pad" accessibilityLabel="Height in centimeters" />
      <TextInput style={styles.input} placeholder="Weight (kg)" placeholderTextColor={Colors.textMuted} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" accessibilityLabel="Weight in kilograms" />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button label="Next" onPress={() => setStep('goals')} />
    </ScrollView>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>What brings you here?</Text>
      <Text style={styles.sub}>Select all that apply</Text>
      {HEALTH_GOALS.map(g => (
        <TouchableOpacity key={g.value} onPress={() => toggleGoal(g.value)} style={[styles.goalBtn, goals.includes(g.value) && styles.goalBtnActive]} accessibilityRole="checkbox" accessibilityLabel={g.label}>
          <Text style={[styles.goalText, goals.includes(g.value) && styles.goalTextActive]}>{g.label}</Text>
        </TouchableOpacity>
      ))}
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button label="Get Started" onPress={handleFinish} loading={loading} disabled={goals.length === 0} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: Spacing.lg, gap: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  sub: { color: Colors.textSecondary, fontSize: FontSize.md, marginBottom: Spacing.sm },
  body: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 24 },
  input: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, color: Colors.text, fontSize: FontSize.md, borderWidth: 1, borderColor: Colors.border },
  genderRow: { flexDirection: 'row', gap: Spacing.sm },
  genderBtn: { flex: 1, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  genderBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  genderText: { color: Colors.textSecondary, fontWeight: '600' },
  genderTextActive: { color: Colors.primary },
  goalBtn: { padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border },
  goalBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  goalText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '500' },
  goalTextActive: { color: Colors.primary },
  checkRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkLabel: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 22 },
  error: { color: Colors.error, fontSize: FontSize.sm, textAlign: 'center' },
});
