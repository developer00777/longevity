import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { SurfaceCard } from '../../../src/components/ui/SurfaceCard';
import { GoldButton } from '../../../src/components/ui/GoldButton';
import { AIBubble } from '../../../src/components/ui/AIBubble';
import { Tag } from '../../../src/components/ui/Tag';
import { bookConsultation } from '../../../src/modules/booking';
import { Colors } from '../../../src/lib/theme';
import { supabase } from '../../../src/lib/supabase';

// ── Treatment catalogue (mirrors therapies/index.tsx) ────────────
const TREATMENTS = [
  { id:1,  name:'Hyperbaric Oxygen Therapy',           cat:'Oxygen & Pressure',    dur:60,  price:8500,  icon:'🫧', markers:['ROS','hs-CRP','VO₂ Max'],    type:'therapy'      },
  { id:2,  name:'Red Light / Photobiomodulation',       cat:'Light Therapy',         dur:20,  price:3500,  icon:'🔴', markers:['ATP proxy','HRV'],            type:'therapy'      },
  { id:3,  name:'Full-Spectrum Infrared Sauna',         cat:'Thermal Therapy',       dur:45,  price:4200,  icon:'🌡️', markers:['Cortisol','HRV'],             type:'therapy'      },
  { id:4,  name:'Whole-Body Cryotherapy',               cat:'Cold Therapy',          dur:3,   price:3800,  icon:'❄️', markers:['CRP','Cortisol'],             type:'therapy'      },
  { id:5,  name:'NAD⁺ IV Infusion',                    cat:'IV & Infusion',         dur:180, price:22000, icon:'⚡', markers:['NAD levels','Bio Age'],        type:'consultation' },
  { id:6,  name:"Myers' Cocktail Plus",                 cat:'IV & Infusion',         dur:60,  price:12000, icon:'💧', markers:['Vitamin levels'],              type:'consultation' },
  { id:7,  name:'Glutathione Push',                     cat:'IV & Infusion',         dur:30,  price:7500,  icon:'✨', markers:['GSH','Oxidative stress'],      type:'consultation' },
  { id:8,  name:'BPC-157 + TB-500 Protocol',            cat:'Peptide & Hormone',     dur:45,  price:18000, icon:'🧬', markers:['Repair markers'],              type:'consultation' },
  { id:9,  name:'Neurofeedback Session',                cat:'Neural & Cognitive',    dur:60,  price:9500,  icon:'🧠', markers:['Brainwave patterns'],          type:'therapy'      },
  { id:10, name:'Float Tank / Sensory Deprivation',     cat:'Neural & Cognitive',    dur:90,  price:5500,  icon:'🌊', markers:['Cortisol','HRV'],             type:'therapy'      },
  { id:11, name:'Full Longevity Biomarker Panel',        cat:'Diagnostics',           dur:120, price:28000, icon:'🔬', markers:['95 biomarkers'],               type:'consultation' },
  { id:12, name:'DEXA Body Composition Scan',            cat:'Diagnostics',           dur:30,  price:6500,  icon:'📊', markers:['Body fat %'],                  type:'therapy'      },
  { id:13, name:'Sleep Architecture + Circadian Reset',  cat:'Sleep Optimisation',   dur:90,  price:15000, icon:'🌙', markers:['Sleep stages','HRV'],          type:'therapy'      },
];

const TIME_SLOTS = ['07:00','08:00','09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00','18:00','19:00'];
const PAYMENT_OPTIONS = [
  { key: 'upi',    label: 'UPI / QR',        icon: '📱' },
  { key: 'card',   label: 'Credit / Debit',  icon: '💳' },
  { key: 'net',    label: 'Net Banking',     icon: '🏦' },
  { key: 'crypto', label: 'USDT / Crypto',   icon: '₿'  },
];

const fmt = (n: number) => n.toLocaleString('en-IN');
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

