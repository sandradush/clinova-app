import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context';

export default function VoiceCall({ name, onEnd }: { name?: string; onEnd: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => setSeconds(s => s + 1), 1000) as any;
    return () => { if (timer.current) clearInterval(timer.current as any); };
  }, []);

  const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <RNSSafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Voice Call</Text>
          <View style={styles.timerContainer}>
            <View style={styles.recordingIndicator} />
            <Text style={styles.timer}>{fmt(seconds)}</Text>
          </View>
        </View>

        <View style={styles.callInfo}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{name?.charAt(0) || 'D'}</Text>
            </View>
            <View style={styles.pulseRing} />
            <View style={styles.pulseRing2} />
          </View>
          <Text style={styles.callerName}>Dr. {name || 'Smith'}</Text>
          <Text style={styles.status}>Connected</Text>
          <Text style={styles.subtitle}>Voice consultation in progress</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => setIsMuted(!isMuted)}
          >
            <View style={[styles.controlIcon, { backgroundColor: isMuted ? '#EF4444' : '#64748B' }]}>
              <Text style={styles.iconText}>{isMuted ? '🔇' : '🎤'}</Text>
            </View>
            <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.endCallButton} onPress={onEnd}>
            <View style={styles.endCallIcon}>
              <Text style={styles.endCallIconText}>📞</Text>
            </View>
            <Text style={styles.endCallLabel}>End Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setIsSpeakerOn(!isSpeakerOn)}
          >
            <View style={[styles.controlIcon, { backgroundColor: isSpeakerOn ? '#059669' : '#64748B' }]}>
              <Text style={styles.iconText}>{isSpeakerOn ? '🔊' : '🔈'}</Text>
            </View>
            <Text style={styles.controlLabel}>Speaker</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </RNSSafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#0F172A',
  },
  container: { 
    flex: 1, 
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { 
    color: '#FFFFFF',
    fontWeight: '700', 
    fontSize: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  timer: { 
    color: '#FFFFFF', 
    fontSize: 16,
    fontWeight: '600',
  },
  callInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  avatarInitial: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pulseRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    top: -20,
    left: -20,
  },
  pulseRing2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
    top: -40,
    left: -40,
  },
  callerName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 40,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  iconText: {
    fontSize: 24,
  },
  controlLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  endCallButton: {
    alignItems: 'center',
  },
  endCallIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  endCallIconText: {
    fontSize: 28,
    transform: [{ rotate: '135deg' }],
  },
  endCallLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  actionText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '500',
  },
});
