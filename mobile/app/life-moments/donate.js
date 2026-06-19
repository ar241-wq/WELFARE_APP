import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getDonationInfo, donateCredits, getWallet } from '../../lib/api';

export default function DonateScreen() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const [info, setInfo] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState('50');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const QUICK_AMOUNTS = [25, 50, 100, 150];

  useEffect(() => {
    async function load() {
      try {
        const [i, w] = await Promise.all([getDonationInfo(eventId), getWallet()]);
        setInfo(i);
        setWallet(w);
      } catch (e) {}
      finally { setLoading(false); }
    }
    load();
  }, [eventId]);

  async function handleDonate() {
    const num = parseFloat(amount);
    if (!num || num <= 0) { Alert.alert('Invalid amount'); return; }
    if (wallet && num > parseFloat(wallet.balance)) {
      Alert.alert('Not enough credits', `You only have ${wallet.balance} credits.`); return;
    }
    setSubmitting(true);
    try {
      await donateCredits(eventId, num);
      Alert.alert('Sent Anonymously 💝', `Your ${num} credits have been sent. Your colleague will only see "Your team sent you a care package."`, [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not send credits.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>🤝</Text>
        <Text style={styles.heroTitle}>Send care credits anonymously</Text>
        <Text style={styles.heroText}>
          Your name will never be shown. Your colleague will only see that their team showed up for them.
        </Text>
      </View>

      {info && (
        <View style={styles.infoCard}>
          <Text style={styles.infoEvent}>{info.event_type}</Text>
          <Text style={styles.infoStats}>{info.donor_count} people have already donated</Text>
          <Text style={styles.infoTotal}>{info.total_donations} total credits sent</Text>
        </View>
      )}

      {wallet && (
        <Text style={styles.balanceText}>Your balance: <Text style={styles.balanceBold}>{wallet.balance} credits</Text></Text>
      )}

      <Text style={styles.quickLabel}>Quick amounts</Text>
      <View style={styles.quickRow}>
        {QUICK_AMOUNTS.map((q) => (
          <TouchableOpacity
            key={q}
            style={[styles.quickBtn, String(q) === amount && styles.quickBtnActive]}
            onPress={() => setAmount(String(q))}
          >
            <Text style={[styles.quickText, String(q) === amount && styles.quickTextActive]}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.customLabel}>Or enter a custom amount</Text>
      <TextInput
        style={styles.amountInput}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="Enter credits"
        placeholderTextColor="#9ca3af"
      />

      <TouchableOpacity style={styles.sendBtn} onPress={handleDonate} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Send {amount} credits anonymously</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fdf2f8', borderRadius: 20, marginBottom: 20 },
  heroIcon: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 8, paddingHorizontal: 16 },
  heroText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  infoCard: { backgroundColor: '#f9fafb', borderRadius: 14, padding: 16, marginBottom: 16 },
  infoEvent: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  infoStats: { fontSize: 13, color: '#6b7280' },
  infoTotal: { fontSize: 13, color: '#6366f1', fontWeight: '600', marginTop: 2 },
  balanceText: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  balanceBold: { fontWeight: '700', color: '#111827' },
  quickLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  quickBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  quickText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  quickTextActive: { color: '#fff' },
  customLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  amountInput: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, fontWeight: '700',
    color: '#111827', marginBottom: 20, textAlign: 'center',
  },
  sendBtn: { backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  sendText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
