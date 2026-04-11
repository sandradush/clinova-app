import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import Register from './Register';
import Dashboard from './Dashboard';
import Payment from './Payment';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import HomePage from './HomePage';

const PRIMARY = '#001e3c';

if (Platform.OS === 'web') {
  try { require('./web/tailwind.css'); } catch (e) {}
}

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAppointment, setPaymentAppointment] = useState<any | null>(null);
  const [showHome, setShowHome] = useState(true);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    try {
      const response = await fetch('https://clinic-backend-s2lx.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) { setUser(data.user); Alert.alert('Success', data.message); }
      else { Alert.alert('Error', data.message || 'Login failed'); }
    } catch { Alert.alert('Error', 'Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  if (showHome) {
    return (
      <HomePage navigation={{
        navigate: (screen: string) => {
          if (screen === 'Register') { setShowRegister(true); setShowHome(false); }
          if (screen === 'Login') setShowHome(false);
        },
      }} />
    );
  }

  if (showRegister) {
    return <Register onCancel={() => { setShowRegister(false); setShowHome(true); }} />;
  }

  if (showForgot) {
    return <ForgotPassword
      onDone={() => { setShowForgot(false); setShowReset(true); }}
      onCancel={() => setShowForgot(false)}
    />;
  }

  if (showReset) {
    return <ResetPassword onDone={() => setShowReset(false)} onCancel={() => setShowReset(false)} />;
  }

  if (user) {
    if (showPayment && paymentAppointment) {
      return (
        <RNSSafeAreaView style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => { setShowPayment(false); setPaymentAppointment(null); }} style={{ padding: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
            <Text style={{ color: PRIMARY, fontWeight: '700', fontSize: 15 }}>← Back</Text>
          </TouchableOpacity>
          <Payment route={{ params: { appointment: paymentAppointment } }} />
        </RNSSafeAreaView>
      );
    }
    return <Dashboard
      email={user.email} name={user.name} avatarUri={user.avatar} userId={user.id}
      onLogout={() => setUser(null)}
      onProfileSave={(patient: any) => setUser((prev: any) => ({ ...(prev || {}), patient: { ...((prev || {}).patient || {}), ...(patient || {}) } }))}
      userPatient={user.patient}
      onOpenPayment={(appt: any) => { setPaymentAppointment(appt || { id: 'APPT-EX', patientName: user.name || user.email, fee: 3000, scheduled: new Date().toISOString() }); setShowPayment(true); }}
    />;
  }

  return (
    <RNSSafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => setShowHome(true)} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoMark}>CU</Text>
            </View>
            <Text style={styles.heroTitle}>Welcome back</Text>
            <Text style={styles.heroSub}>Sign in to your Cura account</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              value={email} onChangeText={setEmail}
              placeholder="patient@email.com" placeholderTextColor="#9CA3AF"
              keyboardType="email-address" autoCapitalize="none"
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                value={password} onChangeText={setPassword}
                placeholder="Enter your password" placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
              />
              <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showPassword ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setShowForgot(true)} style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogin} style={[styles.btnPrimary, loading && { opacity: 0.6 }]} disabled={loading} activeOpacity={0.85}>
              <Text style={styles.btnPrimaryText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity onPress={() => { setShowRegister(true); }} style={styles.btnOutline} activeOpacity={0.85}>
              <Text style={styles.btnOutlineText}>Create an Account</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </RNSSafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  topBar: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  backBtn: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 4 },
  backText: { color: PRIMARY, fontSize: 15, fontWeight: '600' },
  heroSection: { alignItems: 'center', paddingVertical: 32 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  logoMark: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: PRIMARY, marginBottom: 6 },
  heroSub: { fontSize: 15, color: '#64748B', fontWeight: '500' },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#F8FAFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 16,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  eyeBtn: { position: 'absolute', right: 14, top: 13 },
  eyeText: { fontSize: 18 },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 20, marginTop: 4 },
  forgotText: { color: PRIMARY, fontSize: 13, fontWeight: '600' },
  btnPrimary: {
    backgroundColor: PRIMARY, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 12, color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  btnOutline: {
    borderWidth: 2, borderColor: PRIMARY,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  btnOutlineText: { color: PRIMARY, fontSize: 16, fontWeight: '700' },
});
