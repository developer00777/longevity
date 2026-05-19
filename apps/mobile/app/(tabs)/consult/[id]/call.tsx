import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { createSession } from '../../../../src/modules/video-session';
import type { SessionHandle } from '../../../../src/modules/video-session';
import { Colors, FontSize } from '../../../../src/lib/theme';

export default function VideoCallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionRef = useRef<SessionHandle | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'remote_joined' | 'error'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const result = await createSession(id!);

      if ('code' in result) {
        if (!mounted) return;
        setStatus('error');
        setErrorMsg(
          result.code === 'PROVIDER_UNAVAILABLE'
            ? 'Consultation not found or video is unavailable. Please go back and try again.'
            : 'Connection failed. Please check your internet and try again.'
        );
        return;
      }

      sessionRef.current = result;

      result.onRemoteJoin(() => {
        if (mounted) setStatus('remote_joined');
      });

      result.onRemoteLeave(() => {
        if (mounted) {
          Alert.alert('Physician left', 'The physician has ended the session.', [
            { text: 'OK', onPress: () => handleLeave() },
          ]);
        }
      });

      await result.join();
      if (mounted) {
        setStatus('connected');
        timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
      }
    }

    init();

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      sessionRef.current?.leave();
    };
  }, [id]);

  async function handleLeave() {
    if (timerRef.current) clearInterval(timerRef.current);
    await sessionRef.current?.leave();
    router.replace('/(tabs)/appointments');
  }

  function toggleMute() {
    sessionRef.current?.toggleMute();
    setIsMuted(m => !m);
  }

  function toggleCamera() {
    sessionRef.current?.toggleCamera();
    setIsCameraOff(c => !c);
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>📡</Text>
          <Text style={styles.errorTitle}>Connection Failed</Text>
          <Text style={styles.errorMsg}>{errorMsg}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backBtnText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.callContainer}>
      {/* Remote video area */}
      <View style={styles.remoteVideo}>
        {status === 'connecting' && (
          <View style={styles.connectingOverlay}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.connectingText}>Connecting to your physician...</Text>
          </View>
        )}
        {status === 'connected' && (
          <View style={styles.waitingOverlay}>
            <Text style={styles.waitingIcon}>👨‍⚕️</Text>
            <Text style={styles.waitingText}>Waiting for physician to join...</Text>
          </View>
        )}
        {status === 'remote_joined' && (
          <View style={styles.activeOverlay}>
            <Text style={styles.activeIcon}>🟢</Text>
            <Text style={styles.activeText}>Session Active</Text>
            {/* In production: AgoraRTC remote video stream renders here */}
          </View>
        )}
      </View>

      {/* Local video preview (pip) */}
      <View style={styles.localVideo}>
        {isCameraOff
          ? <Text style={{ fontSize: 24 }}>📷</Text>
          : <Text style={{ color: '#888', fontSize: 12 }}>You</Text>
        }
      </View>

      {/* Timer */}
      <View style={styles.timerBadge}>
        <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
      </View>

      {/* Controls */}
      <SafeAreaView style={styles.controls}>
        <View style={styles.controlRow}>
          <ControlBtn
            icon={isMuted ? '🔇' : '🎙️'}
            label={isMuted ? 'Unmute' : 'Mute'}
            onPress={toggleMute}
            active={isMuted}
          />
          <ControlBtn
            icon="📵"
            label="End"
            onPress={() =>
              Alert.alert('End Call', 'End this consultation?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'End Call', style: 'destructive', onPress: handleLeave },
              ])
            }
            danger
          />
          <ControlBtn
            icon={isCameraOff ? '📷' : '📸'}
            label={isCameraOff ? 'Camera On' : 'Camera Off'}
            onPress={toggleCamera}
            active={isCameraOff}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function ControlBtn({
  icon, label, onPress, danger, active,
}: {
  icon: string; label: string; onPress: () => void; danger?: boolean; active?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.controlBtn, danger && styles.controlBtnDanger, active && styles.controlBtnActive]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.controlIcon}>{icon}</Text>
      <Text style={styles.controlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  callContainer: { flex: 1, backgroundColor: '#000' },
  remoteVideo: {
    flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
  },
  connectingOverlay: { alignItems: 'center', gap: 16 },
  connectingText: { color: Colors.textSecondary, fontSize: FontSize.md },
  waitingOverlay: { alignItems: 'center', gap: 12 },
  waitingIcon: { fontSize: 64 },
  waitingText: { color: Colors.textSecondary, fontSize: FontSize.md },
  activeOverlay: { alignItems: 'center', gap: 8 },
  activeIcon: { fontSize: 16 },
  activeText: { color: Colors.success, fontSize: FontSize.sm, fontWeight: '700' },
  localVideo: {
    position: 'absolute', top: 60, right: 16,
    width: 80, height: 112, backgroundColor: '#222',
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.border,
  },
  timerBadge: {
    position: 'absolute', top: 60, left: 16,
    backgroundColor: '#000a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
  },
  timerText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700', fontVariant: ['tabular-nums'] },
  controls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#000c',
  },
  controlRow: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    padding: 24,
  },
  controlBtn: {
    alignItems: 'center', gap: 6,
    backgroundColor: '#2A2A2A', borderRadius: 99,
    width: 72, height: 72, justifyContent: 'center',
  },
  controlBtnDanger: { backgroundColor: '#FF4444' },
  controlBtnActive: { backgroundColor: '#FF444455' },
  controlIcon: { fontSize: 26 },
  controlLabel: { color: '#fff', fontSize: 10, fontWeight: '600' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  errorIcon: { fontSize: 64 },
  errorTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
  errorMsg: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', lineHeight: 24 },
  backBtn: { marginTop: 8 },
  backBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
});
