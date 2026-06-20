import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image,
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
function imgSrc(path) {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${API_URL}${path}`;
}
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getPerkById, redeemPerk, getWallet, getPerkGroupBuys, startGroupBuy, joinGroupBuy, lockInGroupBuy } from '../../lib/api';

function GroupBuySection({ perkId, groupBuys, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const activeGroupBuys = groupBuys.filter(gb => gb.is_active);
  const myGroupBuy = activeGroupBuys.find(gb => gb.is_member);

  const discountLabel = (rate) => {
    if (rate >= 0.15) return '15% OFF';
    if (rate >= 0.10) return '10% OFF';
    if (rate >= 0.05) return '5% OFF';
    return 'Join more to unlock discount';
  };

  const nextThreshold = (count) => {
    if (count >= 10) return null;
    if (count >= 5) return { need: 10 - count, discount: '15%' };
    if (count >= 3) return { need: 5 - count, discount: '10%' };
    return { need: 3 - count, discount: '5%' };
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      await startGroupBuy(perkId);
      onRefresh();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally { setLoading(false); }
  };

  const handleJoin = async (id) => {
    setLoading(true);
    try {
      await joinGroupBuy(id);
      onRefresh();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally { setLoading(false); }
  };

  const handleLockIn = async (id) => {
    Alert.alert('Lock In', 'Pay at the discounted price now?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Lock In', onPress: async () => {
        setLoading(true);
        try {
          const res = await lockInGroupBuy(id);
          Alert.alert('Done!', res.detail);
          onRefresh();
        } catch (e) {
          Alert.alert('Error', e.message);
        } finally { setLoading(false); }
      }},
    ]);
  };

  return (
    <View style={gb.section}>
      <View style={gb.header}>
        <Text style={gb.title}>💪 Group Buy</Text>
        <Text style={gb.sub}>Buy together, save together</Text>
      </View>

      {/* Discount tiers */}
      <View style={gb.tiersRow}>
        {[{n:3,d:'5%'},{n:5,d:'10%'},{n:10,d:'15%'}].map(t => (
          <View key={t.n} style={gb.tier}>
            <Text style={gb.tierN}>{t.n}+</Text>
            <Text style={gb.tierD}>{t.d}</Text>
          </View>
        ))}
      </View>

      {/* Active group buys */}
      {activeGroupBuys.map(buy => {
        const next = nextThreshold(buy.member_count);
        return (
          <View key={buy.id} style={gb.buyCard}>
            <View style={gb.buyTop}>
              <View style={[gb.discountBadge, buy.discount_rate > 0 && gb.discountBadgeActive]}>
                <Text style={[gb.discountTxt, buy.discount_rate > 0 && gb.discountTxtActive]}>
                  {buy.discount_rate > 0 ? discountLabel(buy.discount_rate) : 'Need 3+ to unlock'}
                </Text>
              </View>
              <Text style={gb.memberCount}>👥 {buy.member_count} joined</Text>
            </View>

            {buy.discount_rate > 0 && (
              <View style={gb.priceRow}>
                <Text style={gb.originalPrice}>{buy.original_price} cr</Text>
                <Text style={gb.discountedPrice}>{Math.ceil(buy.discounted_price)} cr</Text>
                <Text style={gb.savings}>-{Math.floor(buy.savings)} credits saved</Text>
              </View>
            )}

            {next && (
              <Text style={gb.nextHint}>+{next.need} more to unlock {next.discount}</Text>
            )}

            <Text style={gb.members}>{buy.members_preview.join(', ')}{buy.member_count > 5 ? ` +${buy.member_count - 5} more` : ''}</Text>

            <View style={gb.actions}>
              {!buy.is_member && (
                <TouchableOpacity style={gb.joinBtn} onPress={() => handleJoin(buy.id)} disabled={loading}>
                  <Text style={gb.joinTxt}>Join This Group</Text>
                </TouchableOpacity>
              )}
              {buy.is_member && !buy.is_locked_in && (
                <>
                  <TouchableOpacity style={gb.lockBtn} onPress={() => handleLockIn(buy.id)} disabled={loading}>
                    <Text style={gb.lockTxt}>🔒 Lock In & Pay {Math.ceil(buy.discounted_price)} cr</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={gb.leaveBtn} onPress={() => handleJoin(buy.id)} disabled={loading}>
                    <Text style={gb.leaveTxt}>Leave</Text>
                  </TouchableOpacity>
                </>
              )}
              {buy.is_locked_in && (
                <View style={gb.lockedBadge}>
                  <Text style={gb.lockedTxt}>✓ You're locked in!</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}

      {/* Start new group buy */}
      {!myGroupBuy && (
        <TouchableOpacity style={gb.startBtn} onPress={handleStart} disabled={loading}>
          {loading ? <ActivityIndicator color="#6366f1" /> : <Text style={gb.startTxt}>Start a Group Buy</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

const gb = StyleSheet.create({
  section: { margin: 16, marginTop: 8 },
  header: { marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800', color: '#111' },
  sub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  tiersRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tier: { flex: 1, backgroundColor: '#eef2ff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#c7d2fe' },
  tierN: { fontSize: 18, fontWeight: '900', color: '#6366f1' },
  tierD: { fontSize: 13, fontWeight: '700', color: '#4338ca', marginTop: 2 },
  buyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#e5e7eb' },
  buyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  discountBadge: { backgroundColor: '#f3f4f6', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  discountBadgeActive: { backgroundColor: '#dcfce7' },
  discountTxt: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  discountTxtActive: { color: '#16a34a' },
  memberCount: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  originalPrice: { fontSize: 14, color: '#9ca3af', textDecorationLine: 'line-through' },
  discountedPrice: { fontSize: 22, fontWeight: '900', color: '#6366f1' },
  savings: { fontSize: 12, color: '#16a34a', fontWeight: '700', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  nextHint: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  members: { fontSize: 12, color: '#9ca3af', marginBottom: 12 },
  actions: { gap: 8 },
  joinBtn: { backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  joinTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  lockBtn: { backgroundColor: '#111', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  lockTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  leaveBtn: { borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  leaveTxt: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  lockedBadge: { backgroundColor: '#dcfce7', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  lockedTxt: { color: '#16a34a', fontWeight: '800', fontSize: 14 },
  startBtn: { borderWidth: 1.5, borderColor: '#6366f1', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderStyle: 'dashed' },
  startTxt: { color: '#6366f1', fontWeight: '700', fontSize: 14 },
});

export default function PerkDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [perk, setPerk] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [groupBuys, setGroupBuys] = useState([]);

  async function load() {
    try {
      const [p, w, gbs] = await Promise.all([getPerkById(id), getWallet(), getPerkGroupBuys(id)]);
      setPerk(p);
      setWallet(w);
      setGroupBuys(gbs);
    } catch (e) {
      Alert.alert('Error', 'Could not load perk details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleRedeem() {
    if (!perk || !wallet) return;
    if (parseFloat(wallet.balance) < parseFloat(perk.credit_price)) {
      Alert.alert('Insufficient Credits', `You need ${perk.credit_price} credits but only have ${wallet.balance}.`);
      return;
    }
    Alert.alert(
      'Confirm Redemption',
      `Redeem ${perk.name} for ${perk.credit_price} credits?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem', onPress: async () => {
            setRedeeming(true);
            try {
              const redemption = await redeemPerk(perk.id);
              router.replace({
                pathname: `/redeem/${redemption.id}`,
                params: { perk_name: perk.name, perk_price: perk.credit_price },
              });
            } catch (err) {
              Alert.alert('Failed', err.message || 'Could not redeem perk.');
            } finally {
              setRedeeming(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#6366f1" /></View>;
  }

  if (!perk) {
    return <View style={styles.loader}><Text>Perk not found.</Text></View>;
  }

  const canAfford = wallet && parseFloat(wallet.balance) >= parseFloat(perk.credit_price);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {perk.images?.[0] ? (
          <Image
            source={{ uri: imgSrc(perk.images[0].image) }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={{ fontSize: 64 }}>🎁</Text>
          </View>
        )}

        <View style={styles.content}>
          {perk.is_featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>⭐ Featured</Text>
            </View>
          )}

          <Text style={styles.name}>{perk.name}</Text>

          <View style={styles.providerRow}>
            <Text style={styles.provider}>{perk.provider_name}</Text>
            {perk.provider_verified && <Text style={styles.verified}>✓ Verified</Text>}
          </View>

          <Text style={styles.category}>{perk.category_name}</Text>

          <View style={styles.priceCard}>
            <Text style={styles.priceNum}>{perk.credit_price}</Text>
            <Text style={styles.priceLabel}>credits</Text>
          </View>

          <Text style={styles.descTitle}>About this perk</Text>
          <Text style={styles.desc}>{perk.description}</Text>

          {perk.tags && perk.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {perk.tags.map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {wallet && (
            <View style={styles.walletInfo}>
              <Text style={styles.walletInfoText}>Your balance: <Text style={styles.walletInfoBold}>{wallet.balance} credits</Text></Text>
              {!canAfford && (
                <Text style={styles.insufficientText}>Not enough credits for this perk</Text>
              )}
            </View>
          )}
        </View>

        <GroupBuySection perkId={id} groupBuys={groupBuys} onRefresh={load} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.redeemBtn, !canAfford && styles.redeemBtnDisabled]}
          onPress={handleRedeem}
          disabled={!canAfford || redeeming}
        >
          {redeeming ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.redeemText}>
              {canAfford ? `Redeem for ${perk.credit_price} credits` : 'Insufficient Credits'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroImage: { width: '100%', height: 220 },
  imagePlaceholder: {
    height: 220, backgroundColor: '#eef2ff',
    justifyContent: 'center', alignItems: 'center',
  },
  content: { padding: 20 },
  featuredBadge: {
    alignSelf: 'flex-start', backgroundColor: '#fef3c7',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10,
  },
  featuredText: { fontSize: 12, color: '#d97706', fontWeight: '700' },
  name: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  provider: { fontSize: 15, color: '#6b7280', fontWeight: '500' },
  verified: { fontSize: 12, color: '#059669', fontWeight: '700', backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  category: { fontSize: 13, color: '#6366f1', fontWeight: '600', marginBottom: 16 },
  priceCard: {
    flexDirection: 'row', alignItems: 'baseline', gap: 6,
    backgroundColor: '#eef2ff', padding: 16, borderRadius: 16, marginBottom: 20,
  },
  priceNum: { fontSize: 36, fontWeight: '800', color: '#6366f1' },
  priceLabel: { fontSize: 16, color: '#6366f1', fontWeight: '500' },
  descTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  desc: { fontSize: 15, color: '#4b5563', lineHeight: 22, marginBottom: 16 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: { backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  walletInfo: { backgroundColor: '#f9fafb', padding: 14, borderRadius: 12, marginTop: 8 },
  walletInfoText: { fontSize: 14, color: '#6b7280' },
  walletInfoBold: { fontWeight: '700', color: '#111827' },
  insufficientText: { fontSize: 13, color: '#dc2626', marginTop: 4, fontWeight: '600' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#f3f4f6',
  },
  redeemBtn: {
    backgroundColor: '#6366f1', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  redeemBtnDisabled: { backgroundColor: '#d1d5db' },
  redeemText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
