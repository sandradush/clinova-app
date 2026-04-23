import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIMARY = '#001e3c';
const BASE = 'https://clinic-backend-s2lx.onrender.com'; // same as localhost:3001 in production

type Record = {
  record_id: number;
  consultation_id: number;
  patient_id: number;
  file_url?: string;
  description?: string;
  patient_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  doctor_id?: number | null;
  doctor_name?: string | null;
};

type Props = { userId?: number; onBack: () => void };

export default function MedicalRecord({ userId, onBack }: Props) {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    fetch(`${BASE}/api/medical-records/patient/${userId}`, {
      headers: { accept: 'application/json' },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRecords(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRecords(); }, [userId]);

  const fmtDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
      });
      const time = timeStr ? timeStr.slice(0, 5) : '';
      return time ? `${date} • ${time}` : date;
    } catch { return dateStr; }
  };

  const openFile = (url?: string) => {
    if (!url) return;
    // Extract filename for display
    const filename = url.split('/').pop() || url.split('\\').pop() || 'file';
    Alert.alert(
      'Open File',
      `File: ${filename}\n\nThis file was uploaded by your doctor.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open', onPress: () => {
            Linking.openURL(url).catch(() =>
              Alert.alert('Cannot open', 'Unable to open this file on your device.')
            );
          }
        },
      ]
    );
  };

  const fileIcon = (url?: string) => {
    if (!url) return '📄';
    const lower = url.toLowerCase();
    if (lower.endsWith('.pdf')) return '📕';
    if (lower.endsWith('.docx') || lower.endsWith('.doc')) return '📘';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) return '🖼️';
    return '📄';
  };

  const fileName = (url?: string) => {
    if (!url) return 'Attached file';
    return url.split('/').pop()?.split('\\').pop() || 'Attached file';
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <TouchableOpacity onPress={loadRecords} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={PRIMARY} size="large" />
          <Text style={styles.loadingText}>Loading records...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerIconBox}>
              <Text style={styles.bannerIconText}>🏥</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Your Medical Records</Text>
              <Text style={styles.bannerSub}>
                {records.length > 0
                  ? `${records.length} record${records.length > 1 ? 's' : ''} from your doctor`
                  : 'Records added by your doctor appear here'}
              </Text>
            </View>
          </View>

          {/* Empty state */}
          {records.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No records yet</Text>
              <Text style={styles.emptySubtitle}>
                Your doctor hasn't added any medical records yet.{'\n'}
                Records will appear here after your consultations.
              </Text>
            </View>
          )}

          {/* Record cards */}
          {records.map((rec, idx) => (
            <View key={rec.record_id} style={styles.card}>

              {/* Card top row */}
              <View style={styles.cardTop}>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>#{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardPatient}>{rec.patient_name || 'Patient'}</Text>
                  <Text style={styles.cardDate}>{fmtDate(rec.appointment_date, rec.appointment_time)}</Text>
                </View>
                {rec.doctor_name && (
                  <View style={styles.doctorPill}>
                    <Text style={styles.doctorPillText}>Dr. {rec.doctor_name}</Text>
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              {/* Description */}
              {rec.description ? (
                <View style={styles.descBox}>
                  <Text style={styles.descLabel}>DESCRIPTION</Text>
                  <Text style={styles.descText}>{rec.description}</Text>
                </View>
              ) : null}

              {/* File attachment */}
              {rec.file_url ? (
                <TouchableOpacity
                  style={styles.fileRow}
                  onPress={() => openFile(rec.file_url)}
                  activeOpacity={0.75}
                >
                  <View style={styles.fileIconBox}>
                    <Text style={styles.fileIconText}>{fileIcon(rec.file_url)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fileName} numberOfLines={1}>{fileName(rec.file_url)}</Text>
                    <Text style={styles.fileTap}>Tap to open</Text>
                  </View>
                  <Text style={styles.fileArrow}>›</Text>
                </TouchableOpacity>
              ) : null}

              {/* Meta footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>Consultation #{rec.consultation_id}</Text>
                <Text style={styles.cardMeta}>Record #{rec.record_id}</Text>
              </View>
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#F1F5F9', borderRadius: 10 },
  backText: { color: PRIMARY, fontWeight: '700', fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: PRIMARY },
  refreshBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#EEF2FF', borderRadius: 10 },
  refreshText: { color: PRIMARY, fontWeight: '700', fontSize: 12 },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#64748B', fontSize: 14 },

  scroll: { padding: 16 },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: PRIMARY, borderRadius: 16, padding: 18, marginBottom: 20,
  },
  bannerIconBox: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerIconText: { fontSize: 24 },
  bannerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 3 },
  bannerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 17 },

  emptyBox: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 21 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 4,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardBadge: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
  },
  cardBadgeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  cardPatient: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  cardDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  doctorPill: {
    backgroundColor: '#EEF2FF', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  doctorPillText: { fontSize: 11, fontWeight: '700', color: PRIMARY },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 },

  descBox: { marginBottom: 12 },
  descLabel: {
    fontSize: 10, fontWeight: '700', color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5,
  },
  descText: { fontSize: 14, color: '#374151', lineHeight: 21 },

  fileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F8FAFF', borderRadius: 12,
    padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  fileIconBox: {
    width: 42, height: 42, borderRadius: 11,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },
  fileIconText: { fontSize: 22 },
  fileName: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  fileTap: { fontSize: 11, color: '#94A3B8' },
  fileArrow: { fontSize: 22, color: '#CBD5E1' },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10, marginTop: 4,
  },
  cardMeta: { fontSize: 11, color: '#CBD5E1', fontWeight: '600' },
});
