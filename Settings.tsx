import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context/lib/commonjs/SafeAreaView';

export default function Settings({ email, onLogout }: { email?: string; onLogout?: () => void }) {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [language, setLanguage] = useState<'english'|'kinyarwanda'|'french'>('english');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  return (
    <RNSSafeAreaView style={[styles.safe, darkMode && styles.darkSafe]}>
      <View style={[styles.container, darkMode && styles.darkContainer]}>
        <View style={styles.header}>
          <Text style={[styles.title, darkMode && styles.darkTitle]}>Settings</Text>
        </View>

        {/* <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔔</Text>
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Push notifications</Text>
            <Switch 
              value={notifications} 
              onValueChange={setNotifications}
              trackColor={{ false: '#E5E7EB', true: '#0b3d91' }}
              thumbColor={notifications ? '#0b3d91' : '#9CA3AF'}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sound alerts</Text>
            <Switch 
              value={soundEnabled} 
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#E5E7EB', true: '#0b3d91' }}
              thumbColor={soundEnabled ? '#0b3d91' : '#9CA3AF'}
            />
          </View>
        </View> */}

        <View style={[styles.section, darkMode && styles.darkSection]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, darkMode && styles.darkSectionTitle]}>Appearance</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>Dark mode</Text>
            <Switch 
              value={darkMode} 
              onValueChange={setDarkMode}
              trackColor={{ false: '#E5E7EB', true: '#0b3d91' }}
              thumbColor={darkMode ? '#0b3d91' : '#9CA3AF'}
            />
          </View>
        </View>


        <View style={[styles.section, darkMode && styles.darkSection]}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowLanguagePicker(true)} accessibilityRole="button">
            <View style={{ flexDirection: 'column' }}>
              <Text style={[styles.menuItemText, darkMode && styles.darkMenuItemText]}>Language</Text>
              <Text style={[styles.languageCurrent, darkMode && styles.darkLanguageCurrent]}>{language === 'english' ? 'English' : language === 'kinyarwanda' ? 'Kinyarwanda' : 'French'}</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

        </View>

        <View style={[styles.section, darkMode && styles.darkSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👥</Text>
            <Text style={[styles.sectionTitle, darkMode && styles.darkSectionTitle]}>Account</Text>
          </View>
          <View style={styles.accountInfo}>
            <Text style={[styles.accountLabel, darkMode && styles.darkAccountLabel]}>Signed in as</Text>
            <Text style={[styles.accountEmail, darkMode && styles.darkAccountEmail]}>{email || 'Not signed in'}</Text>
          </View>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowPrivacyPolicy(true)}>
            <Text style={[styles.menuItemText, darkMode && styles.darkMenuItemText]}>Privacy policy</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
      
        </View>

        <TouchableOpacity style={styles.logout} onPress={() => onLogout && onLogout()}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>

        <Modal visible={showPrivacyPolicy} animationType="slide">
          <RNSSafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Policy</Text>
              <TouchableOpacity onPress={() => setShowPrivacyPolicy(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.policyTitle}>Clinova Privacy Policy</Text>
              
              <View style={styles.policySection}>
                <Text style={styles.sectionNumber}>1.</Text>
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionHeading}>Information We Collect</Text>
                  <Text style={styles.sectionText}>We collect health information you provide, including symptoms, medical history, and appointment data.</Text>
                </View>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.sectionNumber}>2.</Text>
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionHeading}>How We Use Your Information</Text>
                  <Text style={styles.sectionText}>Your data is used to provide healthcare services, schedule appointments, and improve our platform.</Text>
                </View>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.sectionNumber}>3.</Text>
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionHeading}>Data Security</Text>
                  <Text style={styles.sectionText}>We use industry-standard encryption to protect your sensitive health information.</Text>
                </View>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.sectionNumber}>4.</Text>
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionHeading}>Sharing Information</Text>
                  <Text style={styles.sectionText}>We only share your data with healthcare providers involved in your care, with your consent.</Text>
                </View>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.sectionNumber}>5.</Text>
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionHeading}>Your Rights</Text>
                  <Text style={styles.sectionText}>You can access, update, or delete your personal information at any time.</Text>
                </View>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.sectionNumber}>6.</Text>
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionHeading}>Contact Us</Text>
                  <Text style={styles.sectionText}>For privacy concerns, contact us at privacy@clinova.com</Text>
                </View>
              </View>
            </ScrollView>
          </RNSSafeAreaView>
        </Modal>
        <Modal visible={showLanguagePicker} animationType="slide" transparent={false}>
          <RNSSafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select language</Text>
              <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingVertical: 8 }}>
              <Text style={styles.modalSubtitle}>Choose the language you prefer for the app interface.</Text>

              <TouchableOpacity style={styles.languageRow} onPress={() => { setLanguage('english'); setShowLanguagePicker(false); }} accessibilityRole="button">
                <View style={styles.languageTextWrap}>
                  <Text style={styles.languageOptionText}>English</Text>
                  <Text style={styles.languageNative}>English</Text>
                </View>
                <View style={styles.radioOuter} accessible accessibilityRole="image" accessibilityLabel={language === 'english' ? 'Selected' : 'Not selected'}>
                  {language === 'english' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.languageRow} onPress={() => { setLanguage('kinyarwanda'); setShowLanguagePicker(false); }} accessibilityRole="button">
                <View style={styles.languageTextWrap}>
                  <Text style={styles.languageOptionText}>Kinyarwanda</Text>
                  <Text style={styles.languageNative}>Ikinyarwanda</Text>
                </View>
                <View style={styles.radioOuter} accessible accessibilityRole="image" accessibilityLabel={language === 'kinyarwanda' ? 'Selected' : 'Not selected'}>
                  {language === 'kinyarwanda' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.languageRow} onPress={() => { setLanguage('french'); setShowLanguagePicker(false); }} accessibilityRole="button">
                <View style={styles.languageTextWrap}>
                  <Text style={styles.languageOptionText}>French</Text>
                  <Text style={styles.languageNative}>Français</Text>
                </View>
                <View style={styles.radioOuter} accessible accessibilityRole="image" accessibilityLabel={language === 'french' ? 'Selected' : 'Not selected'}>
                  {language === 'french' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>

            </ScrollView>
          </RNSSafeAreaView>
        </Modal>
      </View>
    </RNSSafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#F0F9FF' 
  },
  container: { 
    flex: 1, 
    padding: 16 
  },
  header: {
    marginBottom: 24,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  section: { 
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  sectionTitle: { 
    fontSize: 16,
    fontWeight: '700', 
    color: '#1E293B',
  },
  row: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  label: { 
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  menuItemArrow: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  accountInfo: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  accountLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  logout: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444', 
    borderRadius: 10,
    paddingVertical: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
  },

  logoutText: { 
    color: '#FFFFFF', 
    fontSize: 16,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    fontSize: 24,
    color: '#64748B',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },

  languageOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  languageSelected: {
    color: '#0b3d91',
    fontWeight: '700',
    fontSize: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginHorizontal: 12,
    marginBottom: 12,
  },
  languageRow: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageTextWrap: {
    flexDirection: 'column',
  },
  languageNative: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0b3d91',
  },
  languageCurrent: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  darkLanguageCurrent: { color: '#94A3B8' },
  policyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 24,
    textAlign: 'center',
  },
  policySection: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#WHITE',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0b3d91',
    marginRight: 12,
    marginTop: 2,
  },
  sectionContent: {
    flex: 1,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  darkSafe: { backgroundColor: '#1E293B' },
  darkContainer: { backgroundColor: '#1E293B' },
  darkTitle: { color: '#F8FAFC' },
  darkSubtitle: { color: '#94A3B8' },
  darkSection: { backgroundColor: '#334155' },
  darkSectionTitle: { color: '#F8FAFC' },
  darkLabel: { color: '#E2E8F0' },
  darkAccountLabel: { color: '#94A3B8' },
  darkAccountEmail: { color: '#F8FAFC' },
  darkMenuItemText: { color: '#E2E8F0' },
});
