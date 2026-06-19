import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getPerkById, redeemPerk, getWallet } from '../../lib/api';

export default function PerkDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [perk, setPerk] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [p, w] = await Promise.all([getPerkById(id), getWallet()]);
        setPerk(p);
        setWallet(w);
      } catch (e) {
        Alert.alert('Error', 'Could not load perk details.');
      } finally {
        setLoading(false);
      }
    }
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
        <View style={styles.imagePlaceholder}>
          <Text style={{ fontSize: 64 }}>🎁</Text>
        </View>

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
  imagePlaceholder: {
    height: 200, backgroundColor: '#eef2ff',
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
