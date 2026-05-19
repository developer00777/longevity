import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SurfaceCard } from '../../../src/components/ui/SurfaceCard';
import { Tag } from '../../../src/components/ui/Tag';
import { RadialScore } from '../../../src/components/ui/RadialScore';
import { MiniChart } from '../../../src/components/ui/MiniChart';
import { AIBubble } from '../../../src/components/ui/AIBubble';
import { Colors } from '../../../src/lib/theme';

// ── Scaffold data ─────────────────────────────────────────────────
const BLOOD_MARKERS = {
  cardiovascular: [
    { name: 'ApoB',          val: '72',   unit: 'mg/dL',    ref: '<90',    status: 'optimal', delta: '-18' },
    { name: 'Lp(a)',         val: '8',    unit: 'nmol/L',   ref: '<75',    status: 'optimal', delta: '-3'  },
    { name: 'hs-CRP',        val: '0.4',  unit: 'mg/L',     ref: '<1.0',   status: 'optimal', delta: '-0.3'},
    { name: 'Homocysteine',  val: '9.2',  unit: 'µmol/L',   ref: '<10',    status: 'good',    delta: '-1.1'},
    { name: 'LDL-P',         val: '980',  unit: 'nmol/L',   ref: '<1200',  status: 'good',    delta: '-120'},
    { name: 'HDL',           val: '68',   unit: 'mg/dL',    ref: '>60',    status: 'optimal', delta: '+4'  },
    { name: 'Triglycerides', val: '72',   unit: 'mg/dL',    ref: '<100',   status: 'optimal', delta: '-12' },
  ],
  metabolic: [
    { name: 'Fasting Insulin', val: '4.2', unit: 'µIU/mL', ref: '<5',    status: 'optimal', delta: '-0.8'},
    { name: 'HbA1c',           val: '5.1', unit: '%',      ref: '<5.7',  status: 'optimal', delta: '-0.2'},
    { name: 'Glucose (fast)',  val: '84',  unit: 'mg/dL',  ref: '70-99', status: 'optimal', delta: '-8'  },
    { name: 'HOMA-IR',         val: '0.88',unit: '',       ref: '<1.0',  status: 'optimal', delta: '-0.2'},
    { name: 'Uric Acid',       val: '4.8', unit: 'mg/dL',  ref: '<6.0',  status: 'good',    delta: '-0.4'},
  ],
  hormones: [
    { name: 'Testosterone (Total)', val: '720', unit: 'ng/dL',  ref: '400-900', status: 'optimal', delta: '+85' },
    { name: 'Free Testosterone',    val: '14.2',unit: 'ng/dL',  ref: '>9',      status: 'optimal', delta: '+2.1'},
    { name: 'DHEA-S',               val: '280', unit: 'µg/dL',  ref: '200-400', status: 'optimal', delta: '+35' },
    { name: 'Cortisol (AM)',         val: '14',  unit: 'µg/dL',  ref: '6-18',    status: 'optimal', delta: '-3'  },
    { name: 'TSH',                   val: '1.8', unit: 'mIU/L',  ref: '0.5-2.5', status: 'optimal', delta: '-0.3'},
    { name: 'IGF-1',                 val: '198', unit: 'ng/mL',  ref: '150-250', status: 'good',    delta: '+22' },
  ],
  longevity: [
    { name: 'Blood Age',       val: '34.2', unit: 'yrs',   ref: '<chrono', status: 'optimal', delta: '-2.1'},
    { name: 'NAD⁺ Proxy',    val: '88',   unit: '/100',  ref: '>75',     status: 'optimal', delta: '+12' },
    { name: 'Telomere Length', val: '7.4',  unit: 'kb',    ref: '>7.0',    status: 'good',    delta: '+0.3'},
    { name: 'GlycanAge',       val: '28',   unit: 'yrs',   ref: '<chrono', status: 'optimal', delta: '-5'  },
    { name: 'Omega-6/3 Ratio', val: '2.8',  unit: '',      ref: '<3.0',    status: 'optimal', delta: '-0.6'},
    { name: 'Vitamin D',       val: '62',   unit: 'ng/mL', ref: '50-80',   status: 'optimal', delta: '+8'  },
  ],
};

