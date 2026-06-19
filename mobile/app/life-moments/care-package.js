import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getMyLifeEvents, redeemPerk } from '../../lib/api';

export default function CarePackageScreen() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const events = await getMyLifeEvents();
        const list = Array.isArray(events) ? events : events?.results || [];
        const found = list.find((e) => String(e.id) === String(eventId));
        setEvent(found || null);
      } catch (e) {}
      finally { setLoading(false); }
    }
    load();
  }, [eventId]);

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#6366f1" /></View>;
  if (!event?.care_package) return <View style={styles.loader}><Text>Care package not found.</Text></View>;

  const pkg = event.care_package;
  const perks = pkg.perks || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>💝</Text>
        <Text style={styles.heroTitle}>Your team sent you a care package</Text>
        <Text style={styles.heroText}>
          Your company and colleagues have come together to support you during this time.
        </Text>
        {pkg.total_donations > 0 && (
          <View style={styles.donationBadge}>
            <Text style={styles.donationText}>+{pkg.total_donations} credits from your team ❤️</Text>
          </View>
        )}
        {pkg.credit_boost > 0 && (
          <View style={styles.boostBadge}>
            <Text style={styles.boostText}>+{pkg.credit_boost} bonus credits from HR</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Perks included in your package</Text>

      {perks.map((perk) => (
        <View key={perk.id} style={styles.perkCard}>
          <View style={styles.perkInfo}>
            <Text style={styles.perkName}>{perk.name}</Text>
            <Text style={styles.perkProvider}>{perk.provider_name}</Text>
          </View>
          <TouchableOpacity
            style={styles.redeemBtn}
            onPress={() => router.push(`/perk/${perk.id}`)}
          >
            <Text style={styles.redeemText}>View</Text>
          </TouchableOpacity>
        </View>
      ))}

      {perks.length === 0 && (
        <Text style={styles.emptyText}>Your care package perks are being prepared.</Text>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/')}>
        <Text style={styles.backText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#fdf2f8', borderRadius: 20, marginBottom: 24 },
  heroIcon: { fontSize: 56, marginBottom: 12 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 8, paddingHorizontal: 16 },
  heroText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  donationBadge: { marginTop: 14, backgroundColor: '#fee2e2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  donationText: { fontSize: 13, color: '#dc2626', fontWeight: '700' },
  boostBadge: { marginTop: 8, backgroundColor: '#d1fae5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  boostText: { fontSize: 13, color: '#059669', fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 14 },
  perkCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, marginBottom: 10,
  },
  perkInfo: { flex: 1 },
  perkName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  perkProvider: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  redeemBtn: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  redeemText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#9ca3af', fontSize: 14, marginVertical: 20 },
  backBtn: { marginTop: 20, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  backText: { color: '#6b7280', fontSize: 15, fontWeight: '600' },
});
