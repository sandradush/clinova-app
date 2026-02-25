import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context/lib/commonjs/SafeAreaView';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, ActivityIndicator, FlatList, Pressable, ScrollView } from 'react-native';
import Settings from './Settings';
import Profile from './Profile';
import Appointment from './Appointment';

type Props = {
  email: string;
  onLogout: () => void;
  name?: string;
  avatarUri?: string;
  userId?: number;
  onProfileSave?: (p: any)=>void;
  userPatient?: any;
};

export default function Dashboard({ email, onLogout, name, avatarUri, userId, onProfileSave, userPatient }: Props) {
  const [tab, setTab] = useState<'home' | 'appointments' | 'settings' | 'profile'>('home');
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
      const data = await response.json();
      if (response.ok && data?.preview_url) {
        setProfileImage(data.preview_url);
      }
    } catch (error) {
      console.warn('Failed to fetch profile image:', error);
    }
  };

  // keep previous appointments for change detection
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
        // server returns { total, today, pending, lastAppointment }
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

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    if (!userId) return;
    setNotifLoading(true);
    try {
      const resp = await fetch(`https://clinic-backend-s2lx.onrender.com/api/notifications/user/${userId}`, { method: 'GET', headers: { accept: 'application/json' } });
      const data = await resp.json();
      if (resp.ok && Array.isArray(data)) {
        // merge server notifications with local ones (avoid duplicates)
        setNotifications(prev => {
          const byId = new Map<string, any>();
          data.forEach((d: any) => byId.set(String(d.id), d));
          prev.forEach((p: any) => { if (!byId.has(String(p.id))) byId.set(String(p.id), p); });
          return Array.from(byId.values());
        });
      } else {
        setNotifications(prev => prev);
      }
    } catch (e) {
      // ignore network errors, keep existing
    } finally {
      setNotifLoading(false);
    }
  };

  const openNotifications = async () => {
    setNotifOpen(true);
    await fetchNotifications();
    // mark all as read locally and best-effort on server
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      if (userId) await fetch(`https://clinic-backend-s2lx.onrender.com/api/notifications/mark-read`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId }) });
    } catch (e) {
      // ignore
    }
  };

  const closeNotifications = () => setNotifOpen(false);

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
                    <Text style={styles.sub}>{email}</Text>
                    <View style={styles.statusBadge}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>Online</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.notificationBtn} onPress={openNotifications} accessibilityLabel="Notifications">
                  <Text style={styles.notificationIcon}>🔔</Text>
                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
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

           

            {/* Quick Actions removed for patient-focused layout */}
          </>
        )}

        <View style={styles.content}>
          {tab === 'home' && (
            <>
              <Text style={styles.sectionTitle}>lastAppointmenty</Text>
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
          {tab === 'appointments' && <Appointment userId={userId} />}
          {tab === 'settings' && <Settings email={email} onLogout={onLogout} />}
          {tab === 'profile' && <Profile name={name} email={email} avatarUri={profileImage} userId={userId} patient={userPatient} onBack={() => setTab('home')} onLogout={onLogout} onSave={(p:any)=>{ if (onProfileSave) onProfileSave(p); fetchProfileImage?.(); }} />}
        </View>

        <Modal visible={notifOpen} animationType="slide" onRequestClose={closeNotifications} transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Notifications</Text>
                <Pressable onPress={closeNotifications} style={styles.modalClose}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </Pressable>
              </View>
              {notifLoading ? (
                <View style={{ padding: 20 }}>
                  <ActivityIndicator />
                </View>
              ) : (
                <FlatList
                  data={notifications}
                  keyExtractor={(i, idx) => String(i.id || idx)}
                  renderItem={({ item }) => (
                    <View style={styles.notifItem}>
                      <Text style={styles.notifTitle}>{item.title || item.message || 'Notification'}</Text>
                      <Text style={styles.notifTime}>{item.time || item.created_at || ''}</Text>
                    </View>
                  )}
                  ListEmptyComponent={<Text style={styles.emptyText}>No notifications</Text>}
                />
              )}
            </View>
          </View>
        </Modal>

        <View style={styles.bottomMenu}>
          <TouchableOpacity style={[styles.tab, tab === 'home' && styles.tabActive]} onPress={() => setTab('home')}>
            
            <Text style={[styles.tabLabel, tab === 'home' && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'appointments' && styles.tabActive]} onPress={() => setTab('appointments')}>

            <Text style={[styles.tabLabel, tab === 'appointments' && styles.tabLabelActive]}>Appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'settings' && styles.tabActive]} onPress={() => setTab('settings')}>
            
            <Text style={[styles.tabLabel, tab === 'settings' && styles.tabLabelActive]}>Settings</Text>
          </TouchableOpacity>
        </View>
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
    flex: 1, 
    padding: 16 
  },
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
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  profileRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1,
  },
  avatar: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#0b3d91', 
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#0b3d91',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  nameBlock: {
    flex: 1,
  },
  name: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#1E293B',
    marginBottom: 4,
  },
  sub: { 
    color: '#64748B', 
    fontSize: 14,
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0b3d91',
    marginRight: 6,
  },
  statusText: {
    color: '#0b3d91',
    fontSize: 12,
    fontWeight: '600',
  },
  notificationBtn: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    justifyContent: 'space-around',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  cardsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: 12,
  },
  card: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    padding: 12, 
    borderRadius: 12, 
    alignItems: 'center', 
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  waitingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#0b3d91',
  },
  completedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardIconText: {
    fontSize: 16,
  },
  cardTitle: { 
    color: '#64748B', 
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardCount: { 
    fontSize: 24, 
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    width: '22%',
    minWidth: 60,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  quickActionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionIconText: {
    fontSize: 16,
  },
  quickActionText: {
    color: '#374151',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: { 
    flex: 1,
    paddingBottom: 100, // Space for bottom navigation
  },
  bottomMenu: {
    position: 'absolute',
    left: 5,
    right: 5,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  tab: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderRadius: 12,
    marginHorizontal: 4,
  },
  tabActive: { 
    backgroundColor: '#0b3d91',
  },
  icon: { 
    fontSize: 20,
    marginBottom: 4,
  },
  iconActive: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: { 
    fontSize: 11, 
    color: '#64748B',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1E293B', 
    marginBottom: 12 
  },
  appCard: { 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 12, 
    shadowColor: '#1E293B', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 4,
    marginBottom: 16,
  },
  appTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1E293B' 
  },
  appTime: { 
    marginTop: 6, 
    color: '#64748B',
    fontSize: 14,
  },
  appNote: { 
    marginTop: 6, 
    color: '#94A3B8', 
    fontSize: 12 
  },
  messages: { 
    gap: 8,
  },
  msg: { 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0b3d91',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  msgTitle: { 
    fontWeight: '700', 
    color: '#1E293B',
    fontSize: 14,
  },
  msgSub: { 
    color: '#64748B', 
    marginTop: 4,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: '80%',
    padding: 12,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  modalClose: { padding: 6 },
  modalCloseText: { color: '#0b3d91', fontWeight: '700' },
  notifItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  notifTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  notifTime: { fontSize: 12, color: '#64748B', marginTop: 4 },
  emptyText: { padding: 20, textAlign: 'center', color: '#64748B' },
});