const SYSTEMS = [
  { label: 'Metabolism',    val: 91, color: Colors.green,  icon: '🔥', markers: '420' },
  { label: 'Cardiovascular',val: 87, color: Colors.blue,   icon: '🫀', markers: '680' },
  { label: 'Body Comp',     val: 84, color: Colors.gold,   icon: '📊', markers: '320' },
  { label: 'Biomechanics',  val: 78, color: Colors.orange, icon: '🏃', markers: '540' },
  { label: 'Sleep',         val: 82, color: Colors.purple, icon: '🌙', markers: '290' },
  { label: 'Genetics',      val: 88, color: Colors.teal,   icon: '🧬', markers: '1250'},
];

const DEXA = [
  { label: 'Body Fat',               val: '14.2%', ref: '10–20%',  bar: 71, color: Colors.gold   },
  { label: 'Lean Mass',              val: '74.8 kg',ref: '72–80 kg',bar: 85, color: Colors.green  },
  { label: 'Visceral Fat',           val: '6 (score)',ref:'<12',    bar: 50, color: Colors.teal   },
  { label: 'Bone Density (T-score)', val: '+1.1',  ref: '>−1.0',   bar: 90, color: Colors.blue   },
  { label: 'Muscle-to-Fat Ratio',    val: '5.26',  ref: '>4.0',    bar: 88, color: Colors.purple },
];

const GAIT = [
  { label: 'Gait Symmetry',         val: '96%',      status: 'optimal'   },
  { label: 'Pelvic Tilt',           val: '4°',       status: 'optimal'   },
  { label: 'Ankle Dorsiflexion (R)',val: '18°',      status: 'good'      },
  { label: 'Hip Flexor Tightness',  val: 'Moderate', status: 'borderline'},
  { label: 'Ground Contact Time',   val: '260ms',    status: 'good'      },
];

const ZONES = [
  { zone:1, name:'Recovery',    range:'<107',    pct:60, color:Colors.blue   },
  { zone:2, name:'Aerobic Base',range:'107–128', pct:20, color:Colors.green  },
  { zone:3, name:'Tempo',       range:'128–145', pct:10, color:Colors.gold   },
  { zone:4, name:'Threshold',   range:'145–161', pct:7,  color:Colors.orange },
  { zone:5, name:'VO₂ Max',    range:'161+',    pct:3,  color:Colors.red    },
];

const SNPS = [
  { gene:'APOE',    variant:'ε3/ε3',        risk:'Standard Alzheimer\'s risk',    status:'good'      },
  { gene:'MTHFR',   variant:'C677T (+/-)',   risk:'Moderate folate metabolism',    status:'borderline'},
  { gene:'ACTN3',   variant:'R577X (+/+)',   risk:'Power athlete profile',         status:'optimal'   },
  { gene:'ACE',     variant:'I/D',           risk:'Balanced cardio profile',       status:'good'      },
  { gene:'FTO',     variant:'rs9939609 T/A', risk:'Modest obesity susceptibility', status:'good'      },
  { gene:'PPARGC1A',variant:'Gly482Ser',     risk:'Elevated endurance potential',  status:'optimal'   },
];

const statusColor = (s: string) =>
  s === 'optimal' ? Colors.green : s === 'good' ? Colors.teal : s === 'borderline' ? Colors.orange : Colors.red;

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'blood',    label: 'Blood',    icon: '🩸' },
  { id: 'body',     label: 'Body',     icon: '🏃' },
  { id: 'fitness',  label: 'Fitness',  icon: '🫀' },
  { id: 'genomics', label: 'Genomics', icon: '🧬' },
];

