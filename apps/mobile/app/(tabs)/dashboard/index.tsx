import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useHealthStore } from '../../../src/stores/health.store';
import { syncHealthData, requestHealthPermissions } from '../../../src/modules/health-sync';
import { SurfaceCard } from '../../../src/components/ui/SurfaceCard';
import { Tag } from '../../../src/components/ui/Tag';
import { RadialScore } from '../../../src/components/ui/RadialScore';
import { MiniChart } from '../../../src/components/ui/MiniChart';
import { AIBubble } from '../../../src/components/ui/AIBubble';
import { GoldButton } from '../../../src/components/ui/GoldButton';
import { Colors } from '../../../src/lib/theme';

// ── Static scaffold data (replaced by real data once diagnostics exist) ──────
const PERFORMANCE_SCORES = [
  { key: 'cardiovascular', label: 'Cardio',   val: 87, color: Colors.blue   },
  { key: 'metabolic',      label: 'Metabolic', val: 91, color: Colors.green  },
  { key: 'sleep',          label: 'Sleep',     val: 82, color: Colors.purple },
  { key: 'recovery',       label: 'Recovery',  val: 84, color: Colors.teal   },
  { key: 'cognitive',      label: 'Cognitive', val: 79, color: Colors.orange },
  { key: 'longevity',      label: 'Longevity', val: 88, color: Colors.gold   },
];

const VITALS = [
  { label: 'HRV',       val: '68',   unit: 'ms',     delta: '+12%', color: Colors.blue,   data: [52,58,55,61,64,60,68] },
  { label: 'Glucose',   val: '94',   unit: 'mg/dL',  delta: '-8%',  color: Colors.gold,   data: [104,98,102,96,94,99,94] },
  { label: 'Sleep',     val: '7.4',  unit: 'hrs',    delta: '+0.4', color: Colors.purple, data: [6.8,7.1,7.4,7.0,7.8,7.2,7.4] },
  { label: 'VO₂ Max',  val: '52.3', unit: 'mL/kg',  delta: '+3.1', color: Colors.orange, data: [49,50,51,51.3,52,51.8,52.3] },
  { label: 'Recovery',  val: '84',   unit: '%',      delta: '+6',   color: Colors.green,  data: [72,76,78,80,82,79,84] },
  { label: 'Stress',    val: 'Low',  unit: '',       delta: '↓ trend', color: Colors.teal, data: [65,60,55,52,48,50,44] },
];

const STREAKS = [
  { label: 'HBOT Sessions',       count: 8,  target: 12, icon: '🫧', color: Colors.blue   },
  { label: 'Sleep 7h+ streak',    count: 14, target: 21, icon: '🌙', color: Colors.purple },
  { label: 'Sub-100 Glucose',     count: 9,  target: 14, icon: '🩸', color: Colors.gold   },
  { label: 'HRV Improving',       count: 6,  target: 7,  icon: '💓', color: Colors.green  },
];

const PERSONAL_BESTS = [
  { label: 'HRV Record',     value: '74ms',    date: 'May 9',  icon: '💓', color: Colors.green  },
  { label: 'Recovery Score', value: '91%',     date: 'Apr 22', icon: '⚡', color: Colors.gold   },
  { label: 'Sleep Score',    value: '94/100',  date: 'May 2',  icon: '🌙', color: Colors.purple },
  { label: 'VO₂ Max',       value: '52.3',    date: 'Apr 30', icon: '🫀', color: Colors.orange },
];

const MILESTONES = [
  { label: 'Bio Age −5 yrs',    done: false, icon: '🧬', progress: 84 },
  { label: 'VO₂ Max 55+',      done: false, icon: '🫀', progress: 65 },
  { label: '100 Days Protocol', done: false, icon: '📅', progress: 48 },
  { label: 'First HBOT Course', done: true,  icon: '🫧', progress: 100 },
];

