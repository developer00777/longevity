import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../src/lib/supabase';
import { useAuthStore } from '../../../src/stores/auth.store';
import { bookTherapy } from '../../../src/modules/booking';
import { Card } from '../../../src/components/ui/Card';
import { Colors, Spacing, FontSize } from '../../../src/lib/theme';
import { format, addDays } from 'date-fns';

export default function TherapySlotsScreen() {
  const { therapyId, therapyName } = useLocalSearchParams<{ therapyId: string; therapyName: string }>();
  const { session } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookingId, setBookingId] = useState<string | null>(null);

  const { data: slots, isLoading, refetch } = useQuery({
    queryKey: ['therapy-slots', therapyId, format(selectedDate, 'yyyy-MM-dd')],
    enabled: !!session && !!therapyId,
    queryFn: async () => {
      const start = new Date(selectedDate); start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate); end.setHours(23, 59, 59, 999);
      const { data, error } = await supabase
        .from('therapy_slots')
        .select('*, therapy:therapies(name), room:rooms(name)')
        .eq('therapy_id', therapyId)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time');
      if (error) console.error('therapy-slots error:', error.message);
      return data ?? [];
    },
  });

  async function handleBook(slotId: string) {
    setBookingId(slotId);
    const { error } = await bookTherapy(slotId);
    setBookingId(null);
    if (error) {
      Alert.alert('Booking Failed', error.code === 'CAPACITY_FULL' ? 'This slot is full. Please choose another time.' : 'Something went wrong.');
      return;
    }
    Alert.alert('Booked!', `${therapyName} session confirmed.`, [{ text: 'View Appointments', onPress: () => router.replace('/(tabs)/appointments') }]);
    refetch();
  }

  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{therapyName}</Text>
        <Text style={styles.sub}>Select a time slot</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={styles.dateContainer}>
        {dates.map(d => {
          const active = format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          return (
            <TouchableOpacity key={d.toISOString()} onPress={() => setSelectedDate(d)} style={[styles.dateChip, active && styles.dateChipActive]}>
              <Text style={[styles.dateDay, active && styles.dateActive]}>{format(d, 'EEE')}</Text>
              <Text style={[styles.dateNum, active && styles.dateActive]}>{format(d, 'd')}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.slots}>
        {isLoading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />}
        {!isLoading && !slots?.length && <Card><Text style={styles.empty}>No slots available this day</Text></Card>}
        {slots?.map((slot: any) => {
          const isFull = slot.booked_count >= slot.capacity;
          return (
            <Card key={slot.id} style={isFull ? [styles.slotCard, styles.slotFull] : styles.slotCard}>
              <View style={styles.slotRow}>
                <View>
                  <Text style={styles.slotTime}>{format(new Date(slot.start_time), 'h:mm a')}</Text>
                  <Text style={styles.roomName}>📍 {slot.room?.name ?? 'Facility'}</Text>
                  <Text style={styles.capacity}>{slot.capacity - slot.booked_count} of {slot.capacity} spots left</Text>
                </View>
                <TouchableOpacity onPress={() => handleBook(slot.id)} disabled={isFull || bookingId === slot.id} style={[styles.bookBtn, isFull && styles.bookBtnDisabled]} accessibilityRole="button" accessibilityLabel={`Book ${therapyName} at ${format(new Date(slot.start_time), 'h:mm a')}`}>
                  {bookingId === slot.id ? <ActivityIndicator color={Colors.background} size="small" /> : <Text style={styles.bookBtnText}>{isFull ? 'Full' : 'Book'}</Text>}
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
  sub: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 4 },
  dateScroll: { marginBottom: Spacing.sm },
  dateContainer: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  dateChip: { width: 52, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  dateChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateDay: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  dateNum: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text, marginTop: 2 },
  dateActive: { color: '#000' },
  slots: { padding: Spacing.md, gap: Spacing.sm },
  slotCard: {},
  slotFull: { opacity: 0.5 },
  slotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slotTime: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  roomName: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  capacity: { color: Colors.primary, fontSize: 12, marginTop: 2 },
  bookBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 10 },
  bookBtnDisabled: { backgroundColor: Colors.textMuted },
  bookBtnText: { color: '#000', fontWeight: '700', fontSize: FontSize.sm },
  empty: { color: Colors.textSecondary, textAlign: 'center', padding: Spacing.md },
});
