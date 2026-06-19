import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { getRedemptions } from '../../lib/api';

export default function RedeemScreen() {
  const { id, perk_name, perk_price } = useLocalSearchParams();
  const router = useRouter();
  const [redemption, setRedemption] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If perk details passed as params (from redeemPerk), use them directly
    if (perk_name) {
      setRedemption({ id, perk_name, perk_credit_price: perk_price, status: 'pending', perk: id });
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const all = await getRedemptions();
        const list = Array.isArray(all) ? all : all?.results || [];
        const found = list.find((r) => String(r.id) === String(id));
        setRedemption(found || null);
      } catch (e) {
        Alert.alert('Error', 'Could not load redemption.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#6366f1" /></View>;
  }

  if (!redemption) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>Redemption not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Extract the raw string from base64 QR or use the id as QR data
  const qrValue = `REDEMPTION:${redemption.id}:${redemption.perk}`;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.title}>Your Perk is Ready!</Text>
        <Text style={styles.perkName}>{redemption.perk_name}</Text>
        <Text style={styles.instruction}>Show this QR code to the provider</Text>

        <View style={styles.qrContainer}>
          <QRCode
            value={qrValue}
            size={220}
            color="#111827"
            backgroundColor="#fff"
          />
        </View>

        <View style={styles.infoBadge}>
          <Text style={styles.infoText}>Redemption #{redemption.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: redemption.status === 'redeemed' ? '#d1fae5' : '#eef2ff' }]}>
            <Text style={[styles.statusText, { color: redemption.status === 'redeemed' ? '#059669' : '#6366f1' }]}>
              {redemption.status}
            </Text>
          </View>
        </View>

        <Text style={styles.cost}>{redemption.perk_credit_price} credits used</Text>
      </View>

      <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)/')}>
        <Text style={styles.doneBtnText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 20, justifyContent: 'center' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#6b7280', marginBottom: 12 },
  backLink: { fontSize: 15, color: '#6366f1', fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  successIcon: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 6 },
  perkName: { fontSize: 16, color: '#6366f1', fontWeight: '600', marginBottom: 8 },
  instruction: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  qrContainer: { padding: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 2, borderColor: '#e5e7eb', marginBottom: 20 },
  infoBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  infoText: { fontSize: 13, color: '#6b7280' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cost: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  doneBtn: {
    marginTop: 20, backgroundColor: '#6366f1', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
