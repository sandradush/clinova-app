import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context';

export default function VideoCall({ name, onEnd, patientId, doctorId }: { name?: string; onEnd: () => void; patientId?: string | number; doctorId?: string | number }) {
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [signalLog, setSignalLog] = useState<string[]>([]);
  const [localStream, setLocalStream] = useState<any | null>(null);
  const [remoteStream, setRemoteStream] = useState<any | null>(null);
  const pcRef = useRef<any>(null);
  const [webrtcAvailable, setWebrtcAvailable] = useState<boolean>(true);
  const rnwebrtcRef = useRef<any>(null);

  useEffect(() => {
    timer.current = setInterval(() => setSeconds(s => s + 1), 1000) as any;
    return () => { if (timer.current) clearInterval(timer.current as any); };
  }, []);

  const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  useEffect(() => {
    if (!patientId) return;
    try {
      const url = `wss://call-app-backend-g992.onrender.com/ws/${patientId}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setSignalLog(l => [...l, `WS open ${url}`]);

      ws.onmessage = ev => {
        const raw = typeof ev.data === 'string' ? ev.data : '';
        try {
          const data = JSON.parse(raw);
          if (data && (data.type === 'offer' || data.type === 'answer' || data.sdp)) {
            setSignalLog(l => [...l, `<- ${JSON.stringify(data)}`]);
            // handle incoming SDP offer/answer for WebRTC
            const pc = pcRef.current;
            if (pc && data.type === 'offer') {
              (async () => {
                try {
                  await pc.setRemoteDescription({ type: 'offer', sdp: data.sdp });
                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);
                  sendSignal('answer', answer.sdp || '');
                } catch (e) {
                  setSignalLog(l => [...l, `pc answer error`]);
                }
              })();
            } else if (pc && data.type === 'answer') {
              (async () => {
                try {
                  await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
                } catch (e) {
                  setSignalLog(l => [...l, `pc setRemote answer error`]);
                }
              })();
            }
            return;
          }
        } catch (e) {
          // not pure JSON
        }

        const jsonMatch = raw.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          try {
            const data = JSON.parse(jsonMatch[1]);
            setSignalLog(l => [...l, `<- ${JSON.stringify(data)}`]);
            return;
          } catch (e) {
            // ignore
          }
        }

        if (raw) setSignalLog(l => [...l, `<- ${raw}`]);
      };

      ws.onerror = () => setSignalLog(l => [...l, `WS error`] );
      ws.onclose = () => setSignalLog(l => [...l, `WS closed`] );

      return () => { try { ws.close(); } catch(e){}; wsRef.current = null; };
    } catch (e) {
      setSignalLog(l => [...l, `WS init error`]);
    }
  }, [patientId]);

  useEffect(() => {
    // try to load react-native-webrtc at runtime to avoid bundler errors when not installed
    try {
      // avoid static require so Metro doesn't attempt to resolve at bundle-time
      const rnwebrtc = eval("require")('react-native-webrtc');
      rnwebrtcRef.current = rnwebrtc;
      setWebrtcAvailable(true);
    } catch (e) {
      rnwebrtcRef.current = null;
      setWebrtcAvailable(false);
      setSignalLog(l => [...l, 'react-native-webrtc not installed — camera disabled']);
      return;
    }

    // get camera/mic and setup peer connection if available
    let mounted = true;
    (async () => {
      try {
        const mediaDevices = rnwebrtcRef.current.mediaDevices;
        const RTCPeerConnectionClass = rnwebrtcRef.current.RTCPeerConnection || rnwebrtcRef.current.RTCIceCandidate && rnwebrtcRef.current.RTCPeerConnection;
        if (!mediaDevices || !RTCPeerConnectionClass) {
          setSignalLog(l => [...l, 'react-native-webrtc present but API missing']);
          setWebrtcAvailable(false);
          return;
        }

        const stream = await mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) return;
        setLocalStream(stream);

        const pc = new RTCPeerConnectionClass();
        pcRef.current = pc;

        try { stream.getTracks().forEach((t: any) => pc.addTrack(t, stream)); } catch (e) {}

        pc.ontrack = (event: any) => {
          if (event.streams && event.streams[0]) setRemoteStream(event.streams[0]);
        };

        pc.onaddstream = (e: any) => setRemoteStream(e.stream);

        pc.onicecandidate = (e: any) => {
          if (e.candidate) setSignalLog(l => [...l, `ice ${JSON.stringify(e.candidate)}`]);
        };
      } catch (e) {
        setSignalLog(l => [...l, `getUserMedia error`]);
      }
    })();

    return () => {
      mounted = false;
      try { localStream?.getTracks().forEach((t:any) => t.stop()); } catch (e) {}
      if (pcRef.current) try { pcRef.current.close(); } catch(e) {}
    };
  }, []);

  useEffect(() => {
    // nothing here — WebRTC setup handled in the runtime loader useEffect above
  }, []);

  const sendSignal = (type: 'offer' | 'answer', sdp: string) => {
    const payload = { to: String(doctorId ?? ''), type, sdp };
    try {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
        setSignalLog(l => [...l, `-> ${JSON.stringify(payload)}`]);
      } else {
        setSignalLog(l => [...l, `-> (ws closed) ${JSON.stringify(payload)}`]);
      }
    } catch (e) {
      setSignalLog(l => [...l, `send error`]);
    }
  };

  const WebRTCView: any = rnwebrtcRef.current?.RTCView;

  return (
    <RNSSafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Video Consultation</Text>
          <Text style={styles.subtitle}>Dr. {name || 'Smith'}</Text>
        </View>
        <View style={styles.timerContainer}>
          <View style={styles.recordingIndicator} />
          <Text style={styles.timer}>{fmt(seconds)}</Text>
        </View>
      </View>

      <View style={styles.videoArea}>
        <View style={styles.remote}>
            <View style={styles.remoteVideoPlaceholder}>
              {remoteStream ? (
                WebRTCView ? (
                  <WebRTCView
                    streamURL={remoteStream.toURL ? remoteStream.toURL() : remoteStream}
                    style={{ width: 300, height: 220, borderRadius: 12 }}
                    objectFit="cover"
                  />
                ) : (
                  <Text style={{ color: '#D1D5DB' }}>Remote video unavailable (react-native-webrtc not installed)</Text>
                )
              ) : (
                <>
                  <View style={styles.doctorAvatar}>
                    <Text style={styles.doctorInitial}>{name?.charAt(0) || 'D'}</Text>
                  </View>
                  <Text style={styles.doctorName}>Dr. {name || 'Smith'}</Text>
                  <Text style={styles.specialization}>General Physician</Text>
                  <Text style={styles.connectionStatus}>✅ Connected</Text>
                </>
              )}
            </View>
          </View>
        
        <View style={styles.local}>
          <View style={styles.localVideoPlaceholder}>
              {localStream ? (
                WebRTCView ? (
                  <WebRTCView
                    streamURL={localStream.toURL ? localStream.toURL() : localStream}
                    style={{ width: '100%', height: '100%' }}
                    objectFit="cover"
                  />
                ) : (
                  <Text style={{ color: '#D1D5DB' }}>Local preview unavailable (react-native-webrtc not installed)</Text>
                )
              ) : (
                <Text style={styles.localText}>You</Text>
              )}
            </View>
          <TouchableOpacity style={styles.flipCamera}>
            <Text style={styles.flipIcon}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton}>
          <View style={[styles.controlIcon, { backgroundColor: '#64748B' }]}>
            <Text style={styles.iconText}>🎤</Text>
          </View>
          <Text style={styles.controlLabel}>Mute</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.endCallButton} onPress={onEnd}>
          <View style={styles.endCallIcon}>
            <Text style={styles.endCallIconText}>📞</Text>
          </View>
          <Text style={styles.endCallLabel}>End Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton}>
          <View style={[styles.controlIcon, { backgroundColor: '#059669' }]}>
            <Text style={styles.iconText}>📹</Text>
          </View>
          <Text style={styles.controlLabel}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlButton, { marginLeft: 12 }]} onPress={() => sendSignal('offer', '<test-offer-sdp>')}>
          <View style={[styles.controlIcon, { backgroundColor: '#2563EB' }]}>
            <Text style={styles.iconText}>▶</Text>
          </View>
          <Text style={styles.controlLabel}>Send Offer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlButton, { marginLeft: 8 }]} onPress={() => sendSignal('answer', '<test-answer-sdp>')}>
          <View style={[styles.controlIcon, { backgroundColor: '#10B981' }]}>
            <Text style={styles.iconText}>↺</Text>
          </View>
          <Text style={styles.controlLabel}>Send Answer</Text>
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
          <Text style={styles.actionIcon}>📄</Text>
          <Text style={styles.actionText}>Reports</Text>
        </TouchableOpacity>
      </View>
      <View style={{ padding: 12, backgroundColor: '#0B1220' }}>
        <Text style={{ color: '#9CA3AF', marginBottom: 8, fontSize: 12 }}>Signal log</Text>
        {signalLog.slice(-6).map((l, i) => (
          <Text key={i} style={{ color: '#D1D5DB', fontSize: 12 }}>{l}</Text>
        ))}
      </View>
    </RNSSafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#0F172A' 
  },
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20, 
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerContent: {
    flex: 1,
  },
  title: { 
    color: '#FFFFFF', 
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 2,
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '500',
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
  videoArea: { 
    flex: 1, 
    position: 'relative',
  },
  remote: { 
    flex: 1,
    backgroundColor: '#1E293B',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  remoteVideoPlaceholder: {
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  doctorInitial: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doctorName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  specialization: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 8,
  },
  connectionStatus: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  local: { 
    position: 'absolute', 
    top: 20,
    right: 20, 
    width: 120, 
    height: 160, 
    backgroundColor: '#374151', 
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  localVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  localText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  flipCamera: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipIcon: {
    fontSize: 12,
  },
  controls: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40, 
    paddingVertical: 20,
    gap: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  controlButton: {
    alignItems: 'center',
  },
  controlIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  iconText: {
    fontSize: 20,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  endCallIconText: {
    fontSize: 24,
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
    gap: 32,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  actionText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '500',
  },
});
