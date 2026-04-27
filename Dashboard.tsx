import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, ActivityIndicator, FlatList, Pressable, ScrollView } from 'react-native';
import Settings from './Settings';
import Profile from './Profile';
import { useLang } from './i18n';
import Appointment from './Appointment';
import Prescription from './Prescription';
import MedicalRecord from './MedicalRecord';

type Props = {
  email: string;
  onLogout: () => void;
  name?: string;
  avatarUri?: string;
  userId?: number;
  onProfileSave?: (p: any)=>void;
  userPatient?: any;
  onOpenPayment?: (appt: any) => void;
};

export default function Dashboard(props: Props) {
  const { email, onLogout, name, avatarUri, userId, onProfileSave, userPatient, onOpenPayment } = props;
  const { t } = useLang();
  const [tab, setTab] = useState<'home' | 'appointment' | 'setting' | 'profile' | 'prescription' | 'medical'>('home');
  const [appointmentStats, setAppointmentStats] = useState({ total: 0, today: 0, pending: 0 });
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [nextAppointment, setNextAppointment] = useState<any | null>(null);
  const [profileImage, setProfileImage] = useState<string | undefined>(avatarUri);
  const displayName = name || (email ? email.split('@')[0] : 'User');
  const avatar = profileImage || `https://i.pravatar.cc/150?u=${encodeURIComponent(email || 'anon')}`;

  const fetchProfileImage = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`https://clinic-backend-s2lx.onrender.com/api/auth/profile-image/preview?user_id=${userId}`, {
        method: 'GET',
        headers: { accept: 'application/json' },
      });
      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      if (response.ok && data?.preview_url) {
        setProfileImage(data.preview_url);
      } else if (response.status === 404) {
        setProfileImage(undefined);
      }
    } catch (error) {
      console.warn('Failed to fetch profile image:', error);
    }
  };

  const prevAppointmentsRef = useRef<any[]>([]);

  const fetchAppointmentStats = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`https://clinic-backend-s2lx.onrender.com/api/appointments/patient/${userId}/stats`, {
        method: 'GET',
        headers: { accept: 'application/json' },
      });
      const data = await response.json();
      if (response.ok && data) {
        setAppointmentStats({ total: data.total || 0, today: data.today || 0, pending: data.pending || 0 });
        if (data.lastAppointment) {
          setNextAppointment(data.lastAppointment);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch appointment stats:', error);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchAppointmentStats();
    fetchProfileImage();
    const interval = setInterval(fetchAppointmentStats, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [showNotifDetail, setShowNotifDetail] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = async () => {
    if (!userId) return;
    setNotifLoading(true);
    try {
      const resp = await fetch(
        `https://clinic-backend-s2lx.onrender.com/api/notifications/user/${userId}`,
        { method: 'GET', headers: { accept: 'application/json' } }
      );
      const data = await resp.json();
      if (resp.ok && Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (e) {}
    finally { setNotifLoading(false); }
  };

  const closeNotifications = () => setNotifOpen(false);

  const openNotifications = async () => {
    setNotifOpen(true);
    await fetchNotifications();
  };

  const openNotificationDetail = (notif: any) => {
    setSelectedNotif(notif);
    setShowNotifDetail(true);
    if (!notif.is_read) {
      markNotificationAsRead(notif.id || notif.notification_id);
    }
  };

  const closeNotificationDetail = () => {
    setShowNotifDetail(false);
    setSelectedNotif(null);
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await fetch(
        `https://clinic-backend-s2lx.onrender.com/api/notifications/${notificationId}/read`,
        { method: 'PUT', headers: { accept: 'application/json' } }
      );
      setNotifications(prev =>
        prev.map(n => n.id === notificationId || n.notification_id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (e) {}
  };

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    fetchAppointmentStats();
    fetchProfileImage();
  }, [userId]);

  return (
    <RNSSafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={styles.container}>
        {tab === 'home' && (
          <>
            <View style={styles.headerCard}>
              <View style={styles.header}>
                <View style={styles.profileRow}>
                  <TouchableOpacity onPress={() => setTab('profile')}>
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                  </TouchableOpacity>
                  <View style={styles.nameBlock}>
                    <Text style={styles.sub}>{displayName}</Text>
                    <View style={styles.statusBadge}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>Online</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.notifBell} onPress={openNotifications}>
                  <Text style={styles.notifBellIcon}>🔔</Text>
                  {unreadCount > 0 && (
                    <View style={styles.notifBadge}>
                      <Text style={styles.notifBadgeText}>{unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{appointmentStats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{appointmentStats.today}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{appointmentStats.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          </>
        )}

        <View style={styles.content}>
          {tab === 'home' && (
            <>
              <Text style={styles.sectionTitle}>Last Appointment</Text>
                {nextAppointment ? (
                  <View style={styles.msg}>
                    <Text style={styles.msgTitle}>{nextAppointment.doctor_name || nextAppointment.title || 'Upcoming appointment'}</Text>
                    <Text style={styles.msgSub}>{(() => {
                      try {
                        const dateOnly = (nextAppointment.date || '').split('T')[0];
                        const timeOnly = nextAppointment.time || '';
                        const dt = new Date(`${dateOnly}T${timeOnly}Z`);
                        return dt.toLocaleDateString() + ' • ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + (nextAppointment.description ? ' — ' + nextAppointment.description : '');
                      } catch (e) { return (nextAppointment.description || '') }
                    })()}</Text>
                  </View>
                ) : (
                  <View style={styles.msg}>
                    <Text style={styles.msgTitle}>No upcoming appointments</Text>
                    <Text style={styles.msgSub}>You have no scheduled appointments.</Text>
                  </View>
                )}
            </>
          )}
          {tab === 'appointment' && <Appointment userId={userId} onBack={() => setTab('home')} />}
          {tab === 'medical' && <MedicalRecord userId={userId} onBack={() => setTab('home')} />}
          {tab === 'prescription' && <Prescription onClose={() => setTab('home')} userId={userId} />}
          {tab === 'setting' && <Settings email={email} onLogout={onLogout} onBack={() => setTab('home')} userId={userId} />}
          {tab === 'profile' && <Profile name={name} email={email} avatarUri={profileImage} userId={userId} patient={userPatient} onBack={() => setTab('home')} onLogout={onLogout} onSave={(p:any)=>{ if (onProfileSave) onProfileSave(p); fetchProfileImage?.(); }} />}
        </View>

        <Modal visible={notifOpen} animationType="slide" onRequestClose={closeNotifications} transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🔔 Notifications</Text>
                <Pressable onPress={closeNotifications} style={styles.modalClose}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>
              {notifLoading ? (
                <View style={{ padding: 32, alignItems: 'center' }}>
                  <ActivityIndicator color="#001e3c" />
                  <Text style={{ color: '#64748B', marginTop: 10, fontSize: 13 }}>Loading...</Text>
                </View>
              ) : (
                <FlatList
                  data={notifications}
                  keyExtractor={(item, idx) => String(item.id || item.notification_id || idx)}
                  contentContainerStyle={{ paddingBottom: 12 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => openNotificationDetail(item)}
                      style={[styles.notifItem, !item.is_read && styles.notifItemUnread]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.notifRow}>
                        <View style={styles.notifDotWrap}>
                          {!item.is_read && <View style={styles.notifUnreadDot} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.notifTitle}>
                            {item.title || item.message || item.content || 'Notification'}
                          </Text>
                          {item.sent_by && (
                            <Text style={styles.notifSentBy}>From: {item.sent_by}</Text>
                          )}
                          <Text style={styles.notifTime}>
                            {item.created_at
                              ? new Date(item.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : item.time || ''}
                          </Text>
                        </View>
                        <View style={[styles.notifReadPill, item.is_read && styles.notifReadPillRead]}>
                          <Text style={[styles.notifReadText, item.is_read && styles.notifReadTextRead]}>
                            {item.is_read ? 'Read' : 'New'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                      <Text style={{ fontSize: 36, marginBottom: 12 }}>🔕</Text>
                      <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: '600' }}>No notifications yet</Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={showNotifDetail} animationType="slide" onRequestClose={closeNotificationDetail} transparent>
          <View style={styles.notifDetailOverlay}>
            <View style={styles.notifDetailCard}>
              <View style={styles.notifDetailHeader}>
                <TouchableOpacity onPress={closeNotificationDetail} style={styles.notifDetailClose}>
                  <Text style={styles.notifDetailCloseText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.notifDetailTitle}>Notification</Text>
                <View style={{ width: 40 }} />
              </View>
              <ScrollView contentContainerStyle={styles.notifDetailContent}>
                {selectedNotif && (
                  <>
                    <View style={styles.notifDetailBadge}>
                      <Text style={styles.notifDetailBadgeText}>{selectedNotif.is_read ? '✓ Read' : '● New'}</Text>
                    </View>
                    <Text style={styles.notifDetailMainTitle}>{selectedNotif.title || selectedNotif.message || 'Notification'}</Text>
                    {selectedNotif.sent_by && (
                      <Text style={styles.notifDetailFrom}>From: {selectedNotif.sent_by}</Text>
                    )}
                    <Text style={styles.notifDetailTime}>
                      {selectedNotif.created_at
                        ? new Date(selectedNotif.created_at).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : selectedNotif.time || ''}
                    </Text>
                    <View style={styles.notifDetailDivider} />
                    <Text style={styles.notifDetailBody}>{selectedNotif.description || selectedNotif.body || selectedNotif.content || 'No additional details'}</Text>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <View style={styles.navBar}>
          {[
            { key: 'home',         label: t.home },
            { key: 'appointment',  label: t.appointments },
            { key: 'medical',      label: 'Medical' },
            { key: 'prescription', label: t.prescription },
            { key: 'setting',      label: t.settings },
          ].map(item => {
            const active = tab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.navItem}
                onPress={() => setTab(item.key as any)}
                activeOpacity={0.7}
              >
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
                {active && <View style={styles.navDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </RNSSafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F9FF' },
  container: { flex: 1, padding: 16 },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#001e3c', marginRight: 16, borderWidth: 3, borderColor: '#FFFFFF', shadowColor: '#001e3c', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  nameBlock: { flex: 1 },
  sub: { color: '#64748B', fontSize: 14, marginBottom: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#001e3c', marginRight: 6 },
  statusText: { color: '#001e3c', fontSize: 12, fontWeight: '600' },
  notifBell: { position: 'relative', padding: 8 },
  notifBellIcon: { fontSize: 20 },
  notifBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#EF4444', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  notifBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  notifItem: { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  notifItemUnread: { backgroundColor: '#F8FAFF' },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  notifDotWrap: { width: 10, paddingTop: 5 },
  notifUnreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#001e3c' },
  notifTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 3 },
  notifSentBy: { fontSize: 12, color: '#001e3c', fontWeight: '600', marginBottom: 2 },
  notifTime: { fontSize: 11, color: '#94A3B8' },
  notifReadPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: '#DBEAFE', alignSelf: 'flex-start' },
  notifReadPillRead: { backgroundColor: '#F1F5F9' },
  notifReadText: { fontSize: 10, fontWeight: '700', color: '#001e3c' },
  notifReadTextRead: { color: '#94A3B8' },
  statsCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 12, justifyContent: 'space-around', shadowColor: '#1E293B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  statDivider: { width: 1, backgroundColor: '#E2E8F0' },
  content: { flex: 1, paddingBottom: 90 },
  navBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: '#001e3c', paddingTop: 10, paddingBottom: 18, paddingHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 16 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textAlign: 'center' },
  navLabelActive: { color: '#FFFFFF', fontWeight: '700' },
  navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF', marginTop: 3 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  msg: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#001e3c', shadowColor: '#1E293B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  msgTitle: { fontWeight: '700', color: '#1E293B', fontSize: 14 },
  msgSub: { color: '#64748B', marginTop: 4, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 12, maxHeight: '80%', padding: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  modalClose: { padding: 6 },
  modalCloseText: { color: '#041430', fontWeight: '700' },
  notifDetailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  notifDetailCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingTop: 12 },
  notifDetailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  notifDetailClose: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', borderRadius: 10 },
  notifDetailCloseText: { fontSize: 18, color: '#64748B', fontWeight: '700' },
  notifDetailTitle: { fontSize: 18, fontWeight: '800', color: '#001e3c' },
  notifDetailContent: { padding: 20, paddingBottom: 40 },
  notifDetailBadge: { alignSelf: 'flex-start', backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  notifDetailBadgeText: { fontSize: 12, fontWeight: '700', color: '#001e3c' },
  notifDetailMainTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 8, lineHeight: 28 },
  notifDetailFrom: { fontSize: 13, fontWeight: '600', color: '#001e3c', marginBottom: 4 },
  notifDetailTime: { fontSize: 12, color: '#94A3B8', marginBottom: 16 },
  notifDetailDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },
  notifDetailBody: { fontSize: 15, color: '#374151', lineHeight: 24 },
});
