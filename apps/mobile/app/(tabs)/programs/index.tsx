import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SurfaceCard } from '../../../src/components/ui/SurfaceCard';
import { Tag } from '../../../src/components/ui/Tag';
import { RadialScore } from '../../../src/components/ui/RadialScore';
import { AIBubble } from '../../../src/components/ui/AIBubble';
import { GoldButton } from '../../../src/components/ui/GoldButton';
import { Colors } from '../../../src/lib/theme';

const PROGRAMS = [
  { id:'p1', name:'Executive Longevity Reset', dur:'12 Weeks', price:285000, icon:'👔', tag:'Most Popular', members:24, bioAge:'31.4→28.0', desc:'Compressed protocol for time-poor executives: bi-weekly diagnostics, NAD+ protocol, HBOT course, AI coaching.', aiText:"• Your ApoB at 72 mg/dL and hs-CRP at 0.4 shows your cardiovascular foundation is ready for the next phase of biological age reduction.\n• At Bio Age 31.4 with HRV trending up 12%, you're in the ideal window for the NAD+ + HBOT stack in this program.\n• Executive Longevity Reset's 12-week cadence aligns perfectly with your active program — this is the logical progression." },
  { id:'p2', name:'Biological Age Reversal', dur:'24 Weeks', price:480000, icon:'🔬', tag:'Flagship', members:12, bioAge:'5+ yr reversal', desc:'Comprehensive protocol targeting 5+ year biological age reduction across all modalities with validated outcomes.', aiText:"• With Bio Age at 31.4 (−4.2 from chronological), you've already demonstrated exceptional epigenetic plasticity — this program is designed for people at exactly your stage.\n• Your VO₂ Max at 52.3 and testosterone at 720 ng/dL provide the physiological headroom for the intensive cellular regeneration protocols.\n• The 24-week cadence allows proper sequencing of genomic, hormonal, and metabolic interventions that one-off sessions cannot achieve." },
  { id:'p3', name:'Athlete Peak Performance', dur:'8 Weeks', price:185000, icon:'🏆', tag:'Performance', members:18, bioAge:'VO₂+8', desc:'Recovery, VO2, body composition, and cognitive edge. Full biomechanics + cryo + PEMF + HBOT stack.', aiText:"• Your VO₂ Max at 52.3 is already excellent for age 52 — this program targets the 78th → 90th percentile shift.\n• The cryo + PEMF stack directly addresses your hip flexor tightness flagged in gait analysis, reducing injury risk.\n• Lactate threshold work combined with your current HRV baseline of 68ms will produce measurable Zone 2 efficiency gains within 4 weeks." },
  { id:'p4', name:'NRI Health Intensive', dur:'2 Weeks', price:145000, icon:'🌏', tag:'Intensive', members:8, bioAge:'Full baseline', desc:'Condensed 14-day protocol for NRIs. Complete diagnostics + top therapies — designed to be done in one India visit.', aiText:"• If visiting India within 60 days, this intensive condenses your next diagnostic cycle and top 5 therapies into 14 days.\n• Your existing biomarker baseline means the diagnostic phase will be faster — more time for active therapy sessions.\n• The 14-day immersion format produces measurable HRV and bio age shifts that can be tracked remotely post-departure." },
];

const fmt = (n: number) => n.toLocaleString('en-IN');

