import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, TouchableOpacity, ScrollView } from 'react-native';

type PerceptionItem = {
  id: number;
  appointment_id: number;
  title: string;
  note: string;
  created_at: string;
};

type Props = {
  appointmentId?: string | number;
  onClose?: () => void;
};

export default function Prescription({ appointmentId, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PerceptionItem[]>([]);

  useEffect(() => {
    const fetchPerceptions = async () => {
      if (!appointmentId) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`https://clinic-backend-s2lx.onrender.com/api/perceptions/appointment/${appointmentId}`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
          },
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          setItems(data);
        } else {
          Alert.alert('Error', data?.message || 'Failed to load perceptions');
        }
      } catch (error) {
        Alert.alert('Error', 'Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPerceptions();
  }, [appointmentId]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.wrapper}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Perceptions</Text>
        </View>

        {loading ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>Loading perceptions...</Text>
          </View>
        ) : null}

        {items.length === 0 && !loading ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No perceptions found for this appointment.</Text>
          </View>
        ) : null}

        {items.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDate}>{item.created_at.split('T')[0]}</Text>
            </View>
            <Text style={styles.sectionLabel}>Note</Text>
            <Text style={styles.sectionText}>{item.note}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F9FF' },
  wrapper: { flex: 1, padding: 16, justifyContent: 'flex-start', alignItems: 'stretch' },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  cardDate: { fontSize: 13, color: '#64748B' },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 6 },
  sectionText: { fontSize: 15, color: '#374151', marginTop: 6, lineHeight: 20 },
  pageTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  backButtonText: {
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