const QUICK_BOOK = [
  { icon: '🫧', short: 'HBOT' },
  { icon: '🔴', short: 'Red Light' },
  { icon: '🌡️', short: 'IR Sauna' },
  { icon: '❄️', short: 'Cryo' },
  { icon: '⚡', short: 'NAD⁺' },
  { icon: '💧', short: "Myers'" },
  { icon: '🧠', short: 'Neuro' },
  { icon: '🌊', short: 'Float' },
];

const AI_INSIGHT = 'Your HRV climbed 12% this week — sleep consistency is the driver. Your upcoming HBOT session should push recovery scores past 88; maintain your 22:30 wind-down tonight.';

export default function HomeScreen() {
  const { session, profile } = useAuthStore();
  const { syncStatus, snapshot, setSyncStatus, setSnapshot } = useHealthStore();
  const firstName = profile?.name?.split(' ')[0] ?? 'there';

  useEffect(() => {
    if (session && syncStatus.state === 'idle' && Platform.OS !== 'web') {
      handleSync();
    }
  }, [session]);

  async function handleSync() {
    setSyncStatus({ state: 'syncing' });
    const status = await requestHealthPermissions();
    if (status.state === 'denied' || status.state === 'not_installed' || status.state === 'error') {
      setSyncStatus(status);
      return;
    }
    if (session?.user.id) {
      const result = await syncHealthData(session.user.id);
      if (result) setSnapshot(result);
      else setSyncStatus({ state: 'error', reason: 'Sync failed' });
    }
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();

  return (
    <SafeAreaView style={s.safe}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <View style={s.logoRow}>
          <View style={s.logoBox}><Text style={s.logoLetter}>C</Text></View>
          <View>
            <Text style={s.logoName}>CHAMPIONS</Text>
            <Text style={s.logoSub}>100x Longevity Center</Text>
          </View>
        </View>
        <View style={s.topRight}>
          <View style={s.livePill}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>LIVE</Text>
          </View>
          <View style={s.avatar}><Text style={s.avatarText}>{firstName[0]?.toUpperCase()}</Text></View>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Greeting */}
        <View style={s.greetRow}>
          <View>
            <Text style={s.dateText}>{dateStr}</Text>
            <Text style={s.greetTitle}>Good morning,</Text>
            <Text style={[s.greetTitle, { color: Colors.gold }]}>{firstName}</Text>
          </View>
          <View style={s.greetRight}>
            <Tag color={Colors.greenDk} textColor={Colors.green}>Optimal Recovery</Tag>
            <Text style={s.syncedText}>Ring AIR synced 2m ago</Text>
          </View>
        </View>

        {/* Overall Performance */}
        <SurfaceCard glow style={s.perfCard}>
          <View style={s.perfTop}>
            <View>
              <Text style={s.sectionCap}>Overall Performance</Text>
              <View style={s.scoreRow}>
                <Text style={s.bigScore}>87</Text>
                <Text style={s.scoreMax}>/100</Text>
              </View>
              <Text style={s.scoreDelta}>▲ +6 pts from last month</Text>
            </View>
            <RadialScore val={87} size={82} color={Colors.green} label="87" sub="health" />
          </View>
          <View style={s.perfGrid}>
            {PERFORMANCE_SCORES.map(p => (
              <View key={p.key} style={s.perfCell}>
                <Text style={[s.perfVal, { color: p.val >= 85 ? Colors.green : p.val >= 70 ? Colors.gold : Colors.orange }]}>{p.val}</Text>
                <Text style={s.perfLabel}>{p.label}</Text>
              </View>
            ))}
          </View>
        </SurfaceCard>

        {/* Bio Age */}
        <SurfaceCard style={s.card}>
          <View style={s.bioRow}>
            <View>
              <Text style={s.sectionCap}>Biological Age</Text>
              <View style={s.bioAgeRow}>
                <Text style={s.bioAge}>31.4</Text>
                <Text style={s.bioAgeUnit}>yrs</Text>
              </View>
              <View style={s.bioTagRow}>
                <Text style={s.bioYounger}>▼ 4.2 yrs younger</Text>
                <Text style={s.bioVs}>vs chrono (52)</Text>
              </View>
              <View style={s.tagRow}>
                <Tag color={Colors.tealDk} textColor={Colors.teal} size={9}>Blood Age: 34.2</Tag>
                <Tag color={Colors.greenDk} textColor={Colors.green} size={9}>GlycanAge: 28</Tag>
              </View>
            </View>
            <RadialScore val={84} size={70} color={Colors.teal} label="84" sub="score" />
          </View>
          <View style={s.chartWrap}>
            <MiniChart data={[36.1, 35.4, 34.6, 33.9, 33.2, 32.4, 31.4]} color={Colors.gold} height={48} />
            <View style={s.chartLabels}>
              {['8w','7w','6w','5w','4w','2w','Now'].map(l => (
                <Text key={l} style={s.chartLabel}>{l}</Text>
              ))}
            </View>
          </View>
        </SurfaceCard>

        {/* Diagnostics entry — pushes to full hub without taking a tab slot */}
        <TouchableOpacity onPress={() => router.push('/(tabs)/diagnostics')} activeOpacity={0.85}>
          <SurfaceCard style={s.diagCard}>
            <View style={s.diagRow}>
              <View style={s.diagLeft}>
                <Text style={s.diagIcon}>🔬</Text>
                <View>
                  <Text style={s.diagTitle}>Diagnostics Hub</Text>
                  <Text style={s.diagSub}>3,500+ markers · Blood · Body · Genomics</Text>
                </View>
              </View>
              <View style={s.diagArrowWrap}>
                <Text style={s.diagArrow}>›</Text>
              </View>
            </View>
            <View style={s.diagChips}>
              {['Blood Vision','Body Comp','Fitness','Genomics'].map(chip => (
                <View key={chip} style={s.diagChip}>
                  <Text style={s.diagChipText}>{chip}</Text>
                </View>
              ))}
            </View>
          </SurfaceCard>
        </TouchableOpacity>

        {/* Live Vitals */}
        <View style={s.vitalsGrid}>
          {VITALS.map(v => (
            <View key={v.label} style={s.vitalCell}>
              <Text style={s.vitalLabel}>{v.label}</Text>
              <Text style={[s.vitalVal, { color: v.color }]}>{v.val}</Text>
              <Text style={s.vitalUnit}>{v.unit}</Text>
              <MiniChart data={v.data} color={v.color} height={24} />
              <Text style={[s.vitalDelta, {
                color: v.delta.startsWith('+') ? Colors.green
                     : v.delta.startsWith('-') ? Colors.red
                     : Colors.textSub
              }]}>{v.delta}</Text>
            </View>
          ))}
        </View>

        {/* Streaks */}
        <SurfaceCard style={s.card}>
          <View style={s.sectionHeader}>
            <View style={s.sectionTitleRow}>
              <Text style={s.sectionIcon}>🔥</Text>
              <Text style={s.sectionTitle}>BODY SIGNAL — STREAKS</Text>
            </View>
            <Tag color={Colors.goldDk}>Active</Tag>
          </View>
          {STREAKS.map(streak => (
            <View key={streak.label} style={s.streakRow}>
              <View style={s.streakLeft}>
                <Text style={s.streakIcon}>{streak.icon}</Text>
                <Text style={s.streakLabel}>{streak.label}</Text>
              </View>
              <Text style={[s.streakCount, { color: streak.color }]}>{streak.count}/{streak.target}</Text>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${(streak.count / streak.target) * 100}%` as any, backgroundColor: streak.color }]} />
              </View>
            </View>
          ))}
        </SurfaceCard>

        {/* Personal Bests */}
        <SurfaceCard style={s.card}>
          <View style={[s.sectionTitleRow, { marginBottom: 12 }]}>
            <Text style={s.sectionIcon}>🏅</Text>
            <Text style={s.sectionTitle}>PERSONAL BESTS</Text>
          </View>
          <View style={s.pbGrid}>
            {PERSONAL_BESTS.map(pb => (
              <View key={pb.label} style={s.pbCell}>
                <Text style={s.pbIcon}>{pb.icon}</Text>
                <View>
                  <Text style={[s.pbValue, { color: pb.color }]}>{pb.value}</Text>
                  <Text style={s.pbLabel}>{pb.label}</Text>
                  <Text style={s.pbDate}>{pb.date}</Text>
                </View>
              </View>
            ))}
          </View>
        </SurfaceCard>

        {/* AI Coach — scaffolded */}
        <SurfaceCard style={s.card}>
          <View style={s.aiHeader}>
            <View style={s.aiTitleRow}>
              <View style={s.aiBadge}><Text style={{ fontSize: 14 }}>🤖</Text></View>
              <Text style={s.aiTitle}>CHAMP AI COACH</Text>
            </View>
          </View>
          <AIBubble text={AI_INSIGHT} type="ai" />
          <TouchableOpacity onPress={() => router.push('/(tabs)/chat')} style={s.aiLink}>
            <Text style={s.aiLinkText}>Ask CHAMP AI anything →</Text>
          </TouchableOpacity>
        </SurfaceCard>

        {/* Milestones */}
        <SurfaceCard style={s.card}>
          <View style={[s.sectionTitleRow, { marginBottom: 12 }]}>
            <Text style={s.sectionIcon}>🎯</Text>
            <Text style={s.sectionTitle}>MILESTONES</Text>
          </View>
          {MILESTONES.map(m => (
            <View key={m.label} style={s.milestoneRow}>
              <View style={[s.milestoneIcon, m.done && s.milestoneIconDone]}>
                <Text style={{ fontSize: 18 }}>{m.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.milestoneTop}>
                  <Text style={s.milestoneLabel}>{m.label}</Text>
                  <Text style={[s.milestonePct, { color: m.done ? Colors.green : Colors.textSub }]}>{m.progress}%</Text>
                </View>
                <View style={s.progressTrack}>
                  <View style={[s.progressFill, { width: `${m.progress}%` as any, backgroundColor: m.done ? Colors.green : Colors.gold }]} />
                </View>
              </View>
            </View>
          ))}
        </SurfaceCard>

        {/* Quick Book */}
        <View style={s.quickBookSection}>
          <Text style={s.sectionCap}>Quick Book</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickBookRow}>
            {QUICK_BOOK.map(t => (
              <TouchableOpacity
                key={t.short}
                onPress={() => router.push('/(tabs)/explore')}
                style={s.quickChip}
              >
                <Text style={s.quickChipText}>{t.icon} {t.short}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  topBar:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.surf, borderBottomWidth: 1, borderBottomColor: Colors.border },
  logoRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox:     { width: 30, height: 30, borderRadius: 7, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  logoLetter:  { fontSize: 15, fontWeight: '900', color: Colors.bg },
  logoName:    { fontSize: 12, fontWeight: '800', color: Colors.gold, letterSpacing: 1 },
  logoSub:     { fontSize: 8, color: Colors.textMuted, letterSpacing: 1.4, textTransform: 'uppercase' },
  topRight:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  livePill:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  liveText:    { fontSize: 11, color: Colors.textSub },
  avatar:      { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: 14, fontWeight: '700', color: Colors.bg },
  scroll:      { padding: 14, paddingBottom: 24, gap: 12 },
  greetRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  dateText:    { fontSize: 10, color: Colors.textSub, letterSpacing: 0.6 },
  greetTitle:  { fontSize: 28, fontWeight: '300', color: Colors.text, lineHeight: 34 },
  greetRight:  { alignItems: 'flex-end', gap: 6 },
  syncedText:  { fontSize: 10, color: Colors.textMuted },
  card:        {},
  perfCard:    { backgroundColor: Colors.surf2 },
  perfTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionCap:  { fontSize: 10, color: Colors.textSub, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  scoreRow:    { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  bigScore:    { fontSize: 52, fontWeight: '300', color: Colors.gold, lineHeight: 56 },
  scoreMax:    { fontSize: 13, color: Colors.textSub },
  scoreDelta:  { fontSize: 12, color: Colors.green, marginTop: 4 },
  perfGrid:    { flexDirection: 'row', flexWrap: 'wrap' },
  perfCell:    { width: '33.33%', backgroundColor: Colors.surf3, padding: 8, alignItems: 'center', margin: 2, borderRadius: 8 },
  perfVal:     { fontSize: 15, fontWeight: '700' },
  perfLabel:   { fontSize: 9, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  bioRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bioAgeRow:   { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  bioAge:      { fontSize: 40, fontWeight: '700', color: Colors.gold, lineHeight: 44 },
  bioAgeUnit:  { fontSize: 12, color: Colors.textSub },
  bioTagRow:   { flexDirection: 'row', gap: 10, marginTop: 6 },
  bioYounger:  { fontSize: 12, color: Colors.green, fontWeight: '600' },
  bioVs:       { fontSize: 12, color: Colors.textMuted },
  tagRow:      { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  chartWrap:   { marginTop: 12 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  chartLabel:  { fontSize: 9, color: Colors.textMuted },
  vitalsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vitalCell:   { width: '30.5%', flex: 1, backgroundColor: Colors.surf2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 10, paddingBottom: 6 },
  vitalLabel:  { fontSize: 9, color: Colors.textSub, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  vitalVal:    { fontSize: 18, fontWeight: '700', lineHeight: 20 },
  vitalUnit:   { fontSize: 9, color: Colors.textMuted, marginBottom: 4 },
  vitalDelta:  { fontSize: 9, marginTop: 3 },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon:     { fontSize: 16 },
  sectionTitle:    { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  streakRow:   { marginBottom: 12 },
  streakLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, justifyContent: 'space-between' },
  streakIcon:  { fontSize: 16 },
  streakLabel: { fontSize: 12, color: Colors.text, flex: 1 },
  streakCount: { fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 5, backgroundColor: Colors.surf3, borderRadius: 3 },
  progressFill:  { height: '100%', borderRadius: 3 },
  pbGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pbCell:      { width: '48%', backgroundColor: Colors.surf3, borderRadius: 10, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' },
  pbIcon:      { fontSize: 20 },
  pbValue:     { fontSize: 16, fontWeight: '700', lineHeight: 18 },
  pbLabel:     { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  pbDate:      { fontSize: 9, color: Colors.textMuted },
  aiHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  aiTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiBadge:     { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.purpleDk, alignItems: 'center', justifyContent: 'center' },
  aiTitle:     { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, color: Colors.purple },
  aiLink:      { marginTop: 10, backgroundColor: Colors.surf3, borderWidth: 1, borderColor: Colors.purple + '30', borderRadius: 8, padding: 10, alignItems: 'center' },
  aiLinkText:  { fontSize: 12, color: Colors.purple, fontWeight: '600' },
  milestoneRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  milestoneIcon:    { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surf3, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  milestoneIconDone:{ backgroundColor: Colors.greenDk + '60', borderColor: Colors.green + '50' },
  milestoneTop:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  milestoneLabel:   { fontSize: 13, fontWeight: '500', color: Colors.text },
  milestonePct:     { fontSize: 11, fontWeight: '700' },
  quickBookSection: { gap: 10 },
  quickBookRow:     { gap: 8, paddingBottom: 4 },
  quickChip:        { backgroundColor: Colors.surf2, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  quickChipText:    { fontSize: 12, color: Colors.text, whiteSpace: 'nowrap' } as any,
  // Diagnostics entry card
  diagCard:         { borderColor: Colors.blue + '30' },
  diagRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  diagLeft:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  diagIcon:         { fontSize: 22 },
  diagTitle:        { fontSize: 14, fontWeight: '700', color: Colors.text },
  diagSub:          { fontSize: 11, color: Colors.textSub, marginTop: 2 },
  diagArrowWrap:    { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.surf3, alignItems: 'center', justifyContent: 'center' },
  diagArrow:        { fontSize: 18, color: Colors.gold, lineHeight: 20 },
  diagChips:        { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  diagChip:         { backgroundColor: Colors.blueDk + '40', borderWidth: 1, borderColor: Colors.blue + '30', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  diagChipText:     { fontSize: 10, color: Colors.blue, fontWeight: '600' },
});
