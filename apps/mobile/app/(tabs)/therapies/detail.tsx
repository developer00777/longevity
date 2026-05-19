import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../src/lib/supabase';
import { useAuthStore } from '../../../src/stores/auth.store';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Colors, Spacing, FontSize } from '../../../src/lib/theme';

export default function TherapyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuthStore();

  const { data: therapy, isLoading } = useQuery({
    queryKey: ['therapy', id],
    enabled: !!session && !!id,
    queryFn: async () => {
      const { data } = await supabase.from('therapies').select('*').eq('id', id).single();
      return data;
    },
  });

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  if (!therapy) return <View style={styles.center}><Text style={{ color: Colors.textSecondary }}>Therapy not found</Text></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.name}>{therapy.name}</Text>
          <View style={styles.metaRow}>
            {therapy.duration_min && <Text style={styles.meta}>⏱ {therapy.duration_min} min</Text>}
            <Text style={styles.meta}>{therapy.pricing_tier === 'membership' ? '✅ Included with membership' : '➕ Add-on: pay at facility'}</Text>
          </View>
        </View>
        <Card>
          <Text style={styles.sectionLabel}>About this therapy</Text>
          <Text style={styles.description}>{therapy.description}</Text>
        </Card>
        <Button label="Book a Session" onPress={() => router.push({ pathname: '/(tabs)/therapies/slots', params: { therapyId: id, therapyName: therapy.name } })} />
        <Button label="Back" onPress={() => router.back()} variant="ghost" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  container: { padding: Spacing.lg, gap: Spacing.md },
  header: { gap: 8 },
  name: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  metaRow: { gap: 8 },
  meta: { color: Colors.textSecondary, fontSize: FontSize.sm },
  sectionLabel: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700', marginBottom: Spacing.sm },
  description: { color: Colors.text, fontSize: FontSize.md, lineHeight: 26 },
});
