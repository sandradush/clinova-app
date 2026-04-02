import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context';

type Msg = { id: string; text: string; me?: boolean };

export default function Chat({ onClose, name, patientId, doctorId }: { onClose: () => void; name?: string; patientId: string | number; doctorId: string | number }) {
  const [messages, setMessages] = useState<Msg[]>([
    { id: '1', text: `Hi, this is ${name || 'Dr.'}. How can I help?` },
  ]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<Msg>>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: false });
  }, []);

  const doctorWsRef = useRef<WebSocket | null>(null);

  const parseAndAppend = (ev: MessageEvent) => {
    const raw = typeof ev.data === 'string' ? ev.data : '';
    try {
      const data = JSON.parse(raw);
      if (data && data.content) {
        const isMe = String(data.sender) === String(patientId);
        // Skip echo of our own sent messages (already added locally)
        if (isMe && pendingSentRef.current.has(String(data.content))) {
          pendingSentRef.current.delete(String(data.content));
          return;
        }
        setMessages(prev => [...prev, { id: String(Date.now()), text: String(data.content), me: isMe }]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        return;
      }
    } catch (e) {}

    if (raw) {
      const m = raw.match(/^\s*(\d+)\s*:\s*([\s\S]+)$/);
      if (m) {
        const isMe = String(m[1]) === String(patientId);
        if (isMe && pendingSentRef.current.has(String(m[2]))) {
          pendingSentRef.current.delete(String(m[2]));
          return;
        }
        setMessages(prev => [...prev, { id: String(Date.now()), text: String(m[2]), me: isMe }]);
      } else {
        setMessages(prev => [...prev, { id: String(Date.now()), text: raw, me: false }]);
      }
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  useEffect(() => {
    if (!patientId) return;

    // Connect to patient's own channel to receive messages sent to patient
    const openWs = (channel: string | number, ref: React.MutableRefObject<WebSocket | null>) => {
      try {
        const ws = new WebSocket(`wss://chat.mababa.app/ws/${channel}`);
        ref.current = ws;
        ws.onmessage = parseAndAppend;
        ws.onerror = () => {};
        ws.onclose = () => {};
      } catch (e) {}
    };

    openWs(patientId, wsRef);
    // Also listen on doctor's channel so we receive messages the doctor sends
    if (doctorId) openWs(doctorId, doctorWsRef);

    return () => {
      try { wsRef.current?.close(); } catch (e) {}
      try { doctorWsRef.current?.close(); } catch (e) {}
      wsRef.current = null;
      doctorWsRef.current = null;
    };
  }, [patientId, doctorId]);

  const pendingSentRef = useRef<Set<string>>(new Set());

  const send = () => {
    if (!text.trim()) return;
    const content = text.trim();
    const tempId = String(Date.now());
    // Track this content so we can ignore the echo from our own WS channel
    pendingSentRef.current.add(content);
    setMessages(prev => [...prev, { id: tempId, text: content, me: true }]);
    const payload = { sender: String(patientId), receiver: String(doctorId), content };
    setText('');
    try {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    } catch (e) {}
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
  };

  return (
    <RNSSafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.doctorAvatar}>
            <Text style={styles.doctorInitial}>{name?.charAt(0) || 'D'}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Dr. {name || 'Smith'}</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Available</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.close}>×</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.msg, item.me ? styles.me : styles.them]}>
            {!item.me && (
              <View style={styles.messageAvatar}>
                <Text style={styles.avatarText}>{name?.charAt(0) || 'D'}</Text>
              </View>
            )}
            <View style={[styles.messageBubble, item.me ? styles.myBubble : styles.theirBubble]}>
              <Text style={[styles.msgText, item.me ? styles.myText : styles.theirText]}>{item.text}</Text>
              <Text style={styles.timestamp}>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
            </View>
            {item.me && (
              <View style={styles.messageAvatar}>
                <Text style={styles.avatarText}>Y</Text>
              </View>
            )}
          </View>
        )}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachBtn}>
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>
          <TextInput 
            value={text} 
            onChangeText={setText} 
            placeholder="Type a message..." 
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, text.trim() ? styles.sendBtnActive : styles.sendBtnInactive]} 
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
  safe: { 
    flex: 1, 
    backgroundColor: '#F0F9FF' 
  },
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#001e3c',
    backgroundColor: '#001e3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  title: { 
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#041430',
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#001e3c',
    fontWeight: '500',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  close: { 
    fontSize: 20,
    color: '#64748B',
    fontWeight: '600',
  },
  list: { 
    padding: 16,
    paddingBottom: 20,
  },
  msg: { 
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  me: { 
    justifyContent: 'flex-end',
  },
  them: { 
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#001e3c',
    backgroundColor: '#001e3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  myBubble: {
    backgroundColor: '#041430',
    borderBottomRightRadius: 6,
  },
  theirBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  msgText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  myText: {
    color: '#FFFFFF',
  },
  theirText: {
    color: '#1E293B',
  },
  timestamp: {
    fontSize: 10,
    opacity: 0.7,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-end',
    gap: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachIcon: {
    fontSize: 16,
  },
  input: { 
    flex: 1,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FAFBFC',
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#041430',
  },
  sendBtnInactive: {
    backgroundColor: '#E2E8F0',
  },
  sendIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
