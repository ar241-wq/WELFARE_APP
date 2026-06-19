import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getWallet, getFeaturedPerks, getCategories } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const [w, f, c] = await Promise.all([getWallet(), getFeaturedPerks(), getCategories()]);
      setWallet(w);
      setFeatured(Array.isArray(f) ? f : f?.results || []);
      setCategories(Array.isArray(c) ? c : c?.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.greeting}>Good morning, {firstName} 👋</Text>
          <Text style={styles.subGreeting}>Ready to explore your perks?</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/life-moments')} style={styles.heartBtn}>
          <Text style={{ fontSize: 22 }}>💝</Text>
        </TouchableOpacity>
      </View>

      {/* Wallet Card */}
      {wallet && (
        <TouchableOpacity style={styles.walletCard} onPress={() => router.push('/wallet')}>
          <Text style={styles.walletLabel}>Your Credit Balance</Text>
          <Text style={styles.walletBalance}>{wallet.balance}</Text>
          <Text style={styles.walletCredits}>credits available</Text>
          {wallet.expires_at && (
            <View style={styles.expireBadge}>
              <Text style={styles.expireText}>Expires {new Date(wallet.expires_at).toLocaleDateString()}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Categories */}
      <Text style={styles.sectionTitle}>Browse by Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryChip}
            onPress={() => router.push({ pathname: '/(tabs)/catalog', params: { category: cat.name } })}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={styles.categoryName}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured Perks */}
      <Text style={styles.sectionTitle}>Featured Perks</Text>
      {featured.map((perk) => (
        <TouchableOpacity
          key={perk.id}
          style={styles.perkCard}
          onPress={() => router.push(`/perk/${perk.id}`)}
        >
          <View style={styles.perkInfo}>
            <Text style={styles.perkName}>{perk.name}</Text>
            <Text style={styles.perkProvider}>{perk.provider_name}</Text>
            <Text style={styles.perkCategory}>{perk.category_name}</Text>
          </View>
          <View style={styles.perkPrice}>
            <Text style={styles.perkPriceNum}>{perk.credit_price}</Text>
            <Text style={styles.perkPriceLabel}>credits</Text>
          </View>
        </TouchableOpacity>
      ))}

      {featured.length === 0 && (
        <Text style={styles.emptyText}>No featured perks yet. Check the catalog!</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff',
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subGreeting: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  heartBtn: { padding: 8 },
  walletCard: {
    margin: 16, padding: 24, borderRadius: 20,
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  walletBalance: { color: '#fff', fontSize: 52, fontWeight: '800', marginTop: 4 },
  walletCredits: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 4 },
  expireBadge: {
    marginTop: 12, backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start',
  },
  expireText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginHorizontal: 16, marginTop: 16, marginBottom: 12 },
  categoryRow: { paddingHorizontal: 16, gap: 10 },
  categoryChip: {
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#e5e7eb', minWidth: 80,
  },
  categoryIcon: { fontSize: 24, marginBottom: 4 },
  categoryName: { fontSize: 11, fontWeight: '600', color: '#374151' },
  perkCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 10, padding: 16,
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#e5e7eb',
  },
  perkInfo: { flex: 1 },
  perkName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  perkProvider: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  perkCategory: { fontSize: 11, color: '#6366f1', fontWeight: '600', marginTop: 4 },
  perkPrice: { alignItems: 'center', marginLeft: 12 },
  perkPriceNum: { fontSize: 22, fontWeight: '800', color: '#6366f1' },
  perkPriceLabel: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 20, fontSize: 14 },
});
