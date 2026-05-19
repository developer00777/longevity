import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../../src/lib/supabase';
import { bookTherapy } from '../../../../src/modules/booking';
import { Card } from '../../../../src/components/ui/Card';
import { Button } from '../../../../src/components/ui/Button';
import { Colors, Spacing, FontSize, Radius } from '../../../../src/lib/theme';

export default function ConsultSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: consult, isLoading } = useQuery({
    queryKey: ['consult-summary', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('consultations')
        .select('notes, recommended_therapy_ids, slot:consultation_slots(start_time, physician:physicians(name))')
        .eq('id', id!)
        .single();
      return data;
    },
  });

  const { data: recommendedTherapies } = useQuery({
    queryKey: ['recommended-therapies', consult?.recommended_therapy_ids],
    enabled: !!consult?.recommended_therapy_ids?.length,
    queryFn: async () => {
      const { data } = await supabase
        .from('therapies')
        .select('*')
        .in('id', consult!.recommended_therapy_ids);
      return data ?? [];
    },
  });

  async function handleBookTherapy(therapyId: string, therapyName: string) {
    // Navigate to therapy slots for quick booking
    router.push({ pathname: '/(tabs)/therapies/slots', params: { therapyId, therapyName } });
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!consult) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.textSecondary }}>Summary not available</Text>
      </View>
    );
  }

  const ICONS: Record<string, string> = {
    'Red Light Therapy': '💡', 'Cryotherapy': '❄️', 'Neuro Relaxation': '🧠',
    'Aromatherapy & Sound Healing': '🎵', 'Breathwork & Yoga': '🧘',
    'IV Nutrition / Longevity Drip': '💉', 'Hyperbaric Oxygen Chamber': '🫧',
    'Ice Bath / Cold Plunge / Steam': '🧊', 'Physiotherapy': '🦴',
    'Diet Therapy Consultation': '🥗', 'Cognitive Therapy': '🧩',
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Consultation Summary</Text>
        <Text style={styles.sub}>From Dr. {(consult.slot as any)?.physician?.name ?? 'your physician'}</Text>

        {consult.notes ? (
          <Card>
            <Text style={styles.sectionLabel}>Physician Notes</Text>
            <Text style={styles.notesText}>{consult.notes}</Text>
          </Card>
        ) : (
          <Card>
            <Text style={styles.emptyText}>No notes added yet. Check back after your consultation.</Text>
          </Card>
        )}

        {recommendedTherapies && recommendedTherapies.length > 0 && (
          <View>
            <Text style={styles.recommendTitle}>Recommended for You</Text>
            <Text style={styles.recommendSub}>Your physician recommends these therapies based on your consultation</Text>
            {recommendedTherapies.map((therapy: any) => (
              <Card key={therapy.id} style={styles.therapyCard}>
                <View style={styles.therapyRow}>
                  <Text style={styles.therapyIcon}>{ICONS[therapy.name] ?? '⚡'}</Text>
                  <View style={styles.therapyInfo}>
                    <Text style={styles.therapyName}>{therapy.name}</Text>
                    <Text style={styles.therapyDesc} numberOfLines={2}>{therapy.description}</Text>
                    <Text style={styles.therapyMeta}>
                      ⏱ {therapy.duration_min} min · {therapy.pricing_tier === 'membership' ? '✅ Included' : '➕ Add-on'}
                    </Text>
                  </View>
                </View>
                <Button
                  label="Book This Session →"
                  onPress={() => handleBookTherapy(therapy.id, therapy.name)}
                  style={styles.bookBtn}
                />
              </Card>
            ))}
          </View>
        )}

        {(!recommendedTherapies || recommendedTherapies.length === 0) && consult.notes && (
          <Card style={styles.noRecommendCard}>
            <Text style={styles.emptyText}>No therapy recommendations yet.</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  container: { padding: Spacing.md, gap: Spacing.md },
  backBtn: { alignSelf: 'flex-start' },
  backText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  sub: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: 2 },
  sectionLabel: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700', marginBottom: Spacing.sm },
  notesText: { color: Colors.text, fontSize: FontSize.md, lineHeight: 26 },
  recommendTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text, marginTop: Spacing.sm },
  recommendSub: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 4, marginBottom: Spacing.md, lineHeight: 20 },
  therapyCard: { marginBottom: Spacing.sm, gap: Spacing.md },
  therapyRow: { flexDirection: 'row', gap: Spacing.md },
  therapyIcon: { fontSize: 32 },
  therapyInfo: { flex: 1, gap: 4 },
  therapyName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  therapyDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  therapyMeta: { color: Colors.primary, fontSize: 12, fontWeight: '600', marginTop: 2 },
  bookBtn: { marginTop: 4 },
  noRecommendCard: {},
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', padding: Spacing.sm },
});