const BLOOD_CATS = ['cardiovascular', 'metabolic', 'hormones', 'longevity'];

export default function DiagnosticsScreen() {
  const [tab, setTab] = useState('overview');
  const [bloodCat, setBloodCat] = useState('cardiovascular');

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Diagnostics <Text style={{ color: Colors.gold }}>Hub</Text></Text>
        <Text style={s.sub}>3,500+ markers across 6 systems · Physician-interpreted</Text>
      </View>

      {/* Sub-tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabRow}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} style={[s.tabChip, active && s.tabChipActive]}>
              <Text style={[s.tabChipText, active && s.tabChipTextActive]}>{t.icon} {t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <>
            <SurfaceCard glow style={s.card}>
              <View style={s.row}>
                <Text style={s.cardTitle}>Your Diagnostic Profile</Text>
                <Tag color={Colors.greenDk} textColor={Colors.green}>Up to date</Tag>
              </View>
              <View style={s.systemsGrid}>
                {SYSTEMS.map(sys => (
                  <TouchableOpacity key={sys.label} onPress={() => setTab(sys.label === 'Body Comp' ? 'body' : sys.label === 'Genetics' ? 'genomics' : 'fitness')} style={s.sysCell}>
                    <Text style={{ fontSize: 20, marginBottom: 4 }}>{sys.icon}</Text>
                    <RadialScore val={sys.val} size={48} color={sys.color} label={`${sys.val}`} thick={4} />
                    <Text style={s.sysLabel}>{sys.label}</Text>
                    <Text style={s.sysMarkers}>{sys.markers} markers</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </SurfaceCard>

            <Text style={s.sectionCap}>Scheduled Diagnostics</Text>
            {[
              { name: 'Blood Vision — Full Panel', date: 'May 22', markers: '100+ biomarkers', icon: '🩸', urgent: true  },
              { name: 'DEXA Body Composition',     date: 'Jun 5',  markers: 'Full scan',        icon: '📊', urgent: false },
              { name: 'VO₂ Max Retest',           date: 'Jun 12', markers: '5-zone recalibration',icon:'🫀',urgent: false },
            ].map(test => (
              <SurfaceCard key={test.name} style={s.card}>
                <View style={s.row}>
                  <View style={s.testLeft}>
                    <View style={s.testIcon}><Text style={{ fontSize: 20 }}>{test.icon}</Text></View>
                    <View>
                      <Text style={s.testName}>{test.name}</Text>
                      <Text style={s.testDate}>{test.date} · {test.markers}</Text>
                    </View>
                  </View>
                  {test.urgent && <Tag color={Colors.orangeDk} textColor={Colors.orange} size={9}>Due Soon</Tag>}
                </View>
              </SurfaceCard>
            ))}
          </>
        )}

        {/* ── Blood Vision ── */}
        {tab === 'blood' && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
              {BLOOD_CATS.map(cat => (
                <TouchableOpacity key={cat} onPress={() => setBloodCat(cat)} style={[s.catChip, bloodCat === cat && s.catChipActive]}>
                  <Text style={[s.catChipText, bloodCat === cat && s.catChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* AI analysis scaffold */}
            <AIBubble
              text={`Your ${bloodCat} markers are trending in the right direction. ApoB at 72 mg/dL is excellent — continue the protocol. Next focus: ${bloodCat === 'hormones' ? 'free testosterone optimisation' : 'consistency over the next 4 weeks'}.`}
              type="ai"
            />

            <View style={{ gap: 8, marginTop: 12 }}>
              {(BLOOD_MARKERS[bloodCat as keyof typeof BLOOD_MARKERS] ?? []).map(m => (
                <SurfaceCard key={m.name} style={s.card}>
                  <View style={s.markerRow}>
                    <View style={{ flex: 1 }}>
                      <View style={s.markerNameRow}>
                        <Text style={s.markerName}>{m.name}</Text>
                        <Tag color={statusColor(m.status) + '33'} textColor={statusColor(m.status)} size={9}>{m.status}</Tag>
                      </View>
                      <Text style={s.markerRef}>Ref: {m.ref}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[s.markerVal, { color: statusColor(m.status) }]}>{m.val}</Text>
                      <Text style={s.markerUnit}>{m.unit}</Text>
                      <Text style={[s.markerDelta, { color: m.delta.startsWith('-') ? Colors.red : Colors.green }]}>{m.delta} WoW</Text>
                    </View>
                  </View>
                </SurfaceCard>
              ))}
            </View>
          </>
        )}

        {/* ── Body Comp ── */}
        {tab === 'body' && (
          <>
            <SurfaceCard style={s.card}>
              <Text style={s.cardTitle}>DEXA Body Composition</Text>
              {DEXA.map(b => (
                <View key={b.label} style={{ marginBottom: 12 }}>
                  <View style={s.dexaRow}>
                    <Text style={s.dexaLabel}>{b.label}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <Text style={s.dexaRef}>Ref: {b.ref}</Text>
                      <Text style={[s.dexaVal, { color: b.color }]}>{b.val}</Text>
                    </View>
                  </View>
                  <View style={s.track}>
                    <View style={[s.fill, { width: `${b.bar}%` as any, backgroundColor: b.color }]} />
                  </View>
                </View>
              ))}
            </SurfaceCard>
            <SurfaceCard style={s.card}>
              <Text style={s.cardTitle}>3D Gait & Biomechanics</Text>
              {GAIT.map(g => (
                <View key={g.label} style={s.gaitRow}>
                  <Text style={s.gaitLabel}>{g.label}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <Tag color={statusColor(g.status) + '33'} textColor={statusColor(g.status)} size={9}>{g.status}</Tag>
                    <Text style={s.gaitVal}>{g.val}</Text>
                  </View>
                </View>
              ))}
            </SurfaceCard>
          </>
        )}

        {/* ── Fitness ── */}
        {tab === 'fitness' && (
          <>
            <SurfaceCard style={s.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <View>
                  <Text style={s.cardTitle}>VO₂ Max</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                    <Text style={[s.bigNum, { color: Colors.orange }]}>52.3</Text>
                    <Text style={s.bigNumUnit}>mL/kg/min</Text>
                  </View>
                  <Tag color={Colors.orangeDk} textColor={Colors.orange} size={9}>Excellent for age 52</Tag>
                </View>
                <RadialScore val={78} size={70} color={Colors.orange} label="78th" sub="%-ile" />
              </View>
              <MiniChart data={[46,48,49.5,50.2,51,51.8,52.3]} color={Colors.orange} height={50} />
            </SurfaceCard>
            <SurfaceCard style={s.card}>
              <Text style={s.cardTitle}>Personalised HR Zones</Text>
              <Text style={[s.sub, { marginBottom: 12 }]}>Based on lactate threshold + VO₂ max test</Text>
              {ZONES.map(z => (
                <View key={z.zone} style={{ marginBottom: 12 }}>
                  <View style={s.zoneRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={[s.zoneDot, { backgroundColor: z.color }]} />
                      <Text style={s.zoneName}>Z{z.zone} — {z.name}</Text>
                    </View>
                    <Text style={[s.zoneRange, { color: z.color }]}>{z.range} bpm</Text>
                  </View>
                  <View style={s.track}>
                    <View style={[s.fill, { width: `${z.pct}%` as any, backgroundColor: z.color }]} />
                  </View>
                </View>
              ))}
            </SurfaceCard>
          </>
        )}

        {/* ── Genomics ── */}
        {tab === 'genomics' && (
          <SurfaceCard style={s.card}>
            <View style={s.row}>
              <View>
                <Text style={s.cardTitle}>Longevity Genomics Panel</Text>
                <Text style={s.sub}>312 SNPs analysed · Jan 2026</Text>
              </View>
              <Tag color={Colors.tealDk} textColor={Colors.teal}>Lifetime Data</Tag>
            </View>
            {SNPS.map(g => (
              <View key={g.gene} style={s.snpRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Text style={[s.snpGene, { color: Colors.teal }]}>{g.gene} </Text>
                    <Text style={s.snpVariant}>{g.variant}</Text>
                  </View>
                  <Text style={s.snpRisk}>{g.risk}</Text>
                </View>
                <Tag color={statusColor(g.status) + '33'} textColor={statusColor(g.status)} size={9}>{g.status}</Tag>
              </View>
            ))}
          </SurfaceCard>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.bg },
  header:   { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title:    { fontSize: 26, fontWeight: '300', color: Colors.text },
  sub:      { fontSize: 12, color: Colors.textSub, marginTop: 3 },
  tabScroll:{ flexShrink: 0 },
  tabRow:   { paddingHorizontal: 14, paddingBottom: 10, gap: 6 },
  tabChip:  { backgroundColor: Colors.surf2, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  tabChipActive:     { backgroundColor: Colors.gold, borderColor: Colors.gold },
  tabChipText:       { fontSize: 11, fontWeight: '600', color: Colors.textSub },
  tabChipTextActive: { color: Colors.bg },
  scroll:   { padding: 14, paddingBottom: 24, gap: 12 },
  card:     {},
  sectionCap: { fontSize: 10, color: Colors.textSub, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle:{ fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  systemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sysCell:  { width: '30.5%', flex: 1, backgroundColor: Colors.surf3, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  sysLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  sysMarkers:{ fontSize: 9, color: Colors.textMuted },
  testLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  testIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.surf3, alignItems: 'center', justifyContent: 'center' },
  testName: { fontSize: 14, fontWeight: '500', color: Colors.text },
  testDate: { fontSize: 11, color: Colors.textSub, marginTop: 2 },
  catRow:   { gap: 8, paddingBottom: 10, marginBottom: 4 },
  catChip:  { backgroundColor: Colors.surf2, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  catChipActive:     { backgroundColor: Colors.gold, borderColor: Colors.gold },
  catChipText:       { fontSize: 11, fontWeight: '600', color: Colors.textSub, textTransform: 'capitalize' },
  catChipTextActive: { color: Colors.bg },
  markerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  markerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  markerName:    { fontSize: 14, fontWeight: '600', color: Colors.text },
  markerRef:     { fontSize: 11, color: Colors.textSub },
  markerVal:     { fontSize: 20, fontWeight: '700' },
  markerUnit:    { fontSize: 10, color: Colors.textMuted },
  markerDelta:   { fontSize: 10, marginTop: 2 },
  dexaRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  dexaLabel:{ fontSize: 12, color: Colors.text },
  dexaRef:  { fontSize: 11, color: Colors.textSub },
  dexaVal:  { fontSize: 14, fontWeight: '700' },
  track:    { height: 5, backgroundColor: Colors.surf3, borderRadius: 3 },
  fill:     { height: '100%', borderRadius: 3 },
  gaitRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  gaitLabel:{ fontSize: 13, color: Colors.text },
  gaitVal:  { fontSize: 13, fontWeight: '600', color: Colors.text },
  bigNum:   { fontSize: 36, fontWeight: '700', lineHeight: 40 },
  bigNumUnit:{ fontSize: 12, color: Colors.textSub },
  zoneRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  zoneDot:  { width: 8, height: 8, borderRadius: 2 },
  zoneName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  zoneRange:{ fontSize: 12, fontWeight: '700' },
  snpRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  snpGene:  { fontSize: 14, fontWeight: '700' },
  snpVariant:{ fontSize: 12, color: Colors.textSub },
  snpRisk:  { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});
