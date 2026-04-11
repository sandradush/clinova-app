import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');
const PRIMARY = '#001e3c';

const HomePage = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <View style={styles.topSection}>
        <View style={styles.logoWrap}>
        <Image source={require('./assets/icon.png')} style={styles.logo} />
        </View>
        <Text style={styles.brand}>Smarthealth</Text>
        <Text style={styles.tagline}>Your health, our priority</Text>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.pill}>
          <View style={styles.pillDot} />
          <Text style={styles.pillText}>Trusted by 10,000+ patients</Text>
        </View>

        <Text style={styles.heading}>Healthcare at{'\n'}your fingertips</Text>
        <Text style={styles.sub}>Book appointments, consult doctors and manage your health — all in one place.</Text>

        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Register')} activeOpacity={0.85}>
          <Text style={styles.btnPrimaryText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
          <Text style={styles.btnOutlineText}>Sign In</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>By continuing you agree to our{' '}
          <Text style={styles.termsLink}>Terms & Privacy Policy</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PRIMARY },
  topSection: {
    flex: 1,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  logoWrap: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logo: { width: 70, height: 70, resizeMode: 'contain' },
  brand: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.65)', marginTop: 6, fontWeight: '500' },
  bottomSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 36,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 20,
  },
  pillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E', marginRight: 7 },
  pillText: { fontSize: 12, color: PRIMARY, fontWeight: '600' },
  heading: { fontSize: 30, fontWeight: '800', color: PRIMARY, lineHeight: 38, marginBottom: 12 },
  sub: { fontSize: 15, color: '#64748B', lineHeight: 22, marginBottom: 32 },
  btnPrimary: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  btnOutline: {
    borderWidth: 2,
    borderColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  btnOutlineText: { color: PRIMARY, fontSize: 16, fontWeight: '700' },
  terms: { textAlign: 'center', fontSize: 12, color: '#94A3B8' },
  termsLink: { color: PRIMARY, fontWeight: '600' },
});

export default HomePage;
