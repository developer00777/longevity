import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyBookings, cancelConsultation, cancelTherapyBooking } from '../../../src/modules/booking';
import { useAuthStore } from '../../../src/stores/auth.store';
import { Card } from '../../../src/components/ui/Card';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { Colors, Spacing, FontSize } from '../../../src/lib/theme';
import { format } from 'date-fns';

export default function AppointmentsScreen() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [cancelMsg, setCancelMsg] = useState('');

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['my-bookings'],
    enabled: !!session,
    queryFn: getMyBookings,
  });

  const filtered = bookings?.filter(b => tab === 'upcoming' ? b.status === 'upcoming' : b.status !== 'upcoming') ?? [];

  async function handleCancel(booking: typeof filtered[0]) {
    Alert.alert('Cancel Booking', `Cancel ${booking.title}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          const result = booking.type === 'consultation'
            ? await cancelConsultation(booking.id)
            : await cancelTherapyBooking(booking.id);
          if (result.error?.code === 'CANCELLATION_WINDOW_PASSED') {
            Alert.alert('Cannot Cancel', booking.type === 'consultation' ? 'Cancellations must be made at least 4 hours before.' : 'Cancellations must be made at least 24 hours before.');
          } else {
            refetch();
            queryClient.invalidateQueries({ queryKey: ['consultation-slots'] });
            setCancelMsg('Booking cancelled');
            setTimeout(() => setCancelMsg(''), 3000);
          }
        }
      }
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <View style={styles.tabRow}>
          {(['upcoming', 'past'] as const).map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]} accessibilityRole="tab" accessibilityLabel={t}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {!!cancelMsg && (
        <View style={{ backgroundColor: Colors.primary + '22', padding: Spacing.sm, marginHorizontal: Spacing.md, borderRadius: 8, marginBottom: 8 }}>
          <Text style={{ color: Colors.primary, textAlign: 'center', fontWeight: '600', fontSize: FontSize.sm }}>✓ {cancelMsg}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.container}>
        {isLoading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />}

        {!isLoading && filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{tab === 'upcoming' ? '📅' : '📋'}</Text>
            <Text style={styles.emptyText}>{tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}</Text>
            <Text style={styles.emptySubText}>{tab === 'upcoming' ? 'Book a consultation or therapy session to get started' : 'Your completed sessions will appear here'}</Text>
          </View>
        )}

        {filtered.map(booking => (
          <Card key={booking.id} style={styles.bookingCard}>
            <View style={styles.bookingRow}>
              <Text style={styles.bookingIcon}>{booking.type === 'consultation' ? '🩺' : '💆'}</Text>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingTitle}>{booking.title}</Text>
                <Text style={styles.bookingDate}>{format(booking.startsAt, 'EEE, MMM d · h:mm a')}</Text>
                <StatusBadge status={booking.status} />
              </View>
            </View>
            {booking.status === 'upcoming' && (
              <TouchableOpacity onPress={() => handleCancel(booking)} style={styles.cancelBtn} accessibilityRole="button" accessibilityLabel="Cancel booking">
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.md, gap: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  tabRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontWeight: '600', fontSize: FontSize.sm },
  tabTextActive: { color: '#000' },
  container: { padding: Spacing.md, gap: Spacing.sm },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptySubText: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', paddingHorizontal: Spacing.lg },
  bookingCard: {},
  bookingRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  bookingIcon: { fontSize: 28 },
  bookingInfo: { flex: 1, gap: 4 },
  bookingTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  bookingDate: { color: Colors.textSecondary, fontSize: FontSize.sm },
  cancelBtn: { marginTop: Spacing.sm, alignSelf: 'flex-end' },
  cancelText: { color: Colors.error, fontSize: FontSize.sm, fontWeight: '600' },
});
