import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../src/lib/theme';
import { useAuthStore } from '../../../src/stores/auth.store';

const SUGGESTIONS = [
  "Why is my HRV improving?",
  "When should I do my next HBOT?",
  "Analyse my ApoB trend",
  "Best recovery protocol this week",
  "Am I on track for Bio Age 29?",
];

const SCAFFOLD_REPLIES: Record<string, string> = {
  "Why is my HRV improving?": "Your HRV improvement from 60ms to 68ms over 4 weeks correlates strongly with your sleep consistency — you've maintained 7.4h average with improved deep sleep architecture. The HBOT sessions (8 of 12 complete) are also driving parasympathetic tone recovery. Continue your 22:30 wind-down protocol.",
  "When should I do my next HBOT?": "Given your current 8-session streak and recovery score of 84%, I recommend your next HBOT within 48–72 hours to maintain momentum in the inflammatory cascade reset. Your hs-CRP at 0.4 mg/L is excellent — the next session should push it lower and improve your VO₂ proxy.",
  "Analyse my ApoB trend": "Your ApoB at 72 mg/dL is excellent — 18 points below the target threshold and trending down. This is your strongest cardiovascular marker. With Lp(a) at 8 nmol/L and hs-CRP at 0.4 mg/L, your cardiovascular risk profile is in the top 5% for your age cohort. No intervention needed — maintain current protocol.",
  "Best recovery protocol this week": "Priority sequence this week: HBOT on Day 1 (post-intensity), IR Sauna on Day 3 for cortisol reset, and Red Light on Days 2, 4, 6 for mitochondrial priming. Your HRV data suggests your nervous system is ready for the cryotherapy session — slot that in on Day 5 morning.",
  "Am I on track for Bio Age 29?": "At current trajectory — Bio Age 31.4 with a 4.2-year reversal over 6 months — you're on track to reach 29 in approximately 12–14 months. The key lever is NAD+ replenishment: your next infusion (May 19) combined with the 6-week hormone optimisation results will likely show a 1.5–2 year improvement in your next GlycanAge reading.",
};

const DEFAULT_REPLY = "Based on your current biomarker profile — HRV 68ms, Bio Age 31.4, VO₂ Max 52.3, ApoB 72 mg/dL — your longevity metrics are tracking in the top tier for your age cohort. Continue your current protocol and focus on sleep consistency as your primary lever for the next 30 days.";

type Message = { role: 'user' | 'assistant'; text: string };

export default function ChatScreen() {
  const { profile } = useAuthStore();
  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: `Hello ${firstName}. I'm CHAMP AI — your personalised longevity intelligence. I have full context of your biomarkers, sessions, and programs. Ask me anything about your health, treatments, or protocols.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const send = (text?: string) => {
    const q = text ?? input;
    if (!q.trim() || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    // Scaffold: return canned reply or default after short delay
    setTimeout(() => {
      const reply = SCAFFOLD_REPLIES[q] ?? DEFAULT_REPLY;
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      setLoading(false);
    }, 900);
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.avatarBadge}><Text style={{ fontSize: 18 }}>🤖</Text></View>
          <View>
            <Text style={s.aiName}>CHAMP AI</Text>
            <Text style={s.aiSub}>Longevity Intelligence Engine · Real-time</Text>
          </View>
          <View style={s.livePill}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Suggestions (shown only on first load) */}
        {messages.length <= 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.suggestScroll} contentContainerStyle={s.suggestRow}>
            {SUGGESTIONS.map(sg => (
              <TouchableOpacity key={sg} onPress={() => send(sg)} style={s.suggestChip}>
                <Text style={s.suggestText}>{sg}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Messages */}
        <ScrollView ref={scrollRef} style={s.msgArea} contentContainerStyle={s.msgContent} showsVerticalScrollIndicator={false}>
          {messages.map((m, i) => (
            <View key={i} style={[s.msgRow, m.role === 'user' && s.msgRowUser]}>
              <View style={[s.msgAvatar, m.role === 'user' ? s.userAvatar : s.aiAvatar]}>
                <Text style={{ fontSize: 13 }}>{m.role === 'user' ? firstName[0]?.toUpperCase() : '🤖'}</Text>
              </View>
              <View style={[s.bubble, m.role === 'user' ? s.bubbleUser : s.bubbleAI]}>
                <Text style={s.bubbleText}>{m.text}</Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={s.msgRow}>
              <View style={[s.msgAvatar, s.aiAvatar]}><Text style={{ fontSize: 13 }}>🤖</Text></View>
              <View style={[s.bubble, s.bubbleAI]}>
                <Text style={{ color: Colors.textSub, fontSize: 12 }}>Analysing your data…</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={s.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send()}
            placeholder="Ask about your health, treatments, protocols…"
            placeholderTextColor={Colors.textMuted}
            style={s.input}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={() => send()}
            disabled={loading || !input.trim()}
            style={[s.sendBtn, input.trim() && s.sendBtnActive]}
          >
            <Text style={{ fontSize: 16, color: input.trim() ? Colors.bg : Colors.textMuted }}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatarBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.purpleDk, alignItems: 'center', justifyContent: 'center' },
  aiName: { fontSize: 14, fontWeight: '700', color: Colors.purple },
  aiSub: { fontSize: 11, color: Colors.textSub },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 'auto' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.purple },
  liveText: { fontSize: 11, color: Colors.textSub },
  suggestScroll: { flexShrink: 0, maxHeight: 44 },
  suggestRow: { paddingHorizontal: 14, paddingVertical: 8, gap: 7 },
  suggestChip: { backgroundColor: Colors.surf2, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12 },
  suggestText: { fontSize: 11, color: Colors.textSub },
  msgArea: { flex: 1 },
  msgContent: { padding: 14, gap: 14, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  aiAvatar: { backgroundColor: Colors.purpleDk },
  userAvatar: { backgroundColor: Colors.goldDk },
  bubble: { maxWidth: '82%', borderRadius: 12, padding: 10 },
  bubbleAI: { backgroundColor: Colors.surf2, borderWidth: 1, borderColor: Colors.border },
  bubbleUser: { backgroundColor: Colors.goldGlow, borderWidth: 1, borderColor: Colors.goldDk + '40' },
  bubbleText: { fontSize: 13, lineHeight: 21, color: Colors.text },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surf2 },
  input: { flex: 1, backgroundColor: 'transparent', color: Colors.text, fontSize: 13, paddingVertical: 4 },
  sendBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: { backgroundColor: Colors.purple },
});
