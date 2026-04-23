import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context';

const BASE = 'https://clinic-backend-s2lx.onrender.com';
const WS_BASE = 'wss://clinic-backend-s2lx.onrender.com';
const PRIMARY = '#041430';

type Msg = { id: string; text: string; me: boolean; timestamp?: string };

export default function Chat({
  onClose, name, patientId, doctorId,
}: {
  onClose: () => void;
  name?: string;
  patientId: string | number;
  doctorId: string | number;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const listRef = useRef<FlatList<Msg>>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingSent = useRef<Set<string>>(new Set());

  // Load chat history
  useEffect(() => {
    fetch(`${BASE}/api/chat/history?patient_id=${patientId}&doctor_id=${doctorId}`, {
      headers: { accept: 'application/json' },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(data.map((d: any) => ({
            id: String(d.id),
            text: d.content || '',
            // real response: { sender: 5, receiver: 39, content, timestamp }
            me: Number(d.sender) === Number(patientId),
            timestamp: d.timestamp || '',
          })));
          setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [patientId, doctorId]);

  // WebSocket — connect to patient's channel on the clinic backend
  useEffect(() => {
    if (!patientId || !doctorId) return;

    const connect = (channelId: string | number) => {
      try {
        const ws = new WebSocket(`${WS_BASE}/ws/chat/${channelId}`);
        ws.onopen = () => setWsStatus('connected');
        ws.onclose = () => setWsStatus('disconnected');
        ws.onerror = () => setWsStatus('disconnected');
        ws.onmessage = (ev) => {
          const raw = typeof ev.data === 'string' ? ev.data : '';
          try {
            const data = JSON.parse(raw);
            const content = data.content || '';
            if (!content) return;
            // real response shape: { id, sender, receiver, content, timestamp }
            const isMe = Number(data.sender) === Number(patientId);
            if (isMe && pendingSent.current.has(content)) {
              pendingSent.current.delete(content);
              return;
            }
            const msg: Msg = {
              id: String(data.id || Date.now()),
              text: content,
              me: isMe,
              timestamp: data.timestamp || '',
            };
            setMessages(prev => {
              const exists = prev.some(m => m.id === msg.id);
              return exists ? prev : [...prev, msg];
            });
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
          } catch (_) {}
        };
        return ws;
      } catch (_) {
        return null;
      }
    };

    const patientWs = connect(patientId);
    const doctorWs = connect(doctorId);
    wsRef.current = patientWs;

    return () => {
      try { patientWs?.close(); } catch (_) {}
      try { doctorWs?.close(); } catch (_) {}
      wsRef.current = null;
    };
  }, [patientId, doctorId]);

  const send = () => {
    const content = text.trim();
    if (!content) return;
    setText('');
    pendingSent.current.add(content);
    // Optimistic local add
    const tempMsg: Msg = { id: String(Date.now()), text: content, me: true };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    // Always send via REST — POST /api/chat/send
    // sender_id = patient (me), receiver_id = doctor
    fetch(`${BASE}/api/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender_id: Number(patientId),
        receiver_id: Number(doctorId),
        content,
      }),
    })
      .then(r => r.json())
      .then(data => {
        // Response: { id, sender, receiver, content, timestamp }
        if (data?.id) {
          setMessages(prev => prev.map(m =>
            m.id === tempMsg.id
              ? { ...m, id: String(data.id), timestamp: data.timestamp }
              : m
          ));
        }
      })
      .catch(() => {});

    // Also send over WebSocket if open (for real-time delivery to doctor)
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        sender_id: Number(patientId),
        receiver_id: Number(doctorId),
        content,
      }));
    }
  };

  const fmtTime = (ts?: string) => {
    if (!ts) return '';
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch (_) { return ''; }
  };

  return (
    <RNSSafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.doctorAvatar}>
            <Text style={styles.doctorInitial}>{name?.charAt(0) || 'D'}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{name || 'Doctor'}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, wsStatus === 'connected' ? styles.dotGreen : styles.dotGray]} />
              <Text style={styles.statusText}>
                {wsStatus === 'connected' ? 'Online' : wsStatus === 'connecting' ? 'Connecting...' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={PRIMARY} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.row, item.me ? styles.rowMe : styles.rowThem]}>
              {!item.me && (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{name?.charAt(0) || 'D'}</Text>
                </View>
              )}
              <View style={[styles.bubble, item.me ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, item.me ? styles.textMe : styles.textThem]}>{item.text}</Text>
                {item.timestamp ? (
                  <Text style={[styles.timeText, item.me ? styles.timeMe : styles.timeThem]}>{fmtTime(item.timestamp)}</Text>
                ) : null}
              </View>
              {item.me && (
                <View style={[styles.avatar, styles.avatarMe]}>
                  <Text style={styles.avatarText}>Y</Text>
                </View>
              )}
            </View>
          )}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            multiline
            maxLength={500}
            onSubmitEditing={send}
          />
          <TouchableOpacity
            style={[styles.sendBtn, text.trim() ? styles.sendActive : styles.sendInactive]}
            onPress={send}
            disabled={!text.trim()}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </RNSSafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doctorAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
  },
  doctorInitial: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  headerName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  dotGreen: { backgroundColor: '#22C55E' },
  dotGray: { backgroundColor: '#94A3B8' },
  statusText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  closeBtn: { padding: 8, borderRadius: 8, backgroundColor: '#F1F5F9' },
  closeText: { fontSize: 18, color: '#64748B', fontWeight: '600' },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#64748B', fontSize: 14 },

  list: { padding: 16, paddingBottom: 8 },
  emptyBox: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: '#94A3B8', fontWeight: '500' },

  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, gap: 8 },
  rowMe: { justifyContent: 'flex-end' },
  rowThem: { justifyContent: 'flex-start' },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
  },
  avatarMe: { backgroundColor: '#64748B' },
  avatarText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  bubble: {
    maxWidth: '72%', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  bubbleMe: { backgroundColor: PRIMARY, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  textMe: { color: '#FFFFFF' },
  textThem: { color: '#1E293B' },
  timeText: { fontSize: 10, marginTop: 4 },
  timeMe: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  timeThem: { color: '#94A3B8' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    backgroundColor: '#F8FAFF', maxHeight: 100, color: '#1E293B',
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  sendActive: { backgroundColor: PRIMARY },
  sendInactive: { backgroundColor: '#E2E8F0' },
  sendIcon: { fontSize: 16, color: '#FFFFFF' },
});
