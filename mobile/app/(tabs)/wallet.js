import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
  Modal, TextInput, FlatList, Alert, Image,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUpRight, ArrowDownLeft, Gift, ChevronRight, X, Search } from 'lucide-react-native';
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
      <View style={[styles.txIcon, { backgroundColor: isCredit ? '#E6F4ED' : '#FEE2E0' }]}>
        {isCredit
          ? <ArrowDownLeft size={16} color="#1F7A4D" strokeWidth={2} />
          : <ArrowUpRight size={16} color="#B42318" strokeWidth={2} />
        }
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.txDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={[styles.txAmount, { color: isCredit ? '#1F7A4D' : '#B42318' }]}>
        {isCredit ? '+' : ''}{item.amount}
      </Text>
    </View>
  );
}

function GiftModal({ visible, balance, onClose, onSuccess }) {
  const [step, setStep] = useState('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [recipient, setRecipient] = useState(null);
  const [amount, setAmount] = useState(50);
  const [note, setNote] = useState('');
  const [gifting, setGifting] = useState(false);

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
          <View style={styles.handle} />

          {step === 'search' && (
            <>
              <Text style={styles.modalTitle}>Gift Credits</Text>
              <Text style={styles.modalSub}>Search for a colleague to send credits to</Text>

              <View style={styles.searchBox}>
                <Search size={15} color="#8E9099" strokeWidth={1.75} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or email..."
                  placeholderTextColor="#8E9099"
                  value={query}
                  onChangeText={setQuery}
                  autoFocus
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <X size={15} color="#8E9099" strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>

              {searching && <ActivityIndicator color="#1C3D5A" style={{ marginTop: 20 }} />}

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
                    <ChevronRight size={16} color="#8E9099" strokeWidth={1.75} />
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
                placeholder="Add a note..."
                placeholderTextColor="#8E9099"
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
                  : <Text style={styles.giftBtnTxt}>Send {amount} Credits</Text>
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
    Alert.alert('Sent', `${result.amount} credits gifted to ${result.recipient_name}.`);
    load();
  };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#1C3D5A" /></View>;
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#1C3D5A" />}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.title}>Wallet</Text>
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

        <TouchableOpacity style={styles.giftRow} onPress={() => setShowGift(true)} activeOpacity={0.8}>
          <View style={styles.giftRowLeft}>
            <View style={styles.giftRowIconWrap}>
              <Gift size={18} color="#1C3D5A" strokeWidth={1.75} />
            </View>
            <View>
              <Text style={styles.giftRowTitle}>Gift Credits</Text>
              <Text style={styles.giftRowSub}>Send credits to a colleague</Text>
            </View>
          </View>
          <ChevronRight size={16} color="#8E9099" strokeWidth={1.75} />
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
  container: { flex: 1, backgroundColor: '#F7F7F8' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#EEEFF2' },
  title: { fontSize: 22, fontWeight: '700', color: '#0A0A0B', letterSpacing: -0.3 },

  balanceCard: {
    margin: 16, padding: 28, borderRadius: 16,
    backgroundColor: '#1C3D5A',
    shadowColor: '#0A0A0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
    alignItems: 'center',
  },
  balanceLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '500' },
  balanceNum: { color: '#FFFFFF', fontSize: 56, fontWeight: '700', marginTop: 4, letterSpacing: -1 },
  balanceCredits: { color: 'rgba(255,255,255,0.65)', fontSize: 16, marginTop: 2 },
  expires: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 12 },

  giftRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 8, padding: 14,
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EEEFF2',
  },
  giftRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  giftRowIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E8EDF2', alignItems: 'center', justifyContent: 'center' },
  giftRowTitle: { fontSize: 14, fontWeight: '600', color: '#0A0A0B' },
  giftRowSub: { fontSize: 12, color: '#8E9099', marginTop: 1 },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8E9099', marginHorizontal: 16, marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 6,
    padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#EEEFF2',
  },
  txIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: '500', color: '#0A0A0B' },
  txDate: { fontSize: 12, color: '#8E9099', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#8E9099', marginTop: 40, fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,10,11,0.48)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40,
    maxHeight: '90%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#EEEFF2', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0A0A0B', marginBottom: 4, letterSpacing: -0.2 },
  modalSub: { fontSize: 13, color: '#8E9099', marginBottom: 18 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F7F8',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 8,
    borderWidth: 1, borderColor: '#EEEFF2',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#0A0A0B' },

  userRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EEEFF2', gap: 12,
  },
  userAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEEFF2',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  userAvatarImg: { width: 40, height: 40 },
  userAvatarLetter: { fontSize: 16, fontWeight: '700', color: '#1C3D5A' },
  userName: { fontSize: 14, fontWeight: '600', color: '#0A0A0B' },
  userEmail: { fontSize: 12, color: '#8E9099', marginTop: 1 },
  noResults: { textAlign: 'center', color: '#8E9099', marginTop: 24, fontSize: 14 },

  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 4 },
  backArrow: { fontSize: 22, color: '#1C3D5A', lineHeight: 26 },
  backLabel: { fontSize: 14, color: '#1C3D5A', fontWeight: '600' },

  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  recipientName: { fontSize: 16, fontWeight: '700', color: '#0A0A0B' },
  balanceHint: { fontSize: 13, color: '#5B5E66', fontWeight: '500', marginBottom: 20 },

  sectionLabel: { fontSize: 11, fontWeight: '600', color: '#8E9099', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  chip: {
    flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: '#F7F7F8',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent',
  },
  chipSelected: { backgroundColor: '#E8EDF2', borderColor: '#1C3D5A' },
  chipDisabled: { opacity: 0.35 },
  chipText: { fontSize: 15, fontWeight: '600', color: '#8E9099' },
  chipTextSelected: { color: '#1C3D5A' },

  noteInput: {
    backgroundColor: '#F7F7F8', borderRadius: 10, borderWidth: 1, borderColor: '#EEEFF2',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0A0A0B', marginBottom: 20,
  },
  giftBtn: {
    backgroundColor: '#1C3D5A', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  giftBtnDisabled: { backgroundColor: '#D4D6DC' },
  giftBtnTxt: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelTxt: { fontSize: 14, color: '#8E9099', fontWeight: '500' },
});
