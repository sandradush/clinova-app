import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Platform, Alert, ScrollView } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context/lib/commonjs/SafeAreaView';
import Chat from './Chat';
import Prescription from './Prescription';
import VideoCall from './VideoCall';
import VoiceCall from './VoiceCall';

type AppointmentItem = {
  id: string;
  title: string;
  datetime: string;
  description: string;
  status: 'pending' | 'confirmed' | 'cancelled' | string;
  doctor_id?: string | number | null;
};

export default function Appointment({ userId }: { userId?: number }) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([
    {
      id: '1',
      title: 'Dr. Emily Carter',
      datetime: 'Tomorrow • 10:30 AM',
      description: 'Video call — 20 minutes',
      status: 'confirmed',
      doctor_id: '33',
    },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [dateValue, setDateValue] = useState(new Date());
  const [timeValue, setTimeValue] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const formatAppointmentDateTime = (rawDate?: string, rawTime?: string) => {
    const formattedDate = rawDate ? rawDate.split('T')[0] : 'Unknown date';
    const formattedTime = rawTime ? rawTime.slice(0, 8) : 'Unknown time';
    return `${formattedDate} • ${formattedTime}`;
  };

  const formatDate = (value: Date) => value.toISOString().split('T')[0];
  const formatTime = (value: Date) => value.toISOString().split('T')[1];

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed' || !selected) return;
    setDateValue(selected);
    setDate(formatDate(selected));
  };

  const handleTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowTimePicker(false);
    }
    if (event.type === 'dismissed' || !selected) return;
    setTimeValue(selected);
    setTime(formatTime(selected));
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!userId) return;
      setLoadingAppointments(true);
      try {
        const response = await fetch(`https://clinic-backend-s2lx.onrender.com/api/appointments/patient/${userId}`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
          },
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          const items: AppointmentItem[] = data.map(item => ({
            id: String(item.id),
            title: item.doctor_name || 'Doctor pending',
            datetime: formatAppointmentDateTime(item.date, item.time),
            description: item.description || '',
            status: item.status || 'pending',
            doctor_id: item.doctor_id || item.doctor?.id || item.doctorId || null,
          }));
          setAppointments(items);
        } else {
          Alert.alert('Error', data?.message || 'Failed to load appointments');
        }
      } catch (error) {
        Alert.alert('Error', 'Network error. Please try again.');
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, [userId]);

  const handleAdd = async () => {
    if (!date || !time || !description) {
      Alert.alert('Error', 'Please fill in date, time, and description');
      return;
    }
    if (!userId) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    const normalizedTime = time.trim().endsWith('Z') ? time.trim() : `${time.trim()}Z`;

    try {
      const response = await fetch('https://clinic-backend-s2lx.onrender.com/api/appointments/t', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: userId,
          date,
          time: normalizedTime,
          description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const responseDate = typeof data.date === 'string' ? data.date.split('T')[0] : date;
        const responseTime = typeof data.time === 'string' ? data.time.slice(0, 8) : time;
        const item: AppointmentItem = { 
          id: String(data.id), 
          title: data.doctor_name || 'Doctor pending',
          datetime: formatAppointmentDateTime(responseDate, responseTime),
          description: data.description || description,
          status: data.status || 'pending',
        };
        setAppointments(prev => [item, ...prev]);
        setShowAdd(false);
        setDate(''); setTime(''); setDescription('');
        setDateValue(new Date());
        setTimeValue(new Date());
        Alert.alert('Success', 'Appointment created successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to create appointment');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };
  const [videoTarget, setVideoTarget] = useState<AppointmentItem | null>(null);
  const [voiceTarget, setVoiceTarget] = useState<AppointmentItem | null>(null);
  const [chatTarget, setChatTarget] = useState<AppointmentItem | null>(null);
  const [perceptionTarget, setPerceptionTarget] = useState<AppointmentItem | null>(null);

  const startVideo = (a: AppointmentItem) => setVideoTarget(a);
  const startVoice = (a: AppointmentItem) => setVoiceTarget(a);
  const startChat = (a: AppointmentItem) => setChatTarget(a);
  const openPerceptions = (a: AppointmentItem) => setPerceptionTarget(a);

  return (
    <RNSSafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Appointments</Text>
        </View>

        {loadingAppointments ? (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </View>
        ) : null}

        {appointments.map(a => (
          <View key={a.id} style={styles.appCard}>
            <View style={styles.appHeader}>
              <View style={styles.doctorInfo}>
                <View style={styles.doctorAvatar}>
                  <Text style={styles.doctorInitial}>{a.title.split(' ')[1]?.charAt(0) || 'D'}</Text>
                </View>
                <View style={styles.appDetails}>
                  <Text style={styles.appTitle}>{a.title}</Text>
                  <Text style={styles.appTime}>{a.datetime}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      a.status === 'confirmed'
                        ? styles.statusConfirmed
                        : a.status === 'cancelled'
                        ? styles.statusCancelled
                        : styles.statusPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        a.status === 'confirmed'
                          ? styles.statusConfirmedText
                          : a.status === 'cancelled'
                          ? styles.statusCancelledText
                          : styles.statusPendingText,
                      ]}
                    >
                      {a.status}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.moreButton}>
                <Text style={styles.moreIcon}>⋮</Text>
              </TouchableOpacity>
            </View>
            
            {a.description ? (
              <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>Description:</Text>
                <Text style={styles.appNote}>{a.description}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.perceptionLink} onPress={() => openPerceptions(a)}>
              <Text style={styles.perceptionLinkText}>View perceptions</Text>
            </TouchableOpacity>
            
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.primaryAction]} 
                onPress={() => startVideo(a)}
              >
                
                <Text style={styles.actionText}>Video call</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.secondaryAction]} 
                onPress={() => startVoice(a)}
              >
                
                <Text style={styles.actionText}>Voice call</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.tertiaryAction]} 
                onPress={() => startChat(a)}
              >
                
                <Text style={styles.actionText}>Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)} activeOpacity={0.9}>
          <Text style={styles.addIcon}>+</Text>
          <Text style={styles.addBtnText}>Schedule Appointment</Text>
        </TouchableOpacity>

        <Modal visible={showAdd} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>New appointment</Text>
              <TouchableOpacity style={styles.pickerField} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                <Text style={styles.pickerLabel}>Date</Text>
                <Text style={date ? styles.pickerValue : styles.pickerPlaceholder}>
                  {date || 'Pick a date'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerField} onPress={() => setShowTimePicker(true)} activeOpacity={0.8}>
                <Text style={styles.pickerLabel}>Time</Text>
                <Text style={time ? styles.pickerValue : styles.pickerPlaceholder}>
                  {time || 'Pick a time'}
                </Text>
              </TouchableOpacity>
              {showDatePicker ? (
                <DateTimePicker
                  value={dateValue}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                />
              ) : null}
              {showTimePicker ? (
                <DateTimePicker
                  value={timeValue}
                  mode="time"
                  is24Hour
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                />
              ) : null}
              <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={[styles.input, { height: 100 }]} multiline />

              <View style={styles.modalRow}>
                <TouchableOpacity onPress={() => setShowAdd(false)} style={[styles.modalBtn, styles.modalCancel]}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAdd} style={[styles.modalBtn, styles.modalSave]}>
                  <Text style={styles.modalSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Chat / Call full-screen flows */}
        <Modal visible={!!chatTarget} animationType="slide">
          {chatTarget ? (
            <Chat
              name={chatTarget.title}
              patientId={userId ?? ''}
              doctorId={chatTarget.doctor_id ?? ''}
              onClose={() => setChatTarget(null)}
            />
          ) : null}
        </Modal>

        <Modal visible={!!videoTarget} animationType="slide">
          {videoTarget ? (
            <VideoCall
              name={videoTarget.title}
              patientId={userId ?? ''}
              doctorId={videoTarget.doctor_id ?? ''}
              onEnd={() => setVideoTarget(null)}
            />
          ) : null}
        </Modal>

        <Modal visible={!!voiceTarget} animationType="slide">
          {voiceTarget ? <VoiceCall name={voiceTarget.title} onEnd={() => setVoiceTarget(null)} /> : null}
        </Modal>

        <Modal visible={!!perceptionTarget} animationType="slide">
          {perceptionTarget ? (
            <Prescription appointmentId={perceptionTarget.id} onClose={() => setPerceptionTarget(null)} />
          ) : null}
        </Modal>
      </ScrollView>
    </RNSSafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F0F9FF' 
  },
  container: { 
    padding: 16, 
    paddingBottom: 120 
  },
  header: {
    marginBottom: 20,
  },
  pageTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#1E293B',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  appCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  doctorInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0b3d91',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  doctorInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  appDetails: {
    flex: 1,
  },
  appTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1E293B',
    marginBottom: 2,
  },
  appTime: { 
    color: '#64748B', 
    fontSize: 12,
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusConfirmed: {
    backgroundColor: '#EEF2FF',
  },
  statusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusPendingText: {
    color: '#B45309',
  },
  statusConfirmedText: {
    color: '#0b3d91',
  },
  statusCancelledText: {
    color: '#B91C1C',
  },
  moreButton: {
    padding: 4,
  },
  moreIcon: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  noteContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  appNote: { 
    color: '#374151', 
    fontSize: 14,
    lineHeight: 20,
  },
  perceptionLink: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    marginBottom: 10,
  },
  perceptionLinkText: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: { 
    flexDirection: 'row', 
    gap: 8,
  },
  actionBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  primaryAction: { 
    backgroundColor: '#0b3d91',
  },
  secondaryAction: { 
    backgroundColor: '#0F172A',
  },
  tertiaryAction: { 
    backgroundColor: '#3B82F6',
  },
  actionIcon: {
    fontSize: 14,
    marginBottom: 2,
  },
  actionText: { 
    color: '#FFFFFF', 
    fontWeight: '600',
    fontSize: 12,
  },
  addBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b3d91', 
    paddingVertical: 10, 
    borderRadius: 10,
    shadowColor: '#0b3d91',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  addIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 8,
    fontWeight: '700',
  },
  addBtnText: { 
    color: '#FFFFFF', 
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalCard: { 
    width: '92%', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 24 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: { 
    borderWidth: 2, 
    borderColor: '#E2E8F0', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: Platform.OS === 'ios' ? 12 : 10, 
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#FAFBFC',
  },
  pickerField: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#FAFBFC',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pickerValue: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  modalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 20,
    gap: 12,
  },
  modalBtn: { 
    flex: 1, 
    paddingVertical: 14, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  modalCancel: { 
    backgroundColor: '#F1F5F9',
  },
  modalSave: { 
    backgroundColor: '#0b3d91',
  },
  modalCancelText: { 
    color: '#64748B',
    fontWeight: '600',
  },
  modalSaveText: { 
    color: '#FFFFFF', 
    fontWeight: '700' 
  },
});
