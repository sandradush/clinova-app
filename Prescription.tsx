import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIMARY = '#001e3c';

type Appointment = {
  id: string;
  doctor_name?: string;
  date?: string;
  time?: string;
  status?: string;
  description?: string;
};

type Perception = {
  id: number;
  title: string;
  note: string;
  created_at: string;
};

type Props = {
  appointmentId?: string | number;
  onClose?: () => void;
  userId?: number;
};

export default function Prescription({ appointmentId, onClose, userId }: Props) {
  // Standalone tab mode (userId provided, no appointmentId)
  const standaloneMode = !!userId && !appointmentId;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);

  const [perceptions, setPerceptions] = useState<Perception[]>([]);
  const [loadingPerceptions, setLoadingPerceptions] = useState(false);

  // Fetch appointments list for standalone tab
  useEffect(() => {
    if (!standaloneMode) return;
    setLoadingAppts(true);
    fetch(`https://clinic-backend-s2lx.onrender.com/api/appointments/patient/${userId}`, {
      headers: { accept: 'application/json' },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAppointments(data.map((d: any) => ({
            id: String(d.id),
            doctor_name: d.doctor_name || 'Doctor pending',
            date: d.date ? d.date.split('T')[0] : '',
            time: d.time ? d.time.slice(0, 5) : '',
            status: d.status || 'pending',
            description: d.description || '',
          })));
        }
      })
      .catch(() => Alert.alert('Error', 'Could not load appointments'))
      .finally(() => setLoadingAppts(false));
  }, [userId]);

  // Fetch perceptions for a given appointmentId (modal or direct)
  const fetchPerceptions = (apptId: string | number) => {
    setLoadingPerceptions(true);
    setPerceptions([]);
    fetch(`https://clinic-backend-s2lx.onrender.com/api/perceptions/appointment/${apptId}`, {
      headers: { accept: 'application/json' },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPerceptions(data); })
      .catch(() => Alert.alert('Error', 'Could not load prescriptions'))
      .finally(() => setLoadingPerceptions(false));
  };

  // Direct mode (called from Appointment modal with appointmentId)
  useEffect(() => {
    if (appointmentId) fetchPerceptions(appointmentId);
  }, [appointmentId]);

  const statusColor = (s?: string) => {
    if (s === 'confirmed') return { bg: '#DCFCE7', text: '#15803D' };
    if (s === 'cancelled') return { bg: '#FEE2E2', text: '#B91C1C' };
    return { bg: '#FEF9C3', text: '#92400E' };
  };

  // ── Direct / modal mode ──────────────────────────────────────────────────
  if (!standaloneMode) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.directHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.directTitle}>Prescriptions</Text>
        </View>
        <ScrollView contentContainerStyle={styles.directScroll}>
          {loadingPerceptions && <ActivityIndicator color={PRIMARY} style={{ marginTop: 32 }} />}
          {!loadingPerceptions && perceptions.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>💊</Text>
              <Text style={styles.emptyTitle}>No prescriptions</Text>
              <Text style={styles.emptySubtitle}>No prescriptions found for this appointment.</Text>
            </View>
          )}
          {perceptions.map(p => (
            <View key={p.id} style={styles.rxCard}>
              <View style={styles.rxCardTop}>
                <View style={styles.rxIconBox}><Text style={styles.rxIcon}>💊</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rxTitle}>{p.title}</Text>
                  <Text style={styles.rxDate}>{p.created_at?.split('T')[0]}</Text>
                </View>
              </View>
              <View style={styles.rxDivider} />
              <Text style={styles.rxNoteLabel}>Note</Text>
              <Text style={styles.rxNote}>{p.note}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Standalone tab mode ──────────────────────────────────────────────────
  if (selected) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.directHeader}>
          <TouchableOpacity onPress={() => { setSelected(null); setPerceptions([]); }} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.directTitle}>Prescriptions</Text>
        </View>
        <View style={styles.apptBanner}>
          <Text style={styles.apptBannerDoc}>{selected.doctor_name}</Text>
          <Text style={styles.apptBannerDate}>{selected.date}  {selected.time}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.directScroll}>
          {loadingPerceptions && <ActivityIndicator color={PRIMARY} style={{ marginTop: 32 }} />}
          {!loadingPerceptions && perceptions.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>💊</Text>
              <Text style={styles.emptyTitle}>No prescriptions</Text>
              <Text style={styles.emptySubtitle}>No prescriptions found for this appointment.</Text>
            </View>
          )}
          {perceptions.map(p => (
            <View key={p.id} style={styles.rxCard}>
              <View style={styles.rxCardTop}>
                <View style={styles.rxIconBox}><Text style={styles.rxIcon}>💊</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rxTitle}>{p.title}</Text>
                  <Text style={styles.rxDate}>{p.created_at?.split('T')[0]}</Text>
                </View>
              </View>
              <View style={styles.rxDivider} />
              <Text style={styles.rxNoteLabel}>Note</Text>
              <Text style={styles.rxNote}>{p.note}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.tabScroll}>
        {/* Header */}
        <View style={styles.tabHeader}>
          <Text style={styles.tabTitle}>Prescriptions</Text>
          <Text style={styles.tabSubtitle}>Select an appointment to view its prescriptions</Text>
        </View>

        {loadingAppts && <ActivityIndicator color={PRIMARY} style={{ marginTop: 32 }} />}

        {!loadingAppts && appointments.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No appointments yet</Text>
            <Text style={styles.emptySubtitle}>Book an appointment to receive prescriptions from your doctor.</Text>
          </View>
        )}

        {appointments.map(a => {
          const sc = statusColor(a.status);
          return (
            <TouchableOpacity
              key={a.id}
              style={styles.apptCard}
              activeOpacity={0.8}
              onPress={() => { setSelected(a); fetchPerceptions(a.id); }}
            >
              <View style={styles.apptCardLeft}>
                <View style={styles.apptAvatar}>
                  <Text style={styles.apptAvatarText}>{(a.doctor_name || 'D').charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.apptDoctor}>{a.doctor_name}</Text>
                  <Text style={styles.apptDateTime}>{a.date}  {a.time}</Text>
                  {a.description ? <Text style={styles.apptDesc} numberOfLines={1}>{a.description}</Text> : null}
                </View>
              </View>
              <View style={styles.apptCardRight}>
                <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusPillText, { color: sc.text }]}>{a.status}</Text>
                </View>
                <Text style={styles.apptArrow}>›</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },

  // Direct / modal mode
  directHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  backBtnText: { color: PRIMARY, fontWeight: '700', fontSize: 14 },
  directTitle: { fontSize: 20, fontWeight: '800', color: PRIMARY },
  directScroll: { padding: 20, paddingBottom: 40 },

  apptBanner: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  apptBannerDoc: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  apptBannerDate: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 },

  // Prescription cards
  rxCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  rxCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  rxIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
  },
  rxIcon: { fontSize: 22 },
  rxTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  rxDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  rxDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 },
  rxNoteLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  rxNote: { fontSize: 14, color: '#374151', lineHeight: 22 },

  // Standalone tab
  tabScroll: { padding: 20, paddingBottom: 100 },
  tabHeader: { marginBottom: 24 },
  tabTitle: { fontSize: 28, fontWeight: '900', color: PRIMARY, marginBottom: 4 },
  tabSubtitle: { fontSize: 14, color: '#64748B', fontWeight: '500' },

  apptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  apptCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  apptAvatar: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
  },
  apptAvatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 18 },
  apptDoctor: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  apptDateTime: { fontSize: 12, color: '#64748B' },
  apptDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  apptCardRight: { alignItems: 'flex-end', gap: 6 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  apptArrow: { fontSize: 22, color: '#CBD5E1', fontWeight: '300' },

  // Empty state
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
});
