import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../src/stores/auth.store';
import { supabase } from '../../../src/lib/supabase';
import { SurfaceCard } from '../../../src/components/ui/SurfaceCard';
import { Tag } from '../../../src/components/ui/Tag';
import { AIBubble } from '../../../src/components/ui/AIBubble';
import { GoldButton } from '../../../src/components/ui/GoldButton';
import { Colors } from '../../../src/lib/theme';

const PERFORMANCE_SCORES = [
  { label: 'Cardiovascular Health', val: 87, color: Colors.blue   },
  { label: 'Metabolic Fitness',     val: 91, color: Colors.green  },
  { label: 'Sleep Architecture',    val: 82, color: Colors.purple },
  { label: 'Recovery Capacity',     val: 84, color: Colors.teal   },
  { label: 'Cognitive Performance', val: 79, color: Colors.orange },
  { label: 'Longevity Index',       val: 88, color: Colors.gold   },
];

const BENEFITS = [
  ['10% off all sessions',                Colors.green ],
  ['Priority booking (48hr advance)',     Colors.blue  ],
  ['Free monthly bio panel',              Colors.gold  ],
  ['Dedicated health concierge',          Colors.purple],
  ['AI weekly health reviews',            Colors.teal  ],
  ['Guest passes — 2/month',              Colors.green ],
  ['DEXA quarterly scan',                 Colors.orange],
  ['NRI priority program access',         Colors.gold  ],
];

const SETTINGS = [
  'Health Goals & ICP', 'Wearable Devices', 'Notification Preferences',
  'Health Questionnaire', 'Medical History', 'Privacy & Data',
  'Support & Concierge', 'Refer a Friend',
];

const AI_NARRATIVE = "Subhakar's biological age of 31.4 years represents a 4.2-year reversal — placing him in the top 2% of longevity outcomes for 52-year-old male executives globally. His ApoB at 72 mg/dL and hs-CRP at 0.4 mg/L are standout cardiovascular markers; combined with testosterone at 720 ng/dL and HRV trending at 68ms (+12% WoW), his endocrine-cardiovascular axis is optimally calibrated. Next precision action: schedule the NAD⁺ infusion before May 22 blood panel to capture the acute cellular energy effect in the biomarker delta.";

