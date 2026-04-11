import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context';

interface Patient {
  user_id?: number;
  dob?: string;
  gender?: string;
  phone?: string;
  blood_group?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  current_medications?: string[];
  emergency_contact_name?: string;
  address?: string;
  image_path?: string;
  insurance?: string;
  insurance_other?: string;
}

export default function Profile({ name, email, avatarUri, userId, onBack, onLogout, patient, onSave }:
  { name?: string; email?: string; avatarUri?: string; userId?: number; onBack?: () => void; onLogout?: () => void; patient?: Patient; onSave?: (p: Patient|undefined)=>void }) {
  const displayName = name || (email ? email.split('@')[0] : 'User');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localPatient, setLocalPatient] = useState<Patient | undefined>(patient);
  const [localAvatar, setLocalAvatar] = useState<string|undefined>(avatarUri);
  const profileForView = localPatient || patient;

  useEffect(() => setLocalPatient(patient), [patient]);
  useEffect(() => setLocalAvatar(avatarUri), [avatarUri]);

  const arrayToString = (arr?: string[]) => (arr && arr.length ? arr.join(', ') : '');
  const stringToArray = (s?: string) => (s ? s.split(',').map(i => i.trim()).filter(Boolean) : []);

  function startEdit() {
    setLocalPatient(localPatient ? { ...localPatient } : (patient ? { ...patient } : { user_id: userId }));
    setEditing(true);
  }
  function cancelEdit() {
    setLocalPatient(patient || localPatient);
    setEditing(false);
  }
  async function saveProfile() {
    const uid = userId ?? localPatient?.user_id;
    if (!uid) { Alert.alert('Save failed', 'No user id available'); return; }

    const payload: any = {
      user_id: uid,
      dob: localPatient?.dob || null,
      gender: localPatient?.gender || null,
      phone: localPatient?.phone || null,
      blood_group: localPatient?.blood_group || null,
      allergies: localPatient?.allergies || [],
      chronic_conditions: localPatient?.chronic_conditions || [],
      current_medications: localPatient?.current_medications || [],
      emergency_contact_name: localPatient?.emergency_contact_name || null,
      address: localPatient?.address || null,
      insurance: {
        additionalProp1: { Provide: (localPatient?.insurance === 'other' ? (localPatient as any)?.insurance_other || 'Other' : (localPatient?.insurance || '')) }
      }
    };

    try {
      setSaving(true);
      const resp = await fetch('https://clinic-backend-s2lx.onrender.com/api/auth/profile', {
        method: 'POST',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let json: any = null;
      try {
        json = await resp.json();
      } catch {
        json = null;
      }
      if (resp.ok) {
        const serverProfile = json?.profile || json?.data?.profile || json?.patient;
        const p: any = {
          ...(patient || {}),
          ...(localPatient || {}),
          ...(serverProfile || {}),
          user_id: uid,
        };
        if (p.insurance && typeof p.insurance === 'string') {
          try { p.insurance = JSON.parse(p.insurance.trim()); } catch (e) { /* leave as-is */ }
        }
        setLocalPatient(p as Patient);
        if (onSave) onSave(p as Patient);
        Alert.alert('Success', json.message || 'Profile saved');
        setEditing(false);
      } else {
        console.warn('profile save failed', resp.status, json);
        Alert.alert('Save failed', json?.message || `Server returned ${resp.status}`);
      }
    } catch (err) {
      console.warn('saveProfile error', err);
      Alert.alert('Save error', String(err));
    } finally {
      setSaving(false);
    }
  }

  function saveEdit() { saveProfile(); }

  function formatInsurance(ins: any) {
    if (!ins) return 'Not set';
    if (typeof ins === 'string') {
      // try parse stringified JSON
      try { ins = JSON.parse(ins.trim()); } catch (e) { return ins; }
    }
    if (typeof ins === 'object') {
      // common shape: { additionalProp1: { Provide: 'RAMA' } }
      if (ins.additionalProp1 && typeof ins.additionalProp1 === 'object') {
        const ap = ins.additionalProp1;
        if (ap.Provide) return String(ap.Provide);
        const vals = Object.values(ap).filter(Boolean);
        if (vals.length) return String(vals[0]);
      }
      // fallback: extract first primitive value
      const flat = Object.values(ins).flatMap(v => (v && typeof v === 'object') ? Object.values(v) : [v]).filter(Boolean);
      if (flat.length) return String(flat[0]);
      return JSON.stringify(ins);
    }
    return String(ins);
  }

  async function fetchPreview(userId?: number) {
    if (userId === undefined) return;
    const endpoint = `https://clinic-backend-s2lx.onrender.com/api/auth/profile-image/preview?user_id=${userId}`;
    try {
      const resp = await fetch(endpoint, { method: 'GET', headers: { accept: 'application/json' } });
      let json: any = null;
      try {
        json = await resp.json();
      } catch {
        json = null;
      }
      if (resp.ok && json?.preview_url) {
        setLocalAvatar(json.preview_url);
      } else if (resp.status === 404) {
        // No uploaded profile image yet; use fallback avatar without warning.
        setLocalAvatar(undefined);
      } else {
        console.warn('preview fetch failed', resp.status, json);
      }
    } catch (err) {
      console.warn('fetchPreview error', err);
    }
  }

  useEffect(() => {
    const uid = userId ?? patient?.user_id;
    if (uid !== undefined) fetchPreview(uid);
  }, [userId, patient?.user_id]);

  async function uploadProfileImage(uri?: string, name?: string, type?: string) {
    if (!uri) return;
    const uid = userId ?? localPatient?.user_id;
    if (uid === undefined) {
      console.warn('No user id provided for image upload');
      Alert.alert('Upload failed', 'No user id provided');
      return;
    }

    // Normalize uri for Android content URIs if needed
    let fileUri = uri;
    if (Platform.OS === 'android' && !fileUri.startsWith('file://') && fileUri.startsWith('/')) {
      fileUri = 'file://' + fileUri;
    }

    const form = new FormData();
    form.append('user_id', String(uid));
    form.append('image', { uri: fileUri, name: name || 'photo.jpg', type: type || 'image/jpeg' } as any);

    try {
      const resp = await fetch('https://clinic-backend-s2lx.onrender.com/api/auth/profile-image', {
        method: 'POST',
        body: form,
      });
      const json = await resp.json();
      if (resp.ok && json?.profile?.image_path) {
        // ask the backend for a signed preview URL and set that as avatar
        const uid = userId ?? localPatient?.user_id;
        setLocalPatient(p => ({ ...(p||{}), image_path: json.profile.image_path }));
        if (uid !== undefined) await fetchPreview(uid);
        Alert.alert('Success', json.message || 'Profile image saved');
      } else {
        console.warn('upload failed', resp.status, json);
        Alert.alert('Upload failed', json?.message || `Server returned ${resp.status}`);
      }
    } catch (err) {
      console.warn('uploadProfileImage error', err);
      Alert.alert('Upload error', String(err));
    }
  }

  async function pickImageAndUpload() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissions required', 'Permission to access the photo library is required.');
      return;
    }

    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });
      // Old API returned { cancelled, uri }, newer returns { cancelled, assets: [{ uri }] }
      const cancelled = (res as any).cancelled === true;
      if (cancelled) return;
      const uri = (res as any).assets?.[0]?.uri || (res as any).uri;
      if (!uri) return;
      setLocalAvatar(uri);
      const name = uri.split('/').pop() || 'photo.jpg';
      uploadProfileImage(uri, name, 'image/jpeg');
    } catch (err) {
      console.warn('ImagePicker error', err);
    }
  }

  

  return (
    <RNSSafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onBack && onBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
        <ScrollView contentContainerStyle={[styles.container, { flexGrow: 1 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
            <Image source={{ uri: localAvatar || avatarUri || `https://i.pravatar.cc/150?u=${encodeURIComponent(email||'anon')}` }} style={styles.avatar} />
            <TouchableOpacity style={styles.changeAvatar} onPress={pickImageAndUpload}>
              <Text style={styles.changeAvatarText}>Change Avatar</Text>
            </TouchableOpacity>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{email || 'No email'}</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Available</Text>
            </View>
          </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date of Birth</Text>
            {editing ? (
              <TextInput style={styles.input} value={localPatient?.dob || ''} onChangeText={t => setLocalPatient({ ...(localPatient||{}), dob: t })} placeholder="YYYY-MM-DD" />
            ) : (
              <Text style={styles.infoValue}>{profileForView?.dob ? new Date(profileForView.dob).toLocaleDateString() : 'Not set'}</Text>
            )}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender</Text>
            {editing ? (
              <View style={styles.genderRow}>
                {['female','male','other'].map(g => (
                  <TouchableOpacity key={g} onPress={() => setLocalPatient(prev => ({ ...(prev||{}), gender: g }))} style={[styles.chipSmall, localPatient?.gender === g && styles.chipSmallSelected, { marginLeft: 8 }]}>
                    <Text style={[styles.chipSmallText, localPatient?.gender === g && styles.chipSmallTextSelected]}>{g[0].toUpperCase()+g.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.infoValue}>{profileForView?.gender ? (profileForView.gender[0].toUpperCase()+profileForView.gender.slice(1)) : 'Not set'}</Text>
            )}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Blood Type</Text>
            {editing ? (
              <TextInput style={styles.input} value={localPatient?.blood_group || ''} onChangeText={t => setLocalPatient({ ...(localPatient||{}), blood_group: t })} />
            ) : (
              <Text style={styles.infoValue}>{profileForView?.blood_group || 'Not set'}</Text>
            )}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Emergency Contact</Text>
            {editing ? (
              <TextInput style={styles.input} value={localPatient?.emergency_contact_name || ''} onChangeText={t => setLocalPatient({ ...(localPatient||{}), emergency_contact_name: t })} />
            ) : (
              <Text style={styles.infoValue}>{profileForView?.emergency_contact_name || 'Not set'}</Text>
            )}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            {editing ? (
              <TextInput style={styles.input} value={localPatient?.phone || ''} onChangeText={t => setLocalPatient({ ...(localPatient||{}), phone: t })} keyboardType="phone-pad" />
            ) : (
              <Text style={styles.infoValue}>{profileForView?.phone || 'Not set'}</Text>
            )}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            {editing ? (
              <TextInput style={styles.input} value={localPatient?.address || ''} onChangeText={t => setLocalPatient({ ...(localPatient||{}), address: t })} />
            ) : (
              <Text style={styles.infoValue}>{profileForView?.address || 'Not set'}</Text>
            )}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Insurance</Text>
            {editing ? (
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.smallLabel}>Select your provider</Text>
                <View style={styles.insuranceGrid}>
                  {['RAMA','MUTUAL','MMI','OTHER'].map(opt => {
                    const key = opt.toLowerCase();
                    const selected = (localPatient?.insurance || '').toLowerCase() === key;
                    return (
                      <TouchableOpacity key={opt} onPress={() => setLocalPatient(prev => ({ ...(prev||{}), insurance: key, insurance_other: key === 'other' ? (prev?.insurance_other||'') : undefined }))} style={[styles.insuranceCard, selected && styles.insuranceCardSelected]}>
                        <View style={styles.insuranceLogo}>
                          <Text style={[styles.insuranceCardText, selected && { color: '#fff' }]}>{opt === 'OTHER' ? '☁' : opt[0]}</Text>
                        </View>
                        <Text style={[styles.insuranceCardText, selected && { color: '#fff' }]}>{opt === 'OTHER' ? 'Other' : opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {(localPatient?.insurance || '').toLowerCase() === 'other' ? (
                  <TextInput style={[styles.input, { marginTop: 10 }]} value={(localPatient as any)?.insurance_other || ''} onChangeText={t => setLocalPatient(prev => ({ ...(prev||{}), insurance_other: t } as any))} placeholder="Provider name" />
                ) : null}

                {/* policy number and expiry removed per design */}

                {/* upload/preview removed per design — kept simple inputs only */}

              </View>
            ) : (
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.infoValue}>{formatInsurance((profileForView as any)?.insurance)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Allergies</Text>
            {editing ? (
              <TextInput style={styles.input} value={arrayToString(localPatient?.allergies)} onChangeText={t => setLocalPatient({ ...(localPatient||{}), allergies: stringToArray(t) })} placeholder="comma separated" />
            ) : (
              <Text style={styles.infoValue}>{(profileForView?.allergies && profileForView.allergies.length) ? profileForView.allergies.join(', ') : 'None'}</Text>
            )}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Chronic Conditions</Text>
            {editing ? (
              <TextInput style={styles.input} value={arrayToString(localPatient?.chronic_conditions)} onChangeText={t => setLocalPatient({ ...(localPatient||{}), chronic_conditions: stringToArray(t) })} placeholder="comma separated" />
            ) : (
              <Text style={styles.infoValue}>{(profileForView?.chronic_conditions && profileForView.chronic_conditions.length) ? profileForView.chronic_conditions.join(', ') : 'None'}</Text>
            )}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Medications</Text>
            {editing ? (
              <TextInput style={styles.input} value={arrayToString(localPatient?.current_medications)} onChangeText={t => setLocalPatient({ ...(localPatient||{}), current_medications: stringToArray(t) })} placeholder="comma separated" />
            ) : (
              <Text style={styles.infoValue}>{(profileForView?.current_medications && profileForView.current_medications.length) ? profileForView.current_medications.join(', ') : 'None'}</Text>
            )}
          </View>
        </View>

        {!editing ? (
          <TouchableOpacity style={styles.editButton} onPress={startEdit}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity style={styles.editButton} onPress={saveEdit} disabled={saving}>
              <Text style={styles.editButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit} disabled={saving}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.logout} onPress={() => onLogout && onLogout()}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
        </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backIcon: {
    fontSize: 14,
    color: '#1E293B',
    marginRight: 4,
    fontWeight: '600',
  },
  backText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSpacer: {
    width: 48, // Balance the back button
  },
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 120,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  email: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#001e3c',
    backgroundColor: '#001e3c',
    marginRight: 6,
  },
  statusText: {
    color: '#041430',
    fontSize: 10,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  chipSmall: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: 'transparent' },
  chipSmallSelected: { backgroundColor: '#001e3c', borderColor: '#001e3c' },
  insuranceCardSelected: { backgroundColor: '#001e3c', borderColor: '#001e3c' },
  insuranceCardText: { color: '#001e3c', fontWeight: '700' },
  chipSmallTextSelected: { color: '#FFFFFF' },
  insuranceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' },
  insuranceCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E6EEF9', backgroundColor: '#FFFFFF', marginLeft: 8 },
  insuranceCardSelected: { backgroundColor: '#041430', borderColor: '#041430' },
  insuranceLogo: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  insuranceCardText: { color: '#041430', fontWeight: '700' },
  smallLabel: { color: '#475569', fontSize: 12, fontWeight: '600' },
  genderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  // uploadButton and insurancePreview removed — upload feature removed
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  editButton: {
    backgroundColor: '#001e3c',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#001e3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    textAlign: 'right',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '700',
  },
  changeAvatar: {
    marginTop: 4,
    backgroundColor: '#001e3c',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#001e3c',
  },
  changeAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  logout: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