export default function ProgramsScreen() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Longevity <Text style={{ color: Colors.gold }}>Programs</Text></Text>
        <Text style={s.sub}>Physician-designed · AI-personalised · Outcome-tracked</Text>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Active Program */}
        <SurfaceCard glow style={s.activeCard}>
          <View style={s.activeTop}>
            <View>
              <Tag>Active Program</Tag>
              <Text style={s.activeName}>Executive Longevity Reset</Text>
              <Text style={s.activeMeta}>Week 6 of 12 · Fat Loss + HRV Protocol</Text>
            </View>
            <RadialScore val={50} size={60} color={Colors.gold} label="W6" sub="of 12" />
          </View>
          <View style={s.progressWrap}>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: '50%' }]} />
            </View>
          </View>
          <View style={s.deltaRow}>
            {[['Waist','↓2.4cm',Colors.green],['Body fat','↓1.8%',Colors.green],['HRV','+12%',Colors.blue],['Bio Age','↓1.8yr',Colors.gold]].map(([k,v,col]) => (
              <View key={k} style={s.deltaCell}>
                <Text style={[s.deltaVal, { color: col as string }]}>{v}</Text>
                <Text style={s.deltaKey}>{k}</Text>
              </View>
            ))}
          </View>
        </SurfaceCard>

        {/* Available Programs */}
        {PROGRAMS.map(p => (
          <SurfaceCard key={p.id} style={s.card}>
            <TouchableOpacity onPress={() => setExpanded(expanded === p.id ? null : p.id)} activeOpacity={0.85}>
              <View style={s.progTop}>
                <View style={s.progLeft}>
                  <View style={s.progIcon}><Text style={{ fontSize: 22 }}>{p.icon}</Text></View>
                  <View style={{ flex: 1 }}>
                    <View style={s.progNameRow}>
                      <Text style={s.progName}>{p.name}</Text>
                      <Tag size={9}>{p.tag}</Tag>
                    </View>
                    <Text style={s.progMeta}>{p.dur} · {p.members} active · Target: {p.bioAge}</Text>
                  </View>
                </View>
                <Text style={s.progPrice}>₹{fmt(p.price)}</Text>
              </View>
              <Text style={s.progDesc}>{p.desc}</Text>
            </TouchableOpacity>

            {/* AI analysis scaffold — expands on tap */}
            {expanded === p.id && (
              <View style={s.aiSection}>
                <Text style={s.aiLabel}>🤖 CHAMP AI Fit Analysis</Text>
                <AIBubble text={p.aiText} type="ai" />
              </View>
            )}

            {expanded !== p.id && (
              <TouchableOpacity onPress={() => setExpanded(p.id)} style={s.expandBtn}>
                <Text style={s.expandText}>🤖 See AI fit analysis →</Text>
              </TouchableOpacity>
            )}

            <GoldButton label="Enrol Now →" size="sm" style={{ marginTop: 10 }} />
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
  activeCard: { backgroundColor: Colors.surf2 },
  activeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  activeName: { fontSize: 17, fontWeight: '700', color: Colors.text, marginTop: 8 },
  activeMeta: { fontSize: 11, color: Colors.textSub },
  progressWrap: { marginBottom: 12 },
  progressTrack: { height: 5, backgroundColor: Colors.surf3, borderRadius: 3 },
  progressFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 3 },
  deltaRow: { flexDirection: 'row', justifyContent: 'space-around' },
  deltaCell: { alignItems: 'center' },
  deltaVal: { fontSize: 14, fontWeight: '700' },
  deltaKey: { fontSize: 9, color: Colors.textMuted, textTransform: 'uppercase', marginTop: 2 },
  progTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  progLeft: { flexDirection: 'row', gap: 12, alignItems: 'center', flex: 1 },
  progIcon: { width: 46, height: 46, borderRadius: 12, backgroundColor: Colors.surf3, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  progNameRow: { flexDirection: 'row', gap: 7, alignItems: 'center', marginBottom: 3, flexWrap: 'wrap' },
  progName: { fontSize: 14, fontWeight: '700', color: Colors.text, flex: 1 },
  progMeta: { fontSize: 11, color: Colors.textSub },
  progPrice: { fontSize: 17, fontWeight: '700', color: Colors.gold, flexShrink: 0 },
  progDesc: { fontSize: 12, color: Colors.textSub, lineHeight: 19, marginBottom: 8 },
  aiSection: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginBottom: 8, gap: 8 },
  aiLabel: { fontSize: 11, color: Colors.purple, fontWeight: '700' },
  expandBtn: { backgroundColor: Colors.purpleDk + '30', borderRadius: 8, padding: 8, alignItems: 'center' },
  expandText: { fontSize: 12, color: Colors.purple, fontWeight: '600' },
});
