import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context';

export default function ResetPassword({ token, onDone, onCancel }:{ token?: string; onDone?: ()=>void; onCancel?: ()=>void }){
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password) { Alert.alert('Enter a new password'); return; }
    if (password !== confirm) { Alert.alert('Passwords do not match'); return; }
    setLoading(true);
    try {
      await fetch('https://clinic-backend-s2lx.onrender.com/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      Alert.alert('Your password has been reset. Please sign in.');
      if (onDone) onDone();
    } catch (e) {
      Alert.alert('Unable to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RNSSafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Set a new password</Text>
        <Text style={styles.label}>New password</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="New password" secureTextEntry style={styles.input} />
        <Text style={styles.label}>Confirm password</Text>
        <TextInput value={confirm} onChangeText={setConfirm} placeholder="Confirm password" secureTextEntry style={styles.input} />
        <TouchableOpacity onPress={handleSubmit} style={[styles.button, loading && styles.disabled]} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save password'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onCancel && onCancel()} style={styles.cancel}>
          <Text style={styles.cancelText}>Back</Text>
        </TouchableOpacity>
      </View>
    </RNSSafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },
  container: { padding: 16, paddingTop: 40 },
  title: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  label: { color: '#374151', marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  button: { marginTop: 16, backgroundColor: '#001e3c', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '700' },
  disabled: { opacity: 0.6 },
  cancel: { marginTop: 12, alignItems: 'center' },
  cancelText: { color: '#64748B' },
});
