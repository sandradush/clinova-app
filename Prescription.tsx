import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, Share, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIMARY = '#001e3c';
const BASE = 'https://clinic-backend-s2lx.onrender.com';

type Prescription = {
  id: number;
  appointment_id: number;
  title: string;
  note: string;
  created_at: string;
  appointment?: {
    date: string;
    time: string;
    patient_name: string;
    doctor_name: string;
  };
};

type ConsultationSummary = {
  id: number;
  appointment_id: number;
  doctor_name: string;
  diagnosis: string;
  treatment: string;
  recommendations: string;
  follow_up: string;
  notes: string;
  consultation_date: string;
  created_at: string;
};

type Props = {
  appointmentId?: string | number;
  onClose?: () => void;
  userId?: number;
};

export default function Prescription({ appointmentId, onClose, userId }: Props) {
  const standaloneMode = !!userId && !appointmentId;

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [consultations, setConsultations] = useState<ConsultationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationSummary | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'consultations'>('prescriptions');

  // Fetch prescriptions for patient
  const fetchPrescriptions = (patientId: number) => {
    setLoading(true);
    fetch(`${BASE}/api/prescriptions/patient/${patientId}`, {
      headers: { accept: 'application/json' },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setPrescriptions(data);
      })
      .catch(() => Alert.alert('Error', 'Could not load prescriptions'))
      .finally(() => setLoading(false));
  };

  // Fetch consultation summaries for patient
  const fetchConsultations = (patientId: number) => {
    setLoading(true);
    fetch(`${BASE}/api/consultations/patient/${patientId}`, {
      headers: { accept: 'application/json' },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setConsultations(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Load data on mount
  useEffect(() => {
    if (userId) {
      fetchPrescriptions(userId);
      fetchConsultations(userId);
    }
  }, [userId]);

  const openPrescription = (rx: Prescription) => {
    setSelectedPrescription(rx);
    setShowPrescriptionModal(true);
  };

  const closePrescription = () => {
    setShowPrescriptionModal(false);
    setSelectedPrescription(null);
  };

  const openConsultation = (consultation: ConsultationSummary) => {
    setSelectedConsultation(consultation);
    setShowConsultationModal(true);
  };

  const closeConsultation = () => {
    setShowConsultationModal(false);
    setSelectedConsultation(null);
  };

  const handleShareConsultation = async (consultation: ConsultationSummary) => {
    try {
      const message = `Consultation Summary\n\nDoctor: Dr. ${consultation.doctor_name}\nDate: ${consultation.consultation_date?.split('T')[0]}\n\nDiagnosis:\n${consultation.diagnosis}\n\nTreatment:\n${consultation.treatment}\n\nRecommendations:\n${consultation.recommendations}`;
      
      await Share.share({
        message,
        title: 'Consultation Summary',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share consultation');
    }
  };

  const handleDownloadConsultation = (consultation: ConsultationSummary) => {
    Alert.alert('Download', 'Consultation summary saved to your device');
  };

  // Direct / modal mode — show single prescription in detail
  if (!standaloneMode && appointmentId) {
    const rx = prescriptions.find(p => p.appointment_id === Number(appointmentId));
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.directHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.directTitle}>Prescription</Text>
        </View>
        <ScrollView contentContainerStyle={styles.directScroll}>
          {loading && <ActivityIndicator color={PRIMARY} style={{ marginTop: 32 }} />}
          {!loading && !rx && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>💊</Text>
              <Text style={styles.emptyTitle}>No prescription</Text>
              <Text style={styles.emptySubtitle}>No prescription found for this appointment.</Text>
            </View>
          )}
          {rx && (
            <View style={styles.rxDetailCard}>
              <View style={styles.rxDetailHeader}>
                <Text style={styles.rxDetailTitle}>{rx.title}</Text>
                <Text style={styles.rxDetailDate}>{rx.created_at?.split('T')[0]}</Text>
              </View>
              {rx.appointment && (
                <View style={styles.rxDetailAppt}>
                  <Text style={styles.rxDetailApptDoctor}>{rx.appointment.doctor_name}</Text>
                  <Text style={styles.rxDetailApptDate}>{rx.appointment.date?.split('T')[0]} • {rx.appointment.time?.slice(0, 5)}</Text>
                </View>
              )}
              <View style={styles.rxDetailDivider} />
              <Text style={styles.rxDetailNoteLabel}>Details</Text>
              <Text style={styles.rxDetailNote}>{rx.note}</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Standalone tab mode — list all prescriptions and consultations
  return (
    <>
      <SafeAreaView style={styles.safe}>
        <View style={styles.tabHeader}>
          <Text style={styles.tabTitle}>Medical Records</Text>
          <Text style={styles.tabSubtitle}>Prescriptions & Consultation Summaries</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNav}>
          <TouchableOpacity
            style={[styles.tabNavItem, activeTab === 'prescriptions' && styles.tabNavItemActive]}
            onPress={() => setActiveTab('prescriptions')}
          >
            <Text style={[styles.tabNavText, activeTab === 'prescriptions' && styles.tabNavTextActive]}>
              💊 Prescriptions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabNavItem, activeTab === 'consultations' && styles.tabNavItemActive]}
            onPress={() => setActiveTab('consultations')}
          >
            <Text style={[styles.tabNavText, activeTab === 'consultations' && styles.tabNavTextActive]}>
              📋 Consultations
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.tabScroll}>
          {loading && <ActivityIndicator color={PRIMARY} style={{ marginTop: 32 }} />}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <>
              {!loading && prescriptions.length === 0 && (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyIcon}>💊</Text>
                  <Text style={styles.emptyTitle}>No prescriptions yet</Text>
                  <Text style={styles.emptySubtitle}>Prescriptions from your consultations will appear here.</Text>
                </View>
              )}

              {prescriptions.map(rx => (
                <TouchableOpacity
                  key={rx.id}
                  style={styles.rxListCard}
                  activeOpacity={0.8}
                  onPress={() => openPrescription(rx)}
                >
                  <View style={styles.rxListLeft}>
                    <View style={styles.rxListIcon}>
                      <Text style={styles.rxListIconText}>💊</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rxListTitle}>{rx.title}</Text>
                      {rx.appointment && (
                        <>
                          <Text style={styles.rxListDoctor}>{rx.appointment.doctor_name}</Text>
                          <Text style={styles.rxListDate}>{rx.created_at?.split('T')[0]}</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <Text style={styles.rxListArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Consultations Tab */}
          {activeTab === 'consultations' && (
            <>
              {!loading && consultations.length === 0 && (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyTitle}>No consultation summaries yet</Text>
                  <Text style={styles.emptySubtitle}>Consultation summaries from your doctor will appear here.</Text>
                </View>
              )}

              {consultations.map(consultation => (
                <TouchableOpacity
                  key={consultation.id}
                  style={styles.consultationCard}
                  activeOpacity={0.8}
                  onPress={() => openConsultation(consultation)}
                >
                  <View style={styles.consultationLeft}>
                    <View style={styles.consultationIcon}>
                      <Text style={styles.consultationIconText}>📋</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.consultationTitle}>Dr. {consultation.doctor_name}</Text>
                      <Text style={styles.consultationDate}>{consultation.consultation_date?.split('T')[0]}</Text>
                      <Text style={styles.consultationPreview} numberOfLines={1}>
                        {consultation.diagnosis}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.consultationArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Prescription Detail Modal */}
      <Modal visible={showPrescriptionModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closePrescription} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Prescription Details</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            {selectedPrescription && (
              <View style={styles.rxDetailCard}>
                <View style={styles.rxDetailHeader}>
                  <Text style={styles.rxDetailTitle}>{selectedPrescription.title}</Text>
                  <Text style={styles.rxDetailDate}>{selectedPrescription.created_at?.split('T')[0]}</Text>
                </View>
                {selectedPrescription.appointment && (
                  <View style={styles.rxDetailAppt}>
                    <Text style={styles.rxDetailApptDoctor}>{selectedPrescription.appointment.doctor_name}</Text>
                    <Text style={styles.rxDetailApptDate}>{selectedPrescription.appointment.date?.split('T')[0]} • {selectedPrescription.appointment.time?.slice(0, 5)}</Text>
                  </View>
                )}
                <View style={styles.rxDetailDivider} />
                <Text style={styles.rxDetailNoteLabel}>Details</Text>
                <Text style={styles.rxDetailNote}>{selectedPrescription.note}</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Consultation Detail Modal */}
      <Modal visible={showConsultationModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeConsultation} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Consultation Summary</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            {selectedConsultation && (
              <View style={styles.consultationDetailCard}>
                <View style={styles.consultationDetailHeader}>
                  <Text style={styles.consultationDetailTitle}>Dr. {selectedConsultation.doctor_name}</Text>
                  <Text style={styles.consultationDetailDate}>{selectedConsultation.consultation_date?.split('T')[0]}</Text>
                </View>

                {selectedConsultation.diagnosis && (
                  <View style={styles.consultationSection}>
                    <Text style={styles.consultationSectionTitle}>Diagnosis</Text>
                    <Text style={styles.consultationSectionContent}>{selectedConsultation.diagnosis}</Text>
                  </View>
                )}

                {selectedConsultation.treatment && (
                  <View style={styles.consultationSection}>
                    <Text style={styles.consultationSectionTitle}>Treatment</Text>
                    <Text style={styles.consultationSectionContent}>{selectedConsultation.treatment}</Text>
                  </View>
                )}

                {selectedConsultation.recommendations && (
                  <View style={styles.consultationSection}>
                    <Text style={styles.consultationSectionTitle}>Recommendations</Text>
                    <Text style={styles.consultationSectionContent}>{selectedConsultation.recommendations}</Text>
                  </View>
                )}

                {selectedConsultation.follow_up && (
                  <View style={styles.consultationSection}>
                    <Text style={styles.consultationSectionTitle}>Follow-up</Text>
                    <Text style={styles.consultationSectionContent}>{selectedConsultation.follow_up}</Text>
                  </View>
                )}

                {selectedConsultation.notes && (
                  <View style={styles.consultationSection}>
                    <Text style={styles.consultationSectionTitle}>Additional Notes</Text>
                    <Text style={styles.consultationSectionContent}>{selectedConsultation.notes}</Text>
                  </View>
                )}

                <View style={styles.consultationActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDownloadConsultation(selectedConsultation)}
                  >
                    <Text style={styles.actionButtonText}>📥 Download</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonSecondary]}
                    onPress={() => handleShareConsultation(selectedConsultation)}
                  >
                    <Text style={styles.actionButtonTextSecondary}>📤 Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },

  // Tab mode header
  tabHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  tabTitle: { fontSize: 28, fontWeight: '900', color: PRIMARY, marginBottom: 4 },
  tabSubtitle: { fontSize: 14, color: '#64748B', fontWeight: '500' },

  // Tab Navigation
  tabNav: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tabNavItem: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  tabNavItemActive: {
    backgroundColor: PRIMARY,
  },
  tabNavText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabNavTextActive: {
    color: '#FFFFFF',
  },

  tabScroll: { padding: 20, paddingBottom: 100 },

  // Prescription list card
  rxListCard: {
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
  rxListLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  rxListIcon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
  },
  rxListIconText: { fontSize: 22 },
  rxListTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  rxListDoctor: { fontSize: 12, color: '#64748B' },
  rxListDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  rxListArrow: { fontSize: 22, color: '#CBD5E1', fontWeight: '300' },

  // Consultation card
  consultationCard: {
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
  consultationLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  consultationIcon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: '#F0F9FF',
    alignItems: 'center', justifyContent: 'center',
  },
  consultationIconText: { fontSize: 22 },
  consultationTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  consultationDate: { fontSize: 12, color: '#64748B' },
  consultationPreview: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  consultationArrow: { fontSize: 22, color: '#CBD5E1', fontWeight: '300' },

  // Direct header (modal mode)
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
  directTitle: { fontSize: 20, fontWeight: '800', color: PRIMARY },
  directScroll: { padding: 20, paddingBottom: 40 },

  // Modal header
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: PRIMARY },
  modalScroll: { padding: 20, paddingBottom: 40 },

  // Back button
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  backBtnText: { color: PRIMARY, fontWeight: '700', fontSize: 14 },

  // Prescription detail card
  rxDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  rxDetailHeader: { marginBottom: 16 },
  rxDetailTitle: { fontSize: 20, fontWeight: '800', color: PRIMARY, marginBottom: 4 },
  rxDetailDate: { fontSize: 12, color: '#94A3B8' },

  rxDetailAppt: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY,
  },
  rxDetailApptDoctor: { fontSize: 14, fontWeight: '700', color: PRIMARY, marginBottom: 2 },
  rxDetailApptDate: { fontSize: 12, color: '#64748B' },

  rxDetailDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },
  rxDetailNoteLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  rxDetailNote: { fontSize: 14, color: '#374151', lineHeight: 22, fontFamily: 'monospace' },

  // Consultation detail card
  consultationDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  consultationDetailHeader: { marginBottom: 20 },
  consultationDetailTitle: { fontSize: 20, fontWeight: '800', color: PRIMARY, marginBottom: 4 },
  consultationDetailDate: { fontSize: 12, color: '#94A3B8' },

  consultationSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  consultationSectionTitle: { fontSize: 13, fontWeight: '700', color: PRIMARY, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  consultationSectionContent: { fontSize: 14, color: '#374151', lineHeight: 22 },

  consultationActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: '#F1F5F9',
  },
  actionButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  actionButtonTextSecondary: { color: PRIMARY, fontWeight: '700', fontSize: 14 },

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
