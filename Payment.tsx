import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

type Props = {
  route?: any;
  navigation?: any;
};

export default function Payment({route}: Props) {
  const appointment = route?.params?.appointment ?? {
    id: 'APPT-001',
    patientName: 'John Doe',
    fee: 100,
    scheduled: '2026-02-28 10:00',
  };

  const formatFee = (value: number | string) => {
    const amt = typeof value === 'string' ? Number(value) : value;
    try {
      // Display as plain integer followed by 'frw' (lowercase), e.g. "100 frw"
      const n = Number.isFinite(Number(amt)) ? Math.round(Number(amt)) : 0;
      return `${n} frw`;
    } catch (e) {
      const n = Number.isFinite(Number(amt)) ? Math.round(Number(amt)) : 0;
      return `${n} frw`;
    }
  };

  const [hasPaid, setHasPaid] = useState(false);
    const [adminApproved, setAdminApproved] = useState(false);
  const [doctorStarted, setDoctorStarted] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>(String(appointment.fee || 0));
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<number | null>(null);
  const [pollTries, setPollTries] = useState(0);

  const pushMessage = (m: string) => {
    setMessages(prev => [m, ...prev]);
  };

  const isPaid =
    hasPaid ||
    Boolean(
      paymentResponse?.payment?.status &&
        ['pending', 'completed', 'success', 'paid'].includes(
          String(paymentResponse.payment.status).toLowerCase(),
        ),
    );

  // derive admin approval from server response if available
  const serverAdminApproved = Boolean(
    paymentResponse?.payment?.admin_approved ||
      (paymentResponse?.payment?.status && String(paymentResponse.payment.status).toLowerCase() === 'approved'),
  );

  const effectiveAdminApproved = adminApproved || serverAdminApproved;

  const handlePatientPay = async () => {
    if (hasPaid || loadingPayment) {
      Alert.alert('Payment', 'Payment already in progress or completed.');
      return;
    }
    const amount = Number((paymentAmount || '').toString().replace(/,/g, '').trim());
    const number = appointment.number || appointment.phone || '0788698529';
    const patient_id = appointment.patient_id || appointment.patientId || 'patient_39';
    const appointment_id = appointment.dbId || appointment.appointment_id || appointment.id || null;

    // Basic validation
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Payment', 'Appointment fee is missing or must be greater than 0.');
      return;
    }
    if (!number) {
      Alert.alert('Payment', 'Patient phone number is missing.');
      return;
    }
    if (!patient_id) {
      Alert.alert('Payment', 'Patient id is missing.');
      return;
    }
    if (!appointment_id) {
      Alert.alert('Payment', 'Appointment id is missing. Use the DB appointment id.');
      return;
    }

    setLoadingPayment(true);
    pushMessage('Patient: Initiating payment...');
    console.log('Payment: initiating', { amount, number, patient_id, appointment_id, appointment });
    try {
      const host = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
      const resp = await fetch(`${host}/api/payment/initiate`, {
        method: 'POST',
        headers: { accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, number, patient_id, appointment_id }),
      });
        const text = await resp.text();
        let data: any = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch (err) {
          // non-json response
          data = { raw: text };
        }

        // Log HTTP status and raw response for easier debugging
        pushMessage(`HTTP ${resp.status} returned from payment initiate`);
        console.log('Payment response status', resp.status, 'body:', text);

        if (resp.ok) {
        setPaymentResponse(data);
        setHasPaid(true);
        const provStatus = data?.provider?.status || data?.payment?.status || 'pending';
        const provRef = data?.provider?.ref || data?.payment?.provider_ref || data?.payment?.ref || '';
        pushMessage(`Patient: Payment submitted for appointment ${appointment_id}. Provider status: ${provStatus}`);
        if (provRef) pushMessage(`Provider ref: ${provRef}`);
        Alert.alert('Payment', 'Payment submitted. Waiting admin approval.');
      } else {
          const msg = data?.message || data?.raw || `Payment initiation failed (status ${resp.status})`;
          pushMessage('Patient: Payment initiation failed — ' + msg);
          Alert.alert('Payment error', msg);
      }
    } catch (e: any) {
      pushMessage('Patient: Payment error — network issue');
      console.error('Payment error', e);
      Alert.alert('Payment error', e?.message || String(e));
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleAdminApprove = () => {
    if (!hasPaid) {
      Alert.alert('Admin', 'Patient has not paid yet.');
      return;
    }
    if (adminApproved) {
      Alert.alert('Admin', 'Payment already approved.');
      return;
    }
    setAdminApproved(true);
    pushMessage('Admin: Payment approved and confirmed. Notification sent to doctor.');
    Alert.alert('Admin', 'Payment approved. Doctor notified.');
  };

  const clearPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPolling(false);
    setPollTries(0);
  };

  const checkPaymentEvent = async (ref: string, client: string, kind = 'CASHIN') => {
    try {
      const host = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
      const params = new URLSearchParams({ ref, kind, client, status: 'pending' });
      const url = `${host}/api/payment/event?${params.toString()}`;
      const resp = await fetch(url, { method: 'GET', headers: { accept: 'application/json' } });
      const json = await resp.json();
      pushMessage(`Event check: HTTP ${resp.status}`);
      console.log('Payment event check', url, resp.status, json);
      const tx = json?.transactions?.[0]?.data;
      if (tx && tx.status) {
        const st = String(tx.status).toLowerCase();
        if (['completed', 'success', 'paid'].includes(st)) {
          setPaymentResponse((prev: any) => {
            const next = { ...(prev || {}) };
            next.payment = next.payment || {};
            next.payment.status = tx.status;
            return next;
          });
          setHasPaid(true);
          pushMessage(`Transaction event: status=${tx.status}`);
          clearPolling();
          return true;
        }
      }
    } catch (err) {
      console.error('checkPaymentEvent error', err);
      pushMessage('Event check error');
    }
    return false;
  };

  const startPolling = (ref: string, client: string, kind = 'CASHIN') => {
    if (pollRef.current) return;
    setPolling(true);
    setPollTries(0);
    pollRef.current = setInterval(async () => {
      setPollTries(t => t + 1);
      const tries = pollTries + 1;
      const done = await checkPaymentEvent(ref, client, kind);
      if (done || tries >= 12) {
        clearPolling();
        if (!done) pushMessage('Event polling ended without success');
      }
    }, 3000) as unknown as number;
  };

  useEffect(() => {
    return () => clearPolling();
  }, []);

  const fetchPaymentStatus = async (paymentId?: string, appointmentId?: string) => {
    try {
      const host = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
      const tries: Array<{url: string; parse: (json: any) => any}> = [];

      if (paymentId) {
        tries.push({
          url: `${host}/api/payment/${encodeURIComponent(paymentId)}`,
          parse: (json: any) => json,
        });
        tries.push({
          url: `${host}/api/payment/status?payment_id=${encodeURIComponent(paymentId)}`,
          parse: (json: any) => json,
        });
      }
      if (appointmentId) {
        tries.push({
          url: `${host}/api/payment/by-appointment/${encodeURIComponent(appointmentId)}`,
          parse: (json: any) => json,
        });
        tries.push({
          url: `${host}/api/payment?appointment_id=${encodeURIComponent(appointmentId)}`,
          parse: (json: any) => json,
        });
      }

      // last resort: check event by provider ref if available
      const provRef = paymentResponse?.provider?.ref || paymentResponse?.payment?.provider_ref || paymentResponse?.payment?.ref;
      const client = appointment.number || appointment.phone || '0788698529';
      if (provRef) {
        const params = new URLSearchParams({ ref: provRef, kind: paymentResponse?.provider?.kind || paymentResponse?.payment?.provider_kind || 'CASHIN', client, status: 'pending' });
        tries.push({ url: `${host}/api/payment/event?${params.toString()}`, parse: (json: any) => json });
      }

      for (const t of tries) {
        try {
          const resp = await fetch(t.url, { headers: { accept: 'application/json' } });
          if (!resp.ok) continue;
          const json = await resp.json();
          // normalize possible payment shape
          const maybePayment = json?.payment || (json?.data && json.data.payment) || json;
          if (maybePayment) {
            setPaymentResponse(prev => ({ ...(prev || {}), payment: maybePayment }));
            const approved = Boolean(maybePayment.admin_approved || String(maybePayment.status).toLowerCase() === 'approved');
            if (approved) setAdminApproved(true);
            pushMessage(`Status refresh: found payment data via ${t.url}`);
            return { ok: true, url: t.url, data: json };
          }
          // event response
          if (json?.transactions?.length) {
            const tx = json.transactions[0].data;
            if (tx) {
              // if event shows admin approval in metadata
              if (tx.status && String(tx.status).toLowerCase() === 'approved') {
                setAdminApproved(true);
                pushMessage('Status refresh: admin approved (via event)');
                return { ok: true, url: t.url, data: json };
              }
            }
          }
        } catch (err) {
          console.warn('fetchPaymentStatus try error', err);
        }
      }
      pushMessage('Status refresh: no payment record found on server');
      return { ok: false };
    } catch (err) {
      console.error('fetchPaymentStatus error', err);
      pushMessage('Status refresh error');
      return { ok: false, error: err };
    }
  };

  const handleDoctorCheckAndStart = () => {
    if (!adminApproved) {
      Alert.alert('Doctor', 'Waiting for payment approval by admin.');
      pushMessage('Doctor: Checked payment — not approved yet.');
      return;
    }
    if (doctorStarted) {
      Alert.alert('Doctor', 'Consultation already started.');
      return;
    }
    setDoctorStarted(true);
    pushMessage('Doctor: Approved and started the consultation process.');
    Alert.alert('Doctor', 'Consultation started.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Payment / Consultation Flow</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Appointment ID: {appointment.id}</Text>
          <Text style={styles.label}>Patient: {appointment.patientName}</Text>
          <Text style={styles.label}>Schedule: {appointment.scheduled}</Text>
          <Text style={styles.label}>Fee: {formatFee(paymentAmount)}</Text>

          <View style={{marginTop: 8}}>
            <Text style={[styles.label, {marginBottom: 6}]}>Enter amount to pay</Text>
            <TextInput
              style={styles.input}
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="numeric"
              placeholder="Amount (e.g. 100)"
              returnKeyType="done"
            />
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.status}>Paid: {isPaid ? 'Yes' : 'No'}</Text>
          <Text style={styles.status}>Admin Approved: {adminApproved ? 'Yes' : 'No'}</Text>
          <Text style={styles.status}>Doctor Started: {doctorStarted ? 'Yes' : 'No'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Actions</Text>
            <TouchableOpacity
              style={[styles.buttonPrimary, loadingPayment && styles.buttonDisabled]}
              onPress={handlePatientPay}
              disabled={loadingPayment}
            >
              {loadingPayment ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Pay Consultation Fee</Text>
              )}
            </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Actions</Text>
          <TouchableOpacity style={styles.buttonSecondary} onPress={handleAdminApprove}>
            <Text style={styles.buttonText}>Admin: Approve Payment</Text>
          </TouchableOpacity>
        </View>

        {paymentResponse ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Result</Text>
            <View style={{padding:8, backgroundColor:'#fff', borderRadius:8, borderWidth:1, borderColor:'#eef2ff'}}>
              <Text style={styles.label}>Payment ID: {paymentResponse?.payment?.id ?? paymentResponse?.payment?.ref ?? '-'}</Text>
                  <Text style={styles.label}>Payment Status: {paymentResponse?.payment?.status ?? paymentResponse?.provider?.status ?? '-'}</Text>
                  <Text style={styles.label}>Admin Approved: {effectiveAdminApproved ? 'Yes' : 'No'}</Text>
              <Text style={styles.label}>Provider: {paymentResponse?.provider?.provider ?? paymentResponse?.payment?.provider_kind ?? '-'}</Text>
              <Text style={styles.label}>Provider Ref: {paymentResponse?.provider?.ref ?? paymentResponse?.payment?.provider_ref ?? '-'}</Text>
              <Text style={styles.label}>Appointment ID: {paymentResponse?.payment?.appointment_id ?? '-'}</Text>
                  <Text style={[styles.label, {marginTop:8, fontWeight:'600'}]}>Raw response</Text>
                  <ScrollView style={{maxHeight:120}}>
                    <Text style={{fontSize:12, color:'#111'}}>{JSON.stringify(paymentResponse, null, 2)}</Text>
                  </ScrollView>
                  <View style={{marginTop:10}}>
                    {polling ? (
                      <Text style={{fontSize:13, color:'#6b7280'}}>Checking transaction events...</Text>
                    ) : (
                      <TouchableOpacity
                        style={[styles.buttonSecondary, {marginTop:8}]}
                        onPress={async () => {
                          const ref = paymentResponse?.provider?.ref || paymentResponse?.payment?.provider_ref || paymentResponse?.payment?.ref;
                          const client = appointment.number || appointment.phone || '0788698529';
                          if (!ref) {
                            Alert.alert('Check', 'Provider ref is missing in response');
                            return;
                          }
                          pushMessage('Manual event check started');
                          const done = await checkPaymentEvent(ref, client, paymentResponse?.provider?.kind || paymentResponse?.payment?.provider_kind || 'CASHIN');
                          if (!done) pushMessage('Manual check: no completed transaction yet');
                        }}
                      >
                        <Text style={styles.buttonText}>Check Transaction</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={{marginTop:8}}>
                    <TouchableOpacity
                      style={[styles.buttonSecondary, {marginTop:8}]}
                      onPress={async () => {
                        const pid = paymentResponse?.payment?.id;
                        const appt = paymentResponse?.payment?.appointment_id || appointment.id;
                        pushMessage('Manual status refresh started');
                        await fetchPaymentStatus(pid, appt);
                      }}
                    >
                      <Text style={styles.buttonText}>Refresh Status</Text>
                    </TouchableOpacity>
                  </View>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doctor Actions</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Log</Text>
          {messages.length === 0 ? (
            <Text style={styles.empty}>No events yet.</Text>
          ) : (
            messages.map((m, i) => (
              <View key={i} style={styles.msgRow}>
                <Text style={styles.msgText}>{m}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  container: {padding: 16, paddingBottom: 40},
  title: {fontSize: 20, fontWeight: '700', marginBottom: 12},
  card: {padding: 12, borderRadius: 8, backgroundColor: '#f8f8f8', marginBottom: 12},
  label: {fontSize: 14, marginBottom: 4},
  statusRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12},
  status: {fontSize: 13, fontWeight: '600'},
  section: {marginBottom: 14},
  sectionTitle: {fontSize: 16, fontWeight: '700', marginBottom: 8},
  buttonPrimary: {
    backgroundColor: '#001e3c',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {color: '#fff', fontWeight: '700'},
  buttonDisabled: {opacity: 0.6},
  empty: {color: '#6b7280'},
  msgRow: {paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee'},
  msgText: {fontSize: 13},
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
});
