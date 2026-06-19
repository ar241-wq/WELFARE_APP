import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getWallet, getTransactions } from '../../lib/api';

function TransactionItem({ item }) {
  const isCredit = item.amount > 0;
  return (
    <View style={styles.txItem}>
      <View style={[styles.txIcon, { backgroundColor: isCredit ? '#d1fae5' : '#fee2e2' }]}>
        <Text style={{ fontSize: 16 }}>{isCredit ? '💰' : '🛍️'}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.txDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={[styles.txAmount, { color: isCredit ? '#059669' : '#dc2626' }]}>
        {isCredit ? '+' : ''}{item.amount}
      </Text>
    </View>
  );
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const [w, t] = await Promise.all([getWallet(), getTransactions()]);
      setWallet(w);
      setTransactions(Array.isArray(t) ? t : t?.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#6366f1" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>My Wallet</Text>
      </View>

      {wallet && (
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceNum}>{wallet.balance}</Text>
          <Text style={styles.balanceCredits}>credits</Text>
          {wallet.expires_at && (
            <Text style={styles.expires}>Expires {new Date(wallet.expires_at).toLocaleDateString()}</Text>
          )}
        </View>
      )}

      <Text style={styles.sectionTitle}>Transaction History</Text>

      {transactions.length === 0 ? (
        <Text style={styles.empty}>No transactions yet.</Text>
      ) : (
        transactions.map((tx) => <TransactionItem key={tx.id} item={tx} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  balanceCard: {
    margin: 16, padding: 28, borderRadius: 20,
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
    alignItems: 'center',
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  balanceNum: { color: '#fff', fontSize: 64, fontWeight: '800', marginTop: 4 },
  balanceCredits: { color: 'rgba(255,255,255,0.8)', fontSize: 18, marginTop: 2 },
  expires: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8,
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#f3f4f6',
  },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: '600', color: '#111827' },
  txDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 14 },
});
