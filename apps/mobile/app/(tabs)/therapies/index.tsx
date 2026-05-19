import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SurfaceCard } from '../../../src/components/ui/SurfaceCard';
import { Tag } from '../../../src/components/ui/Tag';
import { GoldButton } from '../../../src/components/ui/GoldButton';
import { Colors } from '../../../src/lib/theme';

const TREATMENTS = [
  { id:1,  cat:'Oxygen & Pressure', group:'recovery', name:'Hyperbaric Oxygen Therapy', short:'HBOT', dur:60, price:8500, tag:'Most Popular', icon:'🫧', desc:'100% O₂ under elevated pressure. Accelerates cellular repair, reduces inflammation, boosts mitochondrial function.', benefits:['Cellular regen','Anti-inflammatory','Neuro-recovery','Wound healing'], markers:['ROS','hs-CRP','VO₂ Max'] },
  { id:2,  cat:'Light Therapy', group:'recovery', name:'Red Light / Photobiomodulation', short:'Red Light', dur:20, price:3500, tag:'Daily', icon:'🔴', desc:'660–850nm photobiomodulation. Stimulates ATP production, collagen synthesis, and mitochondrial respiration.', benefits:['Skin rejuvenation','Muscle recovery','Energy boost','Sleep quality'], markers:['ATP proxy','HRV','Skin elasticity'] },
  { id:3,  cat:'Thermal Therapy', group:'recovery', name:'Full-Spectrum Infrared Sauna', short:'IR Sauna', dur:45, price:4200, tag:'Detox', icon:'🌡️', desc:'Near, mid & far IR wavelengths. Deep tissue detox, cardiovascular conditioning, and heavy metal elimination.', benefits:['Detoxification','Cardio health','Pain relief','Longevity genes'], markers:['Cortisol','Core temp','HRV'] },
  { id:4,  cat:'Cold Therapy', group:'recovery', name:'Whole-Body Cryotherapy', short:'Cryo', dur:3, price:3800, tag:'Recovery', icon:'❄️', desc:'−140°C nitrogen mist for 3 minutes. Systemic anti-inflammatory response, endorphin surge, nervous system reset.', benefits:['Inflammation ↓','Endorphins','Fat oxidation','Mental clarity'], markers:['CRP','Cortisol','Dopamine'] },
  { id:5,  cat:'IV & Infusion', group:'cellular', name:'NAD⁺ IV Infusion', short:'NAD⁺', dur:180, price:22000, tag:'Premium', icon:'⚡', desc:'Nicotinamide adenine dinucleotide IV drip. Directly replenishes cellular energy. Epigenetic age reversal marker.', benefits:['Cellular energy','DNA repair','Cognitive clarity','Metabolic health'], markers:['NAD levels','Bio Age','Cognitive'] },
  { id:6,  cat:'IV & Infusion', group:'cellular', name:"Myers' Cocktail Plus", short:"Myers'", dur:60, price:12000, tag:'Signature', icon:'💧', desc:"High-dose Mg, B-complex, Vitamin C, Glutathione, Zinc IV blend for peak immunity and performance.", benefits:['Immune boost','Energy','Antioxidant','Gut support'], markers:['Vitamin levels','Oxidative stress','Immune'] },
  { id:7,  cat:'IV & Infusion', group:'cellular', name:'Glutathione Push', short:'GSH', dur:30, price:7500, tag:'Antioxidant', icon:'✨', desc:'Master antioxidant IV. Combats oxidative stress, detoxifies liver, brightens skin and slows cellular aging.', benefits:['Antioxidant','Liver detox','Skin','Anti-aging'], markers:['GSH','Liver enzymes','Oxidative stress'] },
  { id:8,  cat:'Peptide & Hormone', group:'cellular', name:'BPC-157 + TB-500 Protocol', short:'Peptides', dur:45, price:18000, tag:'Regenerative', icon:'🧬', desc:'Physician-guided peptide protocol for tissue repair, gut healing, and systemic recovery acceleration.', benefits:['Tissue repair','Gut healing','Tendon recovery','Angiogenesis'], markers:['Repair markers','GI biomarkers','Recovery'] },
  { id:9,  cat:'Neural & Cognitive', group:'neural', name:'Neurofeedback Session', short:'Neuro', dur:60, price:9500, tag:'Brain', icon:'🧠', desc:'Real-time EEG-guided brainwave training. Reduce stress, sharpen focus, improve sleep architecture.', benefits:['Focus','Stress ↓','Sleep quality','Mental performance'], markers:['Brainwave patterns','Stress index','Focus score'] },
  { id:10, cat:'Neural & Cognitive', group:'neural', name:'Float Tank / Sensory Deprivation', short:'Float', dur:90, price:5500, tag:'Recovery', icon:'🌊', desc:'Sensory deprivation float pod. Deep parasympathetic activation, cortisol reset, and magnesium absorption.', benefits:['Cortisol ↓','Pain relief','Creativity','Deep rest'], markers:['Cortisol','Magnesium','HRV'] },
  { id:11, cat:'Diagnostics', group:'diagnostics', name:'Full Longevity Biomarker Panel', short:'Bio Panel', dur:120, price:28000, tag:'Diagnostic', icon:'🔬', desc:'95-biomarker blood panel covering biological age, metabolic health, inflammation, hormones, micronutrients.', benefits:['Baseline health','Disease prevention','Personalisation','Tracking'], markers:['95 biomarkers','Bio Age score','All systems'] },
  { id:12, cat:'Diagnostics', group:'diagnostics', name:'DEXA Body Composition Scan', short:'DEXA', dur:30, price:6500, tag:'Scan', icon:'📊', desc:'Precise body fat, lean mass, bone density, and visceral fat mapping. Gold standard for body composition.', benefits:['Body fat %','Muscle mass','Bone density','Visceral fat'], markers:['Body fat %','Lean mass','Bone density'] },
  { id:13, cat:'Sleep Optimisation', group:'recovery', name:'Sleep Architecture + Circadian Reset', short:'Sleep Rx', dur:90, price:15000, tag:'Recovery', icon:'🌙', desc:'PSG-level sleep staging with AI coaching. Deep sleep augmentation and circadian rhythm optimisation.', benefits:['Deep sleep','HRV','Recovery','Cognitive performance'], markers:['Sleep stages','HRV','Cortisol AM/PM'] },
];

