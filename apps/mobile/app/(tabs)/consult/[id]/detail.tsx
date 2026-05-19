import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { format, addMinutes, isBefore, isAfter } from 'date-fns';
import { supabase } from '../../../../src/lib/supabase';
import { cancelConsultation } from '../../../../src/modules/booking';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { StatusBadge } from '../../../../src/components/ui/StatusBadge';
import { Colors, Spacing, FontSize, Radius } from '../../../../src/lib/theme';

export default function ConsultDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [now, setNow] = useState(new Date());

  // Tick every 30s so join button activates automatically
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const { data: consult, isLoading, refetch } = useQuery({
    queryKey: ['consult-detail', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('consultations')
        .select('*, slot:consultation_slots(*, physician:physicians(*))')
        .eq('id', id!)
        .single();
      return data;
    },
  });

  const slotStart = consult?.slot?.start_time ? new Date(consult.slot.start_time) : null;
  const slotEnd = consult?.slot?.end_time ? new Date(consult.slot.end_time) : null;
  const canJoin = slotStart && slotEnd
    ? isAfter(now, addMinutes(slotStart, -2)) && isBefore(now, addMinutes(slotEnd, 10))
    : false;

  async function handleCancel() {
    Alert.alert('Cancel Consultation', 'Cancel this consultation? Must be 4+ hours before the slot.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          const { error } = await cancelConsultation(id!);
          if (error?.code === 'CANCELLATION_WINDOW_PASSED') {
            Alert.alert('Cannot Cancel', 'Cancellations must be made at least 4 hours before the session.');
          } else {
            refetch();
            router.replace('/(tabs)/appointments');
          }
        },
      },
    ]);
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
        <Text style={{ color: Colors.textSecondary }}>Consultation not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <StatusBadge status={consult.status} />
        </View>

        {/* Physician info */}
        <Card style={styles.physicianCard}>
          <View style={styles.physicianRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {consult.slot?.physician?.name?.[0]?.toUpperCase() ?? 'D'}
              </Text>
            </View>
            <View style={styles.physicianInfo}>
              <Text style={styles.physicianName}>
                Dr. {consult.slot?.physician?.name ?? 'Physician'}
              </Text>
              {consult.slot?.physician?.specialization && (
                <Text style={styles.specialization}>{consult.slot.physician.specialization}</Text>
              )}
            </View>
          </View>
        </Card>

        {/* Time info */}
        <Card>
          <Text style={styles.sectionLabel}>Appointment Time</Text>
          {slotStart && (
            <>
              <Text style={styles.dateText}>{format(slotStart, 'EEEE, MMMM d, yyyy')}</Text>
              <Text style={styles.timeText}>
                {format(slotStart, 'h:mm a')}
                {slotEnd ? ` – ${format(slotEnd, 'h:mm a')}` : ''}
              </Text>
            </>
          )}
        </Card>

        {/* Join call section */}
        <Card style={canJoin ? [styles.callCard, styles.callCardActive] : styles.callCard}>
          <Text style={styles.sectionLabel}>Video Consultation</Text>
          {canJoin ? (
            <>
              <Text style={styles.callReadyText}>Your session is ready to join</Text>
              <Button
                label="🎥  Join Video Call"
                onPress={() => router.push({ pathname: '/(tabs)/consult/[id]/call', params: { id: id! } })}
                style={styles.joinBtn}
              />
              {consult.video_link && (
                <Button
                  label="Open Zoom Instead"
                  variant="outline"
                  onPress={() => Linking.openURL(consult.video_link!)}
                  style={{ marginTop: Spacing.sm }}
                />
              )}
            </>
          ) : consult.status === 'upcoming' ? (
            <>
              <Text style={styles.callWaitText}>
                Join button activates 2 minutes before your slot
              </Text>
              {slotStart && (
                <Text style={styles.callTimeHint}>
                  Available from {format(addMinutes(slotStart, -2), 'h:mm a')}
                </Text>
              )}
              {consult.video_link && (
                <Button
                  label="Open Zoom Link"
                  variant="outline"
                  onPress={() => Linking.openURL(consult.video_link!)}
                  style={{ marginTop: Spacing.md }}
                />
              )}
            </>
          ) : (
            <Text style={styles.callWaitText}>
              {consult.status === 'completed' ? 'This consultation has ended.' : 'This consultation was cancelled.'}
            </Text>
          )}
        </Card>

        {/* Post-consultation notes (P1) */}
        {consult.notes && (
          <Card>
            <Text style={styles.sectionLabel}>Physician Notes</Text>
            <Text style={styles.notesText}>{consult.notes}</Text>
            {consult.recommended_therapy_ids?.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Recommended Therapies</Text>
                <Button
                  label="View Recommendations"
                  variant="outline"
                  onPress={() => router.push({ pathname: '/(tabs)/consult/[id]/summary', params: { id: id! } })}
                  style={{ marginTop: Spacing.sm }}
                />
              </>
            )}
          </Card>
        )}

        {/* Cancel */}
        {consult.status === 'upcoming' && (
          <Button
            label="Cancel Consultation"
            variant="ghost"
            onPress={handleCancel}
            style={styles.cancelBtn}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  container: { padding: Spacing.md, gap: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { padding: Spacing.xs },
  backText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
  physicianCard: {},
  physicianRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#000' },
  physicianInfo: { flex: 1 },
  physicianName: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
  specialization: { color: Colors.primary, fontSize: FontSize.sm, marginTop: 2 },
  sectionLabel: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700', marginBottom: Spacing.sm },
  dateText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  timeText: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, marginTop: 4 },
  callCard: {},
  callCardActive: { borderColor: Colors.primary },
  callReadyText: { color: Colors.success, fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.md },
  callWaitText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  callTimeHint: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  joinBtn: { marginTop: Spacing.sm },
  notesText: { color: Colors.text, fontSize: FontSize.md, lineHeight: 24 },
  cancelBtn: { alignSelf: 'center' },
});
