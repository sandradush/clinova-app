import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context';
import { useLang, LangCode } from './i18n';
import MedicalRecord from './MedicalRecord';

export default function Settings({ email, onLogout, onBack, userId }: {
  email?: string;
  onLogout?: () => void;
  onBack?: () => void;
  userId?: number;
}) {
  const { t, lang, setLang } = useLang();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showMedicalRecord, setShowMedicalRecord] = useState(false);

  const LANGUAGES: { code: LangCode; label: string; native: string }[] = [
    { code: 'en', label: 'English',     native: 'English' },
    { code: 'fr', label: 'French',      native: 'Français' },
    { code: 'rw', label: 'Kinyarwanda', native: 'Kinyarwanda' },
  ];
  const currentLang = LANGUAGES.find(l => l.code === lang);

  // Full-screen Medical Record page
  if (showMedicalRecord) {
    return <MedicalRecord userId={userId} onBack={() => setShowMedicalRecord(false)} />;
  }

  return (
    <RNSSafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[{ flexGrow: 1 }, styles.container]}>

        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerWithDismiss}>
            <Text style={styles.title}>{t.settingsTitle}</Text>
            {typeof onBack === 'function' ? (
              <TouchableOpacity onPress={onBack} style={styles.dismissBtn}>
                <Text style={styles.dismissText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Health section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowMedicalRecord(true)}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuItemIconBox}><Text style={styles.menuItemIconText}>🏥</Text></View>
              <Text style={styles.menuItemText}>Medical Record</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Language section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.language}</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowLangPicker(true)}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuItemIconBox}><Text style={styles.menuItemIconText}>🌐</Text></View>
              <Text style={styles.menuItemText}>{currentLang?.native}</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.account}</Text>
          <View style={styles.accountInfo}>
            <Text style={styles.accountLabel}>{t.signedInAs}</Text>
            <Text style={styles.accountEmail}>{email || 'Not signed in'}</Text>
          </View>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowPrivacyPolicy(true)}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuItemIconBox}><Text style={styles.menuItemIconText}>🔒</Text></View>
              <Text style={styles.menuItemText}>{t.privacyPolicy}</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.logout} onPress={() => onLogout && onLogout()}>
          <Text style={styles.logoutText}>{t.signOut}</Text>
        </TouchableOpacity>

        {/* Language Picker Modal */}
        <Modal visible={showLangPicker} animationType="slide" transparent>
          <View style={styles.langOverlay}>
            <View style={styles.langSheet}>
              <Text style={styles.langSheetTitle}>{t.selectLanguage}</Text>
              {LANGUAGES.map(l => (
                <TouchableOpacity
                  key={l.code}
                  style={[styles.langOption, lang === l.code && styles.langOptionActive]}
                  onPress={() => { setLang(l.code); setShowLangPicker(false); }}
                >
                  <Text style={[styles.langOptionText, lang === l.code && styles.langOptionTextActive]}>{l.native}</Text>
                  {lang === l.code && <Text style={styles.langCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.langCancel} onPress={() => setShowLangPicker(false)}>
                <Text style={styles.langCancelText}>{t.close}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Privacy Policy Modal */}
        <Modal visible={showPrivacyPolicy} animationType="slide">
          <RNSSafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Policy</Text>
              <TouchableOpacity onPress={() => setShowPrivacyPolicy(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.policyTitle}>Smarthealth Privacy Policy</Text>
              {[
                { n: '1.', h: 'Information We Collect', b: 'We collect health information you provide, including symptoms, medical history, and appointment data.' },
                { n: '2.', h: 'How We Use Your Information', b: 'Your data is used to provide healthcare services, schedule appointments, and improve our platform.' },
                { n: '3.', h: 'Data Security', b: 'We use industry-standard encryption to protect your sensitive health information.' },
                { n: '4.', h: 'Sharing Information', b: 'We only share your data with healthcare providers involved in your care, with your consent.' },
                { n: '5.', h: 'Your Rights', b: 'You can access, update, or delete your personal information at any time.' },
                { n: '6.', h: 'Contact Us', b: 'For privacy concerns, contact us at privacy@smarthealth.com' },
              ].map(item => (
                <View key={item.n} style={styles.policySection}>
                  <Text style={styles.sectionNumber}>{item.n}</Text>
                  <View style={styles.sectionContent}>
                    <Text style={styles.sectionHeading}>{item.h}</Text>
                    <Text style={styles.sectionText}>{item.b}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </RNSSafeAreaView>
        </Modal>

      </ScrollView>
    </RNSSafeAreaView>
  );
}

const PRIMARY = '#001e3c';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F9FF' },
  container: { flex: 1, padding: 16 },
  headerContainer: { marginBottom: 18, paddingTop: 4, paddingBottom: 4 },
  headerWithDismiss: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  dismissBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  dismissText: { color: '#64748B', fontSize: 18, fontWeight: '700' },

  section: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 12,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },

  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuItemIconBox: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },
  menuItemIconText: { fontSize: 16 },
  menuItemText: { fontSize: 15, color: '#1E293B', fontWeight: '500' },
  menuItemArrow: { fontSize: 20, color: '#CBD5E1', fontWeight: '400' },

  accountInfo: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 4 },
  accountLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  accountEmail: { fontSize: 15, color: '#1E293B', fontWeight: '600' },

  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EF4444', borderRadius: 12, paddingVertical: 14, marginTop: 4,
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 6, elevation: 3,
  },
  logoutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  langOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  langSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  langSheetTitle: { fontSize: 18, fontWeight: '800', color: PRIMARY, marginBottom: 20, textAlign: 'center' },
  langOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8,
    backgroundColor: '#F8FAFF', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  langOptionActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  langOptionText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  langOptionTextActive: { color: '#FFFFFF' },
  langCheck: { fontSize: 16, color: '#FFFFFF', fontWeight: '700' },
  langCancel: { marginTop: 8, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#F1F5F9' },
  langCancelText: { fontSize: 15, fontWeight: '700', color: '#64748B' },

  modalContainer: { flex: 1, backgroundColor: '#F0F9FF' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  closeButton: { fontSize: 24, color: '#64748B' },
  modalContent: { flex: 1, padding: 16 },
  policyTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 24, textAlign: 'center' },
  policySection: {
    flexDirection: 'row', marginBottom: 12, borderRadius: 8, padding: 12,
    backgroundColor: '#FFFFFF', shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  sectionNumber: { fontSize: 14, fontWeight: '700', color: PRIMARY, marginRight: 12, marginTop: 2 },
  sectionContent: { flex: 1 },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  sectionText: { fontSize: 14, lineHeight: 20, color: '#374151' },
});
