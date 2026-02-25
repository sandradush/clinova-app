import React, { useState } from 'react';
import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context/lib/commonjs/SafeAreaView';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';

type Props = {
  onCancel: () => void;
};

export default function Register({ onCancel }: Props) {
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://clinic-backend-s2lx.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: fullName,
          role: 'patient',
          status: 'pending'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message || 'Account created', [
          { text: 'OK', onPress: onCancel }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RNSSafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.card} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <View style={styles.logo}><Text style={styles.logoMark}>CL</Text></View>
          </View>
          <Text style={styles.cardTitle}>Create account</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Full name</Text>
            <TextInput value={fullName} onChangeText={setFullName} placeholder="First Last" style={[styles.input, styles.inputFilled]} placeholderTextColor="#9CA3AF" />

            <Text style={styles.label}>Gender</Text>
            <View style={[styles.input, styles.inputFilled, styles.pickerWrapper]}>
              <Picker selectedValue={gender} onValueChange={(val) => setGender(String(val))} mode="dropdown" style={styles.picker}>
                <Picker.Item label="Select gender" value="" />
                <Picker.Item label="Female" value="female" />
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Non-binary" value="nonbinary" />
                <Picker.Item label="Prefer not to say" value="prefer_not" />
              </Picker>
            </View>

            <Text style={styles.label}>Phone</Text>
            <TextInput value={phone} onChangeText={setPhone} placeholder="+1 555 555 5555" keyboardType="phone-pad" style={[styles.input, styles.inputFilled]} placeholderTextColor="#9CA3AF" />

            <Text style={styles.label}>Email</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder="you@company.com" keyboardType="email-address" autoCapitalize="none" style={[styles.input, styles.inputFilled]} placeholderTextColor="#9CA3AF" />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
                <TextInput 
                value={password} 
                onChangeText={setPassword} 
                placeholder="Create a password" 
                secureTextEntry={!showPassword} 
                style={[styles.input, styles.inputFilled, styles.passwordInput]} 
                placeholderTextColor="#9CA3AF" 
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)} 
                style={styles.eyeIcon}
              >
                <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm password</Text>
            <View style={styles.passwordContainer}>
                <TextInput 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                placeholder="Repeat password" 
                secureTextEntry={!showConfirmPassword} 
                style={[styles.input, styles.inputFilled, styles.passwordInput]} 
                placeholderTextColor="#9CA3AF" 
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                style={styles.eyeIcon}
              >
                <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleRegister} style={[styles.button, loading && styles.buttonDisabled]} activeOpacity={0.9} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Register'}</Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <TouchableOpacity onPress={onCancel}>
                <Text style={styles.linkSecondary}>Back to sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </RNSSafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    backgroundColor: '#F0F9FF',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    paddingVertical: 18,
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#0b3d91',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 6,
  },
  form: { width: '100%', marginTop: 6, gap: 10 },
  safeArea: { flex: 1, backgroundColor: '#F0F9FF' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
  label: { color: '#374151', fontSize: 13, marginBottom: 6, marginTop: 8 },
  inputFilled: { backgroundColor: '#FAFBFC', borderWidth: 0, paddingHorizontal: 14, paddingVertical: 12 },
  pickerWrapper: {
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  picker: {
    width: '100%'
  },
  button: { width: '100%', backgroundColor: '#0b3d91', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  buttonDisabled: {
    opacity: 0.6,
  },
  linkSecondary: { color: '#64748B', fontSize: 13 },
  passwordContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 16,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    top: 12,
    padding: 4,
  },
  eyeText: {
    fontSize: 20,
  },
  logoMark: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0b3d91',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0b3d91',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 6,
  },
});
