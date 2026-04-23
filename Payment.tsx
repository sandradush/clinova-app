import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStripe } from '@stripe/stripe-react-native';

const PRIMARY = '#001e3c';
const BASE = 'https://clinic-backend-s2lx.onrender.com';

type Props = {
  appointmentId: string | number;
  patientId: string | number;
  doctorName?: string;
  appointmentDate?: string;
  fee?: number;
  onClose: () => void;
};

type PayStatus = 'idle' | 'loading' | 'success' | 'failed';

export default function Payment({
  appointmentId, patientId, doctorName, appointmentDate, fee = 0, onClose,
}: Props) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [status, setStatus] = useState<PayStatus>('idle');
  const [paidAmount, setPaidAmount] = useState(String(fee || ''));

  const handlePay = async () => {
    if (!paidAmount || Number(paidAmount) <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than 0.');
      return;
    }
    setStatus('loading');

    try {
      // Step 1 — Call backend to create Stripe PaymentIntent
      // Try both endpoint variants — initiate first, fallback to create-payment-intent
      const safeJson = async (r: Response) => {
        const text = await r.text();
        try { return JSON.parse(text); }
        catch { return { _raw: text, _status: r.status }; }
      };

      const resp = await fetch(`${BASE}/api/payments/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          amount: Number(paidAmount),
          currency: 'RWF',
          patient_id: Number(patientId),
          appointment_id: Number(appointmentId),
        }),
      });

      const data = await safeJson(resp);

      if (data._raw) {
        setStatus('failed');
        Alert.alert('Payment Error', `Server returned non-JSON (status ${data._status}).\n\nPreview: ${String(data._raw).slice(0, 120)}`);
        return;
      }

      if (!resp.ok) {
        setStatus('failed');
        Alert.alert('Payment Error', data?.detail || data?.message || `Server error: ${resp.status}`);
        return;
      }

      // Response: { paymentIntent: 'pi_...secret...', publishableKey: 'pk_test_...' }
      const paymentIntent = data.paymentIntent || data.client_secret || data.clientSecret;

      if (!paymentIntent) {
        setStatus('failed');
        Alert.alert('Payment Error', `Missing client secret. Server responded with:\n${JSON.stringify(data)}`);
        return;
      }

      // Step 2 — Init Stripe PaymentSheet using the real publishableKey from server
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Smarthealth',
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: { name: 'Patient' },
      });

      if (initError) {
        setStatus('failed');
        Alert.alert('Stripe Error', initError.message);
        return;
      }

      // Step 3 — Present Stripe payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          setStatus('idle');
        } else {
          setStatus('failed');
          Alert.alert('Payment Failed', presentError.message);
        }
        return;
      }

      // Step 4 — Success
      setStatus('success');

    } catch (e: any) {
      setStatus('failed');
      Alert.alert('Network Error', e?.message || 'Could not connect to payment server. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay Fee</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Success screen ── */}
        {status === 'success' ? (
          <View style={styles.successBox}>
            <View style={styles.successIconBox}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSub}>
              Your consultation fee of {paidAmount} RWF has been paid successfully.{'\n'}
              Your appointment is now confirmed.
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

        ) : (
          <>
            {/* Appointment summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconBox}>
                <Text style={styles.summaryIconText}>🏥</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryDoctor}>{doctorName || 'Doctor'}</Text>
                <Text style={styles.summaryDate}>{appointmentDate || `Appointment #${appointmentId}`}</Text>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>CONSULTATION FEE (RWF)</Text>
              <View style={styles.amountRow}>
                <TextInput
                  style={styles.amountInput}
                  value={paidAmount}
                  onChangeText={setPaidAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#CBD5E1"
                />
                <Text style={styles.amountCurrency}>RWF</Text>
              </View>
              <Text style={styles.amountNote}>Secure payment powered by Stripe</Text>
            </View>

            {/* What you get */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>What's included</Text>
              {[
                '✓  Video or voice consultation with your doctor',
                '✓  Digital prescription after consultation',
                '✓  Medical record updated automatically',
                '✓  Secure payment — no card details stored',
              ].map((line, i) => (
                <Text key={i} style={styles.infoLine}>{line}</Text>
              ))}
            </View>

            {/* Stripe badge */}
            <View style={styles.stripeBadge}>
              <Text style={styles.stripeLock}>🔒</Text>
              <Text style={styles.stripeText}>
                Payments are processed securely by{' '}
                <Text style={styles.stripeHighlight}>Stripe</Text>.
                Your card details are never stored on our servers.
              </Text>
            </View>

            {/* Pay button */}
            <TouchableOpacity
              style={[styles.payBtn, status === 'loading' && { opacity: 0.7 }]}
              onPress={handlePay}
              disabled={status === 'loading'}
              activeOpacity={0.85}
            >
              {status === 'loading' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.payBtnText}>Pay {paidAmount ? `${paidAmount} RWF` : 'Now'} with Stripe</Text>
              )}
            </TouchableOpacity>

            {status === 'failed' && (
              <Text style={styles.errorText}>
                Payment failed. Please try again or use a different card.
              </Text>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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

  scroll: { padding: 16 },

  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: PRIMARY, borderRadius: 16, padding: 18, marginBottom: 16,
  },
  summaryIconBox: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  summaryIconText: { fontSize: 24 },
  summaryDoctor: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 3 },
  summaryDate: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },

  amountCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  amountLabel: {
    fontSize: 11, fontWeight: '700', color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  amountInput: {
    fontSize: 42, fontWeight: '800', color: PRIMARY,
    minWidth: 100, textAlign: 'center',
    borderBottomWidth: 2, borderBottomColor: '#E2E8F0', paddingBottom: 4,
  },
  amountCurrency: { fontSize: 20, fontWeight: '700', color: '#94A3B8', marginTop: 8 },
  amountNote: { fontSize: 12, color: '#94A3B8', marginTop: 4 },

  infoCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  infoTitle: { fontSize: 14, fontWeight: '800', color: PRIMARY, marginBottom: 12 },
  infoLine: { fontSize: 13, color: '#374151', lineHeight: 24 },

  stripeBadge: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: '#BBF7D0',
  },
  stripeLock: { fontSize: 16 },
  stripeText: { flex: 1, fontSize: 12, color: '#374151', lineHeight: 18 },
  stripeHighlight: { fontWeight: '700', color: '#6772E5' },

  payBtn: {
    backgroundColor: '#6772E5', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#6772E5', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  payBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  errorText: { color: '#EF4444', textAlign: 'center', marginTop: 12, fontSize: 13, fontWeight: '600' },

  successBox: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  successIconBox: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successIcon: { fontSize: 42, color: '#16A34A' },
  successTitle: { fontSize: 26, fontWeight: '900', color: '#1E293B', marginBottom: 12 },
  successSub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  doneBtn: {
    backgroundColor: PRIMARY, borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 56, alignItems: 'center',
  },
  doneBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