export default function ProfileScreen() {
  const { profile, session, signOut } = useAuthStore();
  const firstName = profile?.name?.split(' ')[0] ?? 'Member';
  const initial = firstName[0]?.toUpperCase() ?? 'M';

  async function handleDeleteAccount() {
    Alert.alert('Delete Account', 'This will permanently delete your account and all health data within 72 hours.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          if (!session?.user.id) return;
          await supabase.from('users').update({ deleted_at: new Date().toISOString() }).eq('uuid', session.user.id);
          await supabase.functions.invoke('delete-user-data', { body: { userId: session.user.id } });
          await signOut();
        }
      }
    ]);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Elite Member Card */}
        <View style={s.eliteCard}>
          <View style={s.eliteGlow1} />
          <View style={s.eliteGlow2} />
          <View style={s.eliteTop}>
            <View style={s.eliteAvatar}><Text style={s.eliteInitial}>{initial}</Text></View>
            <View>
              <Text style={s.eliteName}>{profile?.name ?? 'Champions Member'}</Text>
              <Text style={s.eliteRole}>{session?.user.email ?? session?.user.phone ?? ''}</Text>
            </View>
          </View>
          <View style={s.eliteStats}>
            {[['Bio Age','31.4',Colors.gold],['Sessions','11',Colors.green],['Program','Wk 6/12',Colors.blue],['Score','87/100',Colors.teal]].map(([k,v,col]) => (
              <View key={k} style={s.eliteStat}>
                <Text style={[s.eliteStatVal, { color: col as string }]}>{v}</Text>
                <Text style={s.eliteStatKey}>{k}</Text>
              </View>
            ))}
          </View>
          <View style={s.eliteFooter}>
            <Text style={s.eliteSince}>Elite Member since Jan 2026</Text>
            <Tag color={Colors.goldDk} textColor={Colors.gold}>ELITE TIER</Tag>
          </View>
        </View>

        {/* Profile info */}
        <SurfaceCard style={s.card}>
          <View style={s.infoRow}><Text style={s.infoKey}>Age</Text><Text style={s.infoVal}>{profile?.age ? `${profile.age} years` : '—'}</Text></View>
          <View style={s.infoRow}><Text style={s.infoKey}>Height</Text><Text style={s.infoVal}>{profile?.height_cm ? `${profile.height_cm} cm` : '—'}</Text></View>
          <View style={s.infoRow}><Text style={s.infoKey}>Weight</Text><Text style={s.infoVal}>{profile?.weight_kg ? `${profile.weight_kg} kg` : '—'}</Text></View>
          <View style={s.infoRow}><Text style={s.infoKey}>Gender</Text><Text style={[s.infoVal, { textTransform: 'capitalize' }]}>{profile?.gender ?? '—'}</Text></View>
        </SurfaceCard>

        {/* AI Narrative — scaffold */}
        <SurfaceCard style={s.card}>
          <Text style={s.sectionTitle}>🤖 AI Health Narrative</Text>
          <AIBubble text={AI_NARRATIVE} type="ai" />
        </SurfaceCard>

        {/* Performance Scores */}
        <SurfaceCard style={s.card}>
          <Text style={s.cardTitle}>Performance System Scores</Text>
          {PERFORMANCE_SCORES.map(sc => (
            <View key={sc.label} style={{ marginBottom: 12 }}>
              <View style={s.scoreRow}>
                <Text style={s.scoreLabel}>{sc.label}</Text>
                <Text style={[s.scoreVal, { color: sc.color }]}>{sc.val}</Text>
              </View>
              <View style={s.track}>
                <View style={[s.fill, { width: `${sc.val}%` as any, backgroundColor: sc.color }]} />
              </View>
            </View>
          ))}
        </SurfaceCard>

        {/* Membership Benefits */}
        <SurfaceCard style={s.card}>
          <Text style={s.cardTitle}>Elite Membership Benefits</Text>
          {BENEFITS.map(([b, col]) => (
            <View key={b} style={s.benefitRow}>
              <View style={[s.checkBox, { backgroundColor: (col as string) + '30', borderColor: (col as string) + '50' }]}>
                <Text style={[s.checkMark, { color: col as string }]}>✓</Text>
              </View>
              <Text style={s.benefitText}>{b}</Text>
            </View>
          ))}
        </SurfaceCard>

        {/* Settings */}
        <SurfaceCard style={s.card}>
          <Text style={s.cardTitle}>Settings</Text>
          {SETTINGS.map(item => (
            <TouchableOpacity key={item} style={s.settingRow}>
              <Text style={s.settingText}>{item}</Text>
              <Text style={{ color: Colors.textMuted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))}
        </SurfaceCard>

        <GoldButton label="Sign Out" variant="outline" onPress={signOut} />
        <TouchableOpacity onPress={handleDeleteAccount} style={s.deleteBtn}>
          <Text style={s.deleteText}>Delete Account</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 14, paddingBottom: 32, gap: 12 },
  card:   {},
  eliteCard: { background: undefined, backgroundColor: '#1A1408', borderWidth: 1, borderColor: Colors.goldDk + '50', borderRadius: 16, padding: 20, overflow: 'hidden', position: 'relative' },
  eliteGlow1: { position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: Colors.gold + '06' },
  eliteGlow2: { position: 'absolute', bottom: -40, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.gold + '04' },
  eliteTop:    { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 16 },
  eliteAvatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  eliteInitial:{ fontSize: 26, fontWeight: '700', color: Colors.bg },
  eliteName:   { fontSize: 18, fontWeight: '700', color: Colors.gold },
  eliteRole:   { fontSize: 11, color: Colors.textSub, marginTop: 2 },
  eliteStats:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  eliteStat:   { alignItems: 'center', backgroundColor: Colors.bg + '60', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  eliteStatVal:{ fontSize: 17, fontWeight: '700', lineHeight: 19 },
  eliteStatKey:{ fontSize: 9, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3 },
  eliteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.goldDk + '30', paddingTop: 12 },
  eliteSince:  { fontSize: 11, color: Colors.textMuted },
  infoRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoKey:     { fontSize: 13, color: Colors.textSub },
  infoVal:     { fontSize: 13, fontWeight: '600', color: Colors.text },
  sectionTitle:{ fontSize: 13, fontWeight: '700', color: Colors.purple, marginBottom: 10 },
  cardTitle:   { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  scoreRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  scoreLabel:  { fontSize: 12, color: Colors.text },
  scoreVal:    { fontSize: 14, fontWeight: '700' },
  track:       { height: 5, backgroundColor: Colors.surf3, borderRadius: 3 },
  fill:        { height: '100%', borderRadius: 3 },
  benefitRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  checkBox:    { width: 18, height: 18, borderRadius: 5, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkMark:   { fontSize: 10, fontWeight: '700' },
  benefitText: { fontSize: 12, color: Colors.text },
  settingRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  settingText: { fontSize: 13, color: Colors.text },
  deleteBtn:   { alignItems: 'center', paddingVertical: 8 },
  deleteText:  { color: Colors.red, fontSize: 13, fontWeight: '600' },
});