export default function BookScreen() {
  const { id, slotId } = useLocalSearchParams<{ id: string; slotId?: string }>();
  const t = TREATMENTS.find(x => x.id === parseInt(id ?? '1')) ?? TREATMENTS[0];

  const [step, setStep]         = useState(1);
  const [date, setDate]         = useState(todayStr());
  const [slot, setSlot]         = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  // Set after successful booking
  const [booking, setBooking] = useState<{ id: string; bookingRef: string } | null>(null);

  const memberDiscount  = Math.round(t.price * 0.1);
  const gst             = Math.round((t.price - memberDiscount) * 0.18);
  const total           = t.price - memberDiscount + gst;

  // ── Confirm & book ────────────────────────────────────────────
  async function handleConfirm() {
    if (!payMethod) {
      Alert.alert('Select Payment', 'Please choose a payment method.');
      return;
    }
    setLoading(true);
    try {
      if (t.type === 'consultation' && slotId) {
        // Wire to real BookingEngine — same as confirm.tsx
        const { data, error } = await bookConsultation(slotId);
        if (error) {
          Alert.alert(
            'Booking Failed',
            error.code === 'SLOT_TAKEN'
              ? 'This slot was just taken. Please go back and choose another.'
              : error.message ?? 'Something went wrong. Please try again.'
          );
          setLoading(false);
          return;
        }
        setBooking({ id: data!.id, bookingRef: `BK${data!.id.slice(0,5).toUpperCase()}` });
      } else {
        // For therapy-type bookings without a pre-selected slotId:
        // Log to Supabase as a booking intent (edge function or manual slot flow would handle real slot assignment)
        // For now complete optimistically — the same flow as the wireframe
        const bookingRef = `BK${Math.random().toString(36).slice(2,7).toUpperCase()}`;
        setBooking({ id: bookingRef, bookingRef });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not complete booking. Please try again.');
    }
    setLoading(false);
  }

  // ── Confirmation screen ───────────────────────────────────────
  if (booking) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={[s.scroll, { alignItems: 'center', paddingTop: 48 }]}>
          <View style={s.confirmRing}>
            <Text style={{ fontSize: 36 }}>✓</Text>
          </View>
          <Text style={s.confirmTitle}>Session <Text style={{ color: Colors.gold }}>Confirmed</Text></Text>
          <Text style={s.confirmSub}>{t.name} is locked in.</Text>

          <SurfaceCard style={[s.card, { width: '100%', marginTop: 24 }]}>
            {[
              ['Treatment',  t.name],
              ['Date',       new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })],
              ['Time',       slot ?? '—'],
              ['Duration',   `${t.dur} min`],
              ['Therapist',  'Dr. Ananya Rao'],
              ['Location',   'Champions 100x Center, Bangalore'],
              ['Booking ID', booking.bookingRef],
              ['Amount Paid',`₹${fmt(total)}`],
            ].map(([k, v]) => (
              <View key={k} style={s.summaryRow}>
                <Text style={s.summaryKey}>{k}</Text>
                <Text style={[s.summaryVal, k === 'Amount Paid' && { color: Colors.gold, fontWeight: '700' }]}>{v}</Text>
              </View>
            ))}
          </SurfaceCard>

          <View style={{ width: '100%', marginTop: 4 }}>
            <AIBubble
              text={`After your ${t.name} session, monitor your ${t.markers[0]} within 24 hours. Note the delta and report to your physician at the next review — this is your key feedback loop.`}
              type="win"
            />
          </View>

          <View style={s.confirmBtns}>
            <GoldButton label="Home" variant="outline" style={{ flex: 1 }} onPress={() => router.replace('/(tabs)/dashboard')} />
            <GoldButton label="Book More" style={{ flex: 1 }} onPress={() => router.replace('/(tabs)/explore')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Back */}
        <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(s2 => s2 - 1)} style={s.back}>
          <Text style={s.backText}>← {step === 1 ? 'All Therapies' : 'Back'}</Text>
        </TouchableOpacity>

        {/* Step indicator */}
        <View style={s.steps}>
          {['Select Time', 'Confirm & Pay'].map((label, i) => (
            <View key={label} style={{ flex: 1 }}>
              <View style={[s.stepBar, step > i && s.stepBarActive]} />
              <Text style={[s.stepLabel, step > i && s.stepLabelActive]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Treatment summary card */}
        <SurfaceCard style={[s.card, { backgroundColor: Colors.surf2 }]}>
          <View style={s.treatRow}>
            <View style={s.treatIconBox}><Text style={{ fontSize: 26 }}>{t.icon}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.treatName}>{t.name}</Text>
              <Text style={s.treatMeta}>{t.cat} · {t.dur} min</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                {t.markers.slice(0, 2).map(m => (
                  <View key={m} style={s.markerChip}><Text style={s.markerText}>📊 {m}</Text></View>
                ))}
              </View>
            </View>
            <Text style={s.treatPrice}>₹{fmt(t.price)}</Text>
          </View>
        </SurfaceCard>

        {/* ── Step 1: Select date + time ── */}
        {step === 1 && (
          <>
            <AIBubble
              text={`Before your ${t.name}: stay hydrated, avoid heavy meals 2 hours prior. Afterwards, monitor your ${t.markers[0] ?? 'recovery score'} over the next 24–48 hours to track the biomarker shift.`}
              type="ai"
            />

            <View style={s.section}>
              <Text style={s.fieldLabel}>Select Date</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                style={s.dateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={s.section}>
              <Text style={s.fieldLabel}>Select Time</Text>
              <View style={s.slotGrid}>
                {TIME_SLOTS.map(sl => (
                  <TouchableOpacity
                    key={sl}
                    onPress={() => setSlot(sl)}
                    style={[s.slotBtn, slot === sl && s.slotBtnActive]}
                  >
                    <Text style={[s.slotText, slot === sl && s.slotTextActive]}>{sl}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <GoldButton
              label={slot ? `Continue → ${slot}` : 'Select a time slot'}
              disabled={!slot}
              onPress={() => slot && setStep(2)}
            />
          </>
        )}

        {/* ── Step 2: Confirm & Pay ── */}
        {step === 2 && (
          <>
            {/* Booking details */}
            <SurfaceCard style={s.card}>
              {[
                ['Date',      new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })],
                ['Time',      slot ?? '—'],
                ['Duration',  `${t.dur} min`],
                ['Therapist', 'Dr. Ananya Rao'],
                ['Location',  'Champions 100x Center, Bangalore'],
              ].map(([k, v]) => (
                <View key={k} style={s.summaryRow}>
                  <Text style={s.summaryKey}>{k}</Text>
                  <Text style={s.summaryVal}>{v}</Text>
                </View>
              ))}
            </SurfaceCard>

            {/* Price breakdown */}
            <SurfaceCard style={s.card}>
              <Text style={s.payTitle}>Payment Breakdown</Text>
              <View style={s.summaryRow}>
                <Text style={s.summaryKey}>Session fee</Text>
                <Text style={s.summaryVal}>₹{fmt(t.price)}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={[s.summaryKey, { color: Colors.green }]}>Member 10% off</Text>
                <Text style={[s.summaryVal, { color: Colors.green }]}>−₹{fmt(memberDiscount)}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryKey}>GST 18%</Text>
                <Text style={s.summaryVal}>₹{fmt(gst)}</Text>
              </View>
              <View style={[s.summaryRow, s.totalRow]}>
                <Text style={s.totalKey}>Total</Text>
                <Text style={s.totalVal}>₹{fmt(total)}</Text>
              </View>
            </SurfaceCard>

            {/* Payment method */}
            <View style={s.section}>
              <Text style={s.fieldLabel}>Payment Method</Text>
              <View style={s.payGrid}>
                {PAYMENT_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setPayMethod(opt.key)}
                    style={[s.payOption, payMethod === opt.key && s.payOptionActive]}
                  >
                    <Text style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</Text>
                    <Text style={[s.payOptionText, payMethod === opt.key && s.payOptionTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {loading ? (
              <View style={s.loadingRow}>
                <ActivityIndicator color={Colors.gold} />
                <Text style={{ color: Colors.textSub, fontSize: 13 }}>Processing booking…</Text>
              </View>
            ) : (
              <GoldButton
                label={`Confirm & Pay ₹${fmt(total)}`}
                onPress={handleConfirm}
                disabled={!payMethod}
              />
            )}

            <GoldButton
              label="← Change Slot"
              variant="outline"
              style={{ marginTop: 8 }}
              onPress={() => setStep(1)}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  scroll:  { padding: 16, paddingBottom: 40, gap: 14 },
  back:    {},
  backText:{ color: Colors.gold, fontSize: 13, fontWeight: '600' },
  card:    {},
  steps:   { flexDirection: 'row', gap: 8 },
  stepBar: { height: 3, borderRadius: 2, backgroundColor: Colors.border, marginBottom: 4 },
  stepBarActive:   { backgroundColor: Colors.gold },
  stepLabel:       { fontSize: 10, color: Colors.textMuted },
  stepLabelActive: { color: Colors.gold },
  treatRow:    { flexDirection: 'row', gap: 12, alignItems: 'center' },
  treatIconBox:{ width: 52, height: 52, borderRadius: 12, backgroundColor: Colors.surf3, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  treatName:   { fontSize: 15, fontWeight: '700', color: Colors.text },
  treatMeta:   { fontSize: 11, color: Colors.textSub, marginTop: 2 },
  treatPrice:  { fontSize: 20, fontWeight: '700', color: Colors.gold, flexShrink: 0 },
  markerChip:  { backgroundColor: Colors.goldGlow, borderWidth: 1, borderColor: Colors.goldDk + '40', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  markerText:  { fontSize: 9, color: Colors.gold },
  section:     { gap: 8 },
  fieldLabel:  { fontSize: 12, color: Colors.textSub, fontWeight: '500' },
  dateInput:   { backgroundColor: Colors.surf2, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, color: Colors.text, fontSize: 14 },
  slotGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  slotBtn:     { width: '22%', backgroundColor: Colors.surf2, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  slotBtnActive:   { backgroundColor: Colors.gold, borderColor: Colors.gold },
  slotText:        { fontSize: 12, color: Colors.text },
  slotTextActive:  { color: Colors.bg, fontWeight: '700' },
  summaryRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryKey:  { fontSize: 12, color: Colors.textSub },
  summaryVal:  { fontSize: 12, fontWeight: '500', color: Colors.text },
  payTitle:    { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  totalRow:    { borderBottomWidth: 0, marginTop: 4 },
  totalKey:    { fontSize: 15, fontWeight: '700', color: Colors.text },
  totalVal:    { fontSize: 15, fontWeight: '700', color: Colors.gold },
  payGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  payOption:   { width: '47%', backgroundColor: Colors.surf2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', gap: 4 },
  payOptionActive:     { borderColor: Colors.gold, backgroundColor: Colors.goldGlow },
  payOptionText:       { fontSize: 12, color: Colors.textSub, textAlign: 'center', fontWeight: '500' },
  payOptionTextActive: { color: Colors.gold, fontWeight: '700' },
  loadingRow:  { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  confirmRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.greenDk + '40', borderWidth: 2, borderColor: Colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  confirmTitle:{ fontSize: 28, fontWeight: '300', color: Colors.text, marginBottom: 8 },
  confirmSub:  { fontSize: 13, color: Colors.textSub, marginBottom: 4 },
  confirmBtns: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
});
