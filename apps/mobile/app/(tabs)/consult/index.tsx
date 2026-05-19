import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../src/lib/supabase';
import { useAuthStore } from '../../../src/stores/auth.store';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Colors, Spacing, FontSize, Radius } from '../../../src/lib/theme';
import { format, addDays, isToday, isTomorrow } from 'date-fns';

function formatSlotDay(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE, MMM d');
}

export default function ConsultScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { session } = useAuthStore();

  const { data: slots, isLoading, error, refetch } = useQuery({
    queryKey: ['consultation-slots', format(selectedDate, 'yyyy-MM-dd')],
    enabled: !!session,
    queryFn: async () => {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      const { data, error } = await supabase
        .from('consultation_slots')
        .select('*, physician:physicians(*)')
        .eq('status', 'open')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time');
      if (error) console.error('slots error:', error.message);
      return data ?? [];
    },
  });

  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Book Consultation</Text>
        <Text style={styles.sub}>Meet with our longevity physicians</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={styles.dateContainer}>
        {dates.map(d => {
          const isSelected = format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          return (
            <TouchableOpacity key={d.toISOString()} onPress={() => setSelectedDate(d)} style={[styles.dateChip, isSelected && styles.dateChipActive]} accessibilityRole="button" accessibilityLabel={format(d, 'EEEE, MMMM d')}>
              <Text style={[styles.dateDay, isSelected && styles.dateDayActive]}>{format(d, 'EEE')}</Text>
              <Text style={[styles.dateNum, isSelected && styles.dateNumActive]}>{format(d, 'd')}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.slotsContainer}>
        <Text style={styles.sectionTitle}>{formatSlotDay(selectedDate.toISOString())}</Text>

        {isLoading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />}

        {error && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>Could not load slots. Check your connection.</Text>
            <TouchableOpacity onPress={() => refetch()} accessibilityRole="button" accessibilityLabel="Retry">
              <Text style={styles.retryText}>↻ Retry</Text>
            </TouchableOpacity>
          </Card>
        )}

        {!isLoading && (!slots || slots.length === 0) && (
          <Card><Text style={styles.emptyText}>No available slots on this day</Text></Card>
        )}

        {slots?.map((slot: any) => (
          <Card key={slot.id} style={styles.slotCard}>
            <View style={styles.slotRow}>
              {/* Physician avatar */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {slot.physician?.name?.[0]?.toUpperCase() ?? '👨‍⚕️'}
                </Text>
              </View>
              {/* Info */}
              <View style={styles.slotInfo}>
                <Text style={styles.physicianName}>Dr. {slot.physician?.name ?? 'Physician'}</Text>
                {slot.physician?.specialization ? (
                  <Text style={styles.specialization}>{slot.physician.specialization}</Text>
                ) : null}
                <View style={styles.timeRow}>
                  <Text style={styles.slotTime}>{format(new Date(slot.start_time), 'h:mm a')}</Text>
                  <Text style={styles.timeSep}>–</Text>
                  <Text style={styles.slotTime}>{format(new Date(slot.end_time), 'h:mm a')}</Text>
                </View>
              </View>
              <Button
                label="Book"
                onPress={() => router.push({ pathname: '/(tabs)/consult/confirm', params: { slotId: slot.id, physicianName: slot.physician?.name ?? '' } })}
                style={styles.bookBtn}
              />
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.md, paddingBottom: 0 },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  sub: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: 4 },
  dateScroll: { marginTop: Spacing.md },
  dateContainer: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  dateChip: { width: 52, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  dateChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateDay: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  dateDayActive: { color: '#000' },
  dateNum: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text, marginTop: 2 },
  dateNumActive: { color: '#000' },
  slotsContainer: { padding: Spacing.md, gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  slotCard: { marginBottom: 0 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + '33', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  slotInfo: { flex: 1 },
  physicianName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  specialization: { color: Colors.primary, fontSize: 12, marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  slotTime: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  timeSep: { color: Colors.textMuted, fontSize: FontSize.sm },
  bookBtn: { paddingHorizontal: Spacing.md, height: 40, flexShrink: 0 },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', padding: Spacing.md },
  errorCard: { margin: Spacing.md, borderColor: Colors.error + '44' },
  errorText: { color: Colors.error, fontSize: FontSize.sm, marginBottom: 8 },
  retryText: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.sm },
});
