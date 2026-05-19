import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { bookConsultation } from '../../../src/modules/booking';
import { Colors, Spacing, FontSize } from '../../../src/lib/theme';

export default function ConfirmConsultScreen() {
  const { slotId, physicianName } = useLocalSearchParams<{ slotId: string; physicianName: string }>();
  const [loading, setLoading] = useState(false);

  async function handleBook() {
    setLoading(true);
    const { data, error } = await bookConsultation(slotId);
    setLoading(false);
    if (error) {
      Alert.alert('Booking Failed', error.code === 'SLOT_TAKEN' ? 'This slot was just booked. Please choose another.' : 'Something went wrong. Please try again.');
      return;
    }
    router.replace({ pathname: '/(tabs)/consult/[id]/detail', params: { id: data!.id } });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Confirm Booking</Text>
        <Card style={styles.summaryCard}>
          <Text style={styles.label}>Physician</Text>
          <Text style={styles.value}>Dr. {physicianName}</Text>
          <Text style={[styles.label, { marginTop: Spacing.md }]}>Type</Text>
          <Text style={styles.value}>Video Consultation</Text>
          <Text style={[styles.label, { marginTop: Spacing.md }]}>Video</Text>
          <Text style={styles.value}>In-app video (Agora) with Zoom fallback</Text>
        </Card>
        <Text style={styles.note}>You can cancel with at least 4 hours notice</Text>
        <Button label="Confirm Booking" onPress={handleBook} loading={loading} />
        <Button label="Go Back" onPress={() => router.back()} variant="ghost" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.lg, gap: Spacing.md, justifyContent: 'center' },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  summaryCard: { gap: 4 },
  label: { color: Colors.textSecondary, fontSize: FontSize.sm },
  value: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  note: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
});
