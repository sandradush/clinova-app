import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context';

const WS_BASE = 'wss://clinic-backend-s2lx.onrender.com';
const BASE = 'https://clinic-backend-s2lx.onrender.com';

export default function VideoCall({
  name, onEnd, patientId, doctorId, appointmentId,
}: {
  name?: string;
  onEnd: () => void;
  patientId?: string | number;
  doctorId?: string | number;
  appointmentId?: string | number;
}) {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>('calling');
  const timerRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<any>(null);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Timer — starts when call is connected
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callStatus]);

  // Initiate call on backend + open WebSocket signaling channel
  useEffect(() => {
    if (!patientId) return;

    // Notify backend to initiate the call
    fetch(`${BASE}/api/calls/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ caller_id: patientId, receiver_id: doctorId, appointment_id: appointmentId }),
    })
      .then(r => r.json())
      .then(data => {
        // room_id can be used to join a specific room if backend supports it
        console.log('Call initiated:', data);
      })
      .catch(() => {});

    // Open WebSocket signaling channel
    try {
      const ws = new WebSocket(`${WS_BASE}/ws/call/${patientId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('connected');
        setCallStatus('connected');
        // Send call-start signal to doctor
        ws.send(JSON.stringify({
          type: 'call-start',
          to: String(doctorId),
          from: String(patientId),
          appointment_id: appointmentId,
        }));
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.type === 'call-accepted') setCallStatus('connected');
          if (data.type === 'call-ended') { setCallStatus('ended'); onEnd(); }
          // WebRTC signaling
          handleSignal(data);
        } catch (_) {}
      };

      ws.onerror = () => setWsStatus('disconnected');
      ws.onclose = () => setWsStatus('disconnected');
    } catch (_) {}

    return () => {
      try { wsRef.current?.close(); } catch (_) {}
      wsRef.current = null;
      try { pcRef.current?.close(); } catch (_) {}
    };
  }, [patientId, doctorId]);

  const handleSignal = (data: any) => {
    // WebRTC signaling — requires react-native-webrtc installed
    // If you install it: npx expo install react-native-webrtc
    // Then uncomment and use RTCPeerConnection here
  };

  const sendSignal = (payload: object) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  };

  const endCall = () => {
    sendSignal({ type: 'call-ended', to: String(doctorId), from: String(patientId) });
    try { wsRef.current?.close(); } catch (_) {}
    onEnd();
  };

  return (
    <RNSSafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Video Consultation</Text>
        <View style={styles.timerRow}>
          {callStatus === 'connected' && <View style={styles.recDot} />}
          <Text style={styles.timerText}>
            {callStatus === 'calling' ? 'Calling...' : fmt(seconds)}
          </Text>
        </View>
      </View>

      {/* Remote video area */}
      <View style={styles.remoteArea}>
        <View style={styles.doctorAvatarWrap}>
          <View style={styles.doctorAvatar}>
            <Text style={styles.doctorInitial}>{name?.charAt(0) || 'D'}</Text>
          </View>
          {callStatus === 'calling' && (
            <View style={styles.pulseRing} />
          )}
        </View>
        <Text style={styles.doctorName}>{name || 'Doctor'}</Text>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, wsStatus === 'connected' ? styles.dotGreen : styles.dotGray]} />
          <Text style={styles.statusPillText}>
            {callStatus === 'calling' ? 'Ringing...' : callStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
        <Text style={styles.videoNote}>
          📹 Video stream requires react-native-webrtc{'\n'}Ask your backend dev to confirm WebRTC support
        </Text>
      </View>

      {/* Local preview */}
      <View style={styles.localPreview}>
        <View style={styles.localInner}>
          <Text style={styles.localText}>{camOff ? '📷 Off' : 'You'}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.ctrlBtn} onPress={() => setMuted(m => !m)}>
          <View style={[styles.ctrlIcon, muted && styles.ctrlIconRed]}>
            <Text style={styles.ctrlEmoji}>{muted ? '🔇' : '🎤'}</Text>
          </View>
          <Text style={styles.ctrlLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.endBtn} onPress={endCall}>
          <View style={styles.endIcon}>
            <Text style={styles.endEmoji}>📞</Text>
          </View>
          <Text style={styles.endLabel}>End</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctrlBtn} onPress={() => setCamOff(c => !c)}>
          <View style={[styles.ctrlIcon, camOff && styles.ctrlIconRed]}>
            <Text style={styles.ctrlEmoji}>{camOff ? '📷' : '📹'}</Text>
          </View>
          <Text style={styles.ctrlLabel}>{camOff ? 'Cam Off' : 'Camera'}</Text>
        </TouchableOpacity>
      </View>

      {/* WS status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusBarText}>
          Signal: {wsStatus}  •  Patient: {patientId}  •  Doctor: {doctorId}
        </Text>
      </View>
    </RNSSafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'rgba(0,0,0,0.4)',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  timerText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  remoteArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1E293B', gap: 12,
  },
  doctorAvatarWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  doctorAvatar: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#FFFFFF',
  },
  doctorInitial: { fontSize: 48, fontWeight: '700', color: '#FFFFFF' },
  pulseRing: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    borderWidth: 2, borderColor: 'rgba(5,150,105,0.4)',
  },
  doctorName: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  dotGreen: { backgroundColor: '#22C55E' },
  dotGray: { backgroundColor: '#94A3B8' },
  statusPillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  videoNote: {
    color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center',
    marginTop: 16, lineHeight: 18, paddingHorizontal: 32,
  },

  localPreview: {
    position: 'absolute', top: 80, right: 16,
    width: 100, height: 140, borderRadius: 12,
    overflow: 'hidden', borderWidth: 2, borderColor: '#FFFFFF',
    backgroundColor: '#374151',
  },
  localInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  localText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

  controls: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 40, paddingVertical: 24, backgroundColor: 'rgba(0,0,0,0.5)',
  },
  ctrlBtn: { alignItems: 'center', gap: 6 },
  ctrlIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center',
  },
  ctrlIconRed: { backgroundColor: '#EF4444' },
  ctrlEmoji: { fontSize: 22 },
  ctrlLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  endBtn: { alignItems: 'center', gap: 6 },
  endIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
  },
  endEmoji: { fontSize: 26, transform: [{ rotate: '135deg' }] },
  endLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },

  statusBar: {
    paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#0B1220',
  },
  statusBarText: { color: '#475569', fontSize: 10, textAlign: 'center' },
});
