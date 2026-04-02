import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPassword({ onDone, onCancel }:{ onDone?: ()=>void; onCancel?: ()=>void }){
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) { Alert.alert('Please enter your email'); return; }
    setLoading(true);
    try {
      await fetch('https://clinic-backend-s2lx.onrender.com/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ email }),
      });
      Alert.alert('If an account with that email exists, a password reset link has been sent.');
      if (onDone) onDone();
    } catch (e) {
      Alert.alert('If an account with that email exists, a password reset link has been sent.');
      if (onDone) onDone();
    } finally {
      setLoading(false);
    }
  };

  return (
    <RNSSafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.sub}>Enter your account email and we'll send a reset link.</Text>
        <Text style={styles.label}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" style={styles.input} keyboardType="email-address" autoCapitalize="none" />
        <TouchableOpacity onPress={handleSubmit} style={[styles.button, loading && styles.disabled]} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send reset link'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onCancel && onCancel()} style={styles.cancel}>
          <Text style={styles.cancelText}>Back</Text>
        </TouchableOpacity>
      </View>
    </RNSSafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F9FF' },
  container: { padding: 16, paddingTop: 40 },
  title: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  sub: { color: '#64748B', marginBottom: 12 },
  label: { color: '#374151', marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  button: { marginTop: 16, backgroundColor: '#001e3c', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '700' },
  disabled: { opacity: 0.6 },
  cancel: { marginTop: 12, alignItems: 'center' },
  cancelText: { color: '#64748B' },
});