const GROUPS = ['all','recovery','cellular','neural','diagnostics'];
const RECOVERY_MODALITIES = [
  { icon:'🫧', label:'Oxygen', active:true }, { icon:'❄️', label:'Cold', active:true },
  { icon:'🌡️', label:'Thermal', active:true }, { icon:'💧', label:'IV', active:false },
  { icon:'🌙', label:'Sleep', active:true }, { icon:'🧬', label:'Cellular', active:false },
];
const fmt = (n) => n.toLocaleString('en-IN');

export default function TherapiesScreen() {
  const [activeGroup, setActiveGroup] = useState('all');
  const filtered = activeGroup === 'all' ? TREATMENTS : TREATMENTS.filter(t => t.group === activeGroup);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Longevity <Text style={{ color: Colors.gold }}>Therapies</Text></Text>
        <Text style={s.sub}>{TREATMENTS.length} therapies · 7 systems · Physician-guided</Text>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <SurfaceCard style={[s.card, { borderColor: Colors.teal + '30' }]}>
          <Text style={s.bannerTitle}>Recovery System — Active</Text>
          <View style={s.modalityRow}>
            {RECOVERY_MODALITIES.map(m => (
              <View key={m.label} style={[s.chip, m.active && s.chipActive]}>
                <Text style={{ fontSize: 13 }}>{m.icon}</Text>
                <Text style={[s.chipLabel, m.active && s.chipLabelActive]}>{m.label}</Text>
                {m.active && <View style={s.dot} />}
              </View>
            ))}
          </View>
        </SurfaceCard>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {GROUPS.map(g => (
            <TouchableOpacity key={g} onPress={() => setActiveGroup(g)} style={[s.filterChip, activeGroup === g && s.filterActive]}>
              <Text style={[s.filterText, activeGroup === g && s.filterTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {filtered.map(t => (
          <SurfaceCard key={t.id} style={s.card} onPress={() => router.push({ pathname: '/(tabs)/therapies/book', params: { id: String(t.id) } })}>
            <View style={s.treatTop}>
              <View style={s.iconWrap}><Text style={{ fontSize: 22 }}>{t.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <View style={s.nameRow}>
                  <Text style={s.treatName} numberOfLines={2}>{t.name}</Text>
                  <Tag size={9}>{t.tag}</Tag>
                </View>
                <Text style={s.meta}>{t.cat} · {t.dur} min</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.price}>₹{fmt(t.price)}</Text>
                <Text style={s.per}>/ session</Text>
              </View>
            </View>
            <Text style={s.desc}>{t.desc}</Text>
            <View style={s.chips}>
              {t.benefits.map(b => <View key={b} style={s.bChip}><Text style={s.bText}>{b}</Text></View>)}
            </View>
            <View style={s.chips}>
              {t.markers.map(m => <View key={m} style={s.mChip}><Text style={s.mText}>📊 {m}</Text></View>)}
            </View>
            <GoldButton label="Book Session →" size="sm" style={{ marginTop: 10 }} onPress={() => router.push({ pathname: '/(tabs)/therapies/book', params: { id: String(t.id) } })} />
          </SurfaceCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '300', color: Colors.text },
  sub: { fontSize: 12, color: Colors.textSub, marginTop: 3 },
  scroll: { padding: 14, paddingBottom: 24, gap: 12 },
  card: {},
  bannerTitle: { fontSize: 10, color: Colors.teal, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  modalityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surf3, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  chipActive: { backgroundColor: Colors.tealDk + '60', borderColor: Colors.teal + '40' },
  chipLabel: { fontSize: 11, color: Colors.textSub },
  chipLabelActive: { color: Colors.teal },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.teal },
  filterRow: { gap: 6, paddingBottom: 4, marginBottom: 4 },
  filterChip: { backgroundColor: Colors.surf2, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  filterActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  filterText: { fontSize: 11, fontWeight: '600', color: Colors.textSub, textTransform: 'capitalize' },
  filterTextActive: { color: Colors.bg },
  treatTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.surf3, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginBottom: 3 },
  treatName: { fontSize: 13, fontWeight: '600', color: Colors.text, flex: 1 },
  meta: { fontSize: 11, color: Colors.textSub },
  price: { fontSize: 16, fontWeight: '700', color: Colors.gold },
  per: { fontSize: 10, color: Colors.textMuted },
  desc: { fontSize: 12, color: Colors.textSub, lineHeight: 19, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  bChip: { backgroundColor: Colors.surf3, borderWidth: 1, borderColor: Colors.border, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  bText: { fontSize: 10, color: Colors.textSub },
  mChip: { backgroundColor: Colors.goldGlow, borderWidth: 1, borderColor: Colors.goldDk + '40', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  mText: { fontSize: 10, color: Colors.gold },
});
