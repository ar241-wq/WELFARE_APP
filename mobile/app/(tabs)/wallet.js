import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
  Modal, TextInput, FlatList, Alert, Image,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getWallet, getTransactions, searchUsers, giftCredits } from '../../lib/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const GIFT_AMOUNTS = [25, 50, 100, 200];

function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
}

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

function GiftModal({ visible, balance, onClose, onSuccess }) {
  const [step, setStep] = useState('search'); // 'search' | 'amount'
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [recipient, setRecipient] = useState(null);
  const [amount, setAmount] = useState(50);
  const [note, setNote] = useState('');
  const [gifting, setGifting] = useState(false);

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        setStep('search');
        setQuery('');
        setResults([]);
        setRecipient(null);
        setAmount(50);
        setNote('');
      }, 300);
    }
  }, [visible]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try { setResults(await searchUsers(query)); } catch (_) {}
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const selectRecipient = (user) => {
    setRecipient(user);
    setStep('amount');
  };

  const handleGift = async () => {
    if (gifting || !recipient) return;
    setGifting(true);
    try {
      const result = await giftCredits(recipient.id, amount, note.trim());
      onSuccess(result);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to gift credits.');
    }
    setGifting(false);
  };

  const canGift = balance !== null && balance >= amount && !gifting;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalCard}>

          {/* Handle bar */}
          <View style={styles.handle} />

          {step === 'search' && (
            <>
              <Text style={styles.modalTitle}>Gift Credits 🎁</Text>
              <Text style={styles.modalSub}>Search for a colleague to send credits to</Text>

              <View style={styles.searchBox}>
                <Text style={{ fontSize: 15, marginRight: 8 }}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or email…"
                  placeholderTextColor="#b0b0b0"
                  value={query}
                  onChangeText={setQuery}
                  autoFocus
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <Text style={{ color: '#b0b0b0', fontSize: 16 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {searching && <ActivityIndicator color="#6366f1" style={{ marginTop: 20 }} />}

              <FlatList
                data={results}
                keyExtractor={i => String(i.id)}
                style={{ maxHeight: 280 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.userRow} onPress={() => selectRecipient(item)} activeOpacity={0.7}>
                    <View style={styles.userAvatar}>
                      {item.avatar
                        ? <Image source={{ uri: resolveUrl(item.avatar) }} style={styles.userAvatarImg} />
                        : <Text style={styles.userAvatarLetter}>{(item.full_name || '?')[0]}</Text>
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{item.full_name}</Text>
                      <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                    <Text style={{ color: '#6366f1', fontSize: 20 }}>›</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  !searching && query.trim()
                    ? <Text style={styles.noResults}>No colleagues found</Text>
                    : null
                }
              />

              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'amount' && recipient && (
            <>
              <TouchableOpacity onPress={() => setStep('search')} style={styles.backRow}>
                <Text style={styles.backArrow}>‹</Text>
                <Text style={styles.backLabel}>Back</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Gift Credits to</Text>
              <View style={styles.recipientRow}>
                <View style={styles.userAvatar}>
                  {recipient.avatar
                    ? <Image source={{ uri: resolveUrl(recipient.avatar) }} style={styles.userAvatarImg} />
                    : <Text style={styles.userAvatarLetter}>{(recipient.full_name || '?')[0]}</Text>
                  }
                </View>
                <Text style={styles.recipientName}>{recipient.full_name}</Text>
              </View>

              {balance !== null && (
                <Text style={styles.balanceHint}>Your balance: {balance} credits</Text>
              )}

              <Text style={styles.sectionLabel}>Choose amount</Text>
              <View style={styles.chipsRow}>
                {GIFT_AMOUNTS.map(amt => (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.chip, amount === amt && styles.chipSelected, balance !== null && balance < amt && styles.chipDisabled]}
                    onPress={() => balance !== null && balance >= amt && setAmount(amt)}
                  >
                    <Text style={[styles.chipText, amount === amt && styles.chipTextSelected]}>
                      {amt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Note (optional)</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Add a note…"
                placeholderTextColor="#9ca3af"
                value={note}
                onChangeText={setNote}
                maxLength={200}
              />

              <TouchableOpacity
                style={[styles.giftBtn, !canGift && styles.giftBtnDisabled]}
                onPress={handleGift}
                disabled={!canGift}
              >
                {gifting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.giftBtnTxt}>Send {amount} Credits 🎁</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={gifting}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGift, setShowGift] = useState(false);

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

  const handleGiftSuccess = (result) => {
    setShowGift(false);
    const newBalance = Number(result.new_balance);
    setWallet(prev => prev ? { ...prev, balance: newBalance } : prev);
    Alert.alert('Sent! 🎁', `${result.amount} credits gifted to ${result.recipient_name}.`);
    load(); // refresh transactions
  };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#6366f1" /></View>;
  }

  return (
    <>
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

        {/* Gift Credits Button */}
        <TouchableOpacity style={styles.giftRow} onPress={() => setShowGift(true)} activeOpacity={0.8}>
          <View style={styles.giftRowLeft}>
            <Text style={styles.giftRowIcon}>🎁</Text>
            <View>
              <Text style={styles.giftRowTitle}>Gift Credits</Text>
              <Text style={styles.giftRowSub}>Send credits to a colleague</Text>
            </View>
          </View>
          <Text style={styles.giftRowChevron}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Transaction History</Text>

        {transactions.length === 0 ? (
          <Text style={styles.empty}>No transactions yet.</Text>
        ) : (
          transactions.map((tx) => <TransactionItem key={tx.id} item={tx} />)
        )}
      </ScrollView>

      <GiftModal
        visible={showGift}
        balance={wallet ? Number(wallet.balance) : null}
        onClose={() => setShowGift(false)}
        onSuccess={handleGiftSuccess}
      />
    </>
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

  giftRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 16, padding: 16,
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1.5, borderColor: '#e0e7ff',
    shadowColor: '#6366f1', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  giftRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  giftRowIcon: { fontSize: 28 },
  giftRowTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  giftRowSub: { fontSize: 12, color: '#6366f1', marginTop: 1 },
  giftRowChevron: { fontSize: 22, color: '#6366f1', fontWeight: '700' },

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

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40,
    maxHeight: '90%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#6b7280', marginBottom: 18 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6',
    borderRadius: 99, paddingHorizontal: 16, paddingVertical: 11, marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111' },

  userRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f3f4f6', gap: 12,
  },
  userAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#eef2ff',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  userAvatarImg: { width: 44, height: 44 },
  userAvatarLetter: { fontSize: 18, fontWeight: '800', color: '#6366f1' },
  userName: { fontSize: 15, fontWeight: '700', color: '#111' },
  userEmail: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  noResults: { textAlign: 'center', color: '#9ca3af', marginTop: 24, fontSize: 14 },

  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 4 },
  backArrow: { fontSize: 24, color: '#6366f1', lineHeight: 28 },
  backLabel: { fontSize: 15, color: '#6366f1', fontWeight: '600' },

  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  recipientName: { fontSize: 17, fontWeight: '700', color: '#111' },
  balanceHint: { fontSize: 13, color: '#6366f1', fontWeight: '600', marginBottom: 20 },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  chipsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  chip: {
    flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: '#f3f4f6',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  chipSelected: { backgroundColor: '#eef2ff', borderColor: '#6366f1' },
  chipDisabled: { opacity: 0.35 },
  chipText: { fontSize: 15, fontWeight: '700', color: '#6b7280' },
  chipTextSelected: { color: '#6366f1' },

  noteInput: {
    backgroundColor: '#f3f4f6', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: '#111', marginBottom: 24,
  },
  giftBtn: {
    backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  giftBtnDisabled: { backgroundColor: '#c7d2fe', shadowOpacity: 0 },
  giftBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelTxt: { fontSize: 15, color: '#9ca3af', fontWeight: '600' },
});
