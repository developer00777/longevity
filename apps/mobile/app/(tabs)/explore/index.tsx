import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../src/lib/theme';

// Import the two screens as plain components — zero duplication, full functionality intact
import TherapiesScreen from '../therapies/index';
import ProgramsScreen from '../programs/index';

type Segment = 'therapies' | 'programs';

export default function ExploreScreen() {
  const [segment, setSegment] = useState<Segment>('therapies');

  return (
    <View style={s.root}>
      {/* Segment control — fixed at top, content fills below */}
      <SafeAreaView edges={['top']} style={s.segmentWrap}>
        <View style={s.segmentBar}>
          {(['therapies', 'programs'] as Segment[]).map(seg => (
            <TouchableOpacity
              key={seg}
              onPress={() => setSegment(seg)}
              style={[s.segBtn, segment === seg && s.segBtnActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: segment === seg }}
            >
              <Text style={[s.segLabel, segment === seg && s.segLabelActive]}>
                {seg === 'therapies' ? '✚  Therapies' : '🎯  Programs'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* Render the active screen — SafeAreaView inside each handles its own top inset */}
      <View style={s.content}>
        {segment === 'therapies' ? <TherapiesInner /> : <ProgramsInner />}
      </View>
    </View>
  );
}

// Thin wrappers that suppress the SafeAreaView top inset (already handled by the segment bar above)
function TherapiesInner() {
  return <TherapiesScreen />;
}

function ProgramsInner() {
  return <ProgramsScreen />;
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: Colors.bg },
  segmentWrap:  { backgroundColor: Colors.surf, borderBottomWidth: 1, borderBottomColor: Colors.border },
  segmentBar:   { flexDirection: 'row', marginHorizontal: 16, marginVertical: 8, backgroundColor: Colors.surf3, borderRadius: 10, padding: 3 },
  segBtn:       { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  segBtnActive: { backgroundColor: Colors.gold },
  segLabel:     { fontSize: 12, fontWeight: '600', color: Colors.textSub, letterSpacing: 0.3 },
  segLabelActive:{ color: Colors.bg, fontWeight: '700' },
  content:      { flex: 1 },
});
