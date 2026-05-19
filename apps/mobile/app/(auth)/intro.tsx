import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
  TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, FontSize, Radius } from '../../src/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    icon: '⚡',
    title: 'Welcome to Longevity',
    body: 'Your gateway to preventive longevity care at our Bangalore facility. Understand your body, optimize your health, and live longer.',
  },
  {
    icon: '🩺',
    title: 'Expert Consultations',
    body: 'Meet with our specialist physicians via in-app video calls. Get personalized health insights based on your data.',
  },
  {
    icon: '💆',
    title: 'Advanced Therapies',
    body: 'Red light therapy, cryotherapy, IV nutrition, hyperbaric oxygen, and more — all bookable in minutes.',
  },
  {
    icon: '📊',
    title: 'Track Your Progress',
    body: 'Connect Apple Health or Google Fit to see your steps, heart rate, sleep, and calories — all in one place.',
  },
  {
    icon: '🚀',
    title: "Let's Begin",
    body: 'Start your longevity journey today. Create your profile and book your first consultation.',
  },
];

const INTRO_SHOWN_KEY = '@longevity/intro_shown';

export async function markIntroShown() {
  await AsyncStorage.setItem(INTRO_SHOWN_KEY, 'true');
}

export async function hasSeenIntro() {
  const val = await AsyncStorage.getItem(INTRO_SHOWN_KEY);
  return val === 'true';
}

export default function IntroScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(idx);
  }

  function goNext() {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * SCREEN_WIDTH, animated: true });
    } else {
      handleFinish();
    }
  }

  async function handleFinish() {
    await markIntroShown();
    router.replace('/(auth)/signup');
  }

  return (
    <View style={styles.container}>
      {/* Skip */}
      <TouchableOpacity onPress={handleFinish} style={styles.skipBtn} accessibilityRole="button" accessibilityLabel="Skip introduction">
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={32}
        style={styles.scroll}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={styles.slide}>
            <Text style={styles.icon}>{slide.icon}</Text>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideBody}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
            accessibilityRole="none"
          />
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        onPress={goNext}
        style={styles.nextBtn}
        accessibilityRole="button"
        accessibilityLabel={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next slide'}
      >
        <Text style={styles.nextBtnText}>
          {activeIndex === SLIDES.length - 1 ? 'Get Started →' : 'Next →'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  skipBtn: { position: 'absolute', top: 56, right: Spacing.lg, zIndex: 10 },
  skipText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
  scroll: { flex: 1 },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    paddingTop: 80,
  },
  icon: { fontSize: 80 },
  slideTitle: { fontSize: FontSize.xxxl, fontWeight: '900', color: Colors.text, textAlign: 'center' },
  slideBody: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, paddingBottom: Spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { width: 24, backgroundColor: Colors.primary },
  nextBtn: {
    marginHorizontal: Spacing.lg,
    marginBottom: 48,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: { color: '#000', fontSize: FontSize.md, fontWeight: '800' },
});
