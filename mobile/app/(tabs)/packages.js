import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert, Modal, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCompanyPackages, redeemPackage, getWallet } from '../../lib/api';

export default function PackagesScreen() {
  const insets = useSafeAreaInsets();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [balance, setBalance] = useState(null);
  const [redeeming, setRedeeming] = useState(null); // pkg id being redeemed
  const [successModal, setSuccessModal] = useState(null); // result data

  async function load() {
    try {
      const [pkgData, walletData] = await Promise.all([
        getCompanyPackages(),
        getWallet().catch(() => null),
      ]);
      setPackages(Array.isArray(pkgData) ? pkgData : pkgData?.results || []);
      if (walletData?.balance !== undefined) setBalance(Number(walletData.balance));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRedeem(pkg) {
    const totalCredits = pkg.perks?.reduce((s, p) => s + Number(p.credit_price), 0) || 0;
    const discount = Number(pkg.discount_percentage) || 0;
    const finalPrice = pkg.discounted_price ?? (discount > 0 ? Math.round(totalCredits * (1 - discount / 100)) : totalCredits);
    const discountLine = discount > 0 ? `\n${discount}% bundle discount applied!` : '';

    Alert.alert(
      'Redeem Package',
      `"${pkg.name}" costs ${finalPrice} credits.${discountLine}\nYour balance: ${balance ?? '...'} credits.\n\nProceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setRedeeming(pkg.id);
            try {
              const result = await redeemPackage(pkg.id);
              setBalance(result.new_balance);
              setSuccessModal(result);
            } catch (e) {
              Alert.alert('Failed', e.message || 'Could not redeem package.');
            } finally {
              setRedeeming(null);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#6366f1" />}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.title}>Exclusive Packages</Text>
          <Text style={styles.subtitle}>Special deals your company unlocked for you</Text>
          {balance !== null && (
            <View style={styles.balancePill}>
              <Text style={styles.balanceText}>💳 {balance} credits available</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {packages.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎁</Text>
              <Text style={styles.emptyTitle}>No packages yet</Text>
              <Text style={styles.emptyText}>
                When your employer accepts a special provider deal, it will appear here exclusively for your company.
              </Text>
            </View>
          ) : (
            packages.map((pkg) => {
              const isExpanded = expanded === pkg.id;
              const totalCredits = pkg.perks?.reduce((s, p) => s + Number(p.credit_price), 0) || 0;
              const discount = Number(pkg.discount_percentage) || 0;
              const finalPrice = pkg.discounted_price ?? (discount > 0 ? Math.round(totalCredits * (1 - discount / 100)) : totalCredits);
              const providers = pkg.providers || [];
              const canAfford = balance === null || balance >= finalPrice;
              const isRedeemingThis = redeeming === pkg.id;

              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={() => setExpanded(isExpanded ? null : pkg.id)}
                >
                  {/* Card header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIcon}>
                      <Text style={{ fontSize: 20 }}>📦</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>{pkg.name}</Text>
                      <Text style={styles.cardProviders}>
                        {providers.map((p) => p.company_name || p.full_name).join(' × ')}
                      </Text>
                    </View>
                    <View style={styles.cardRight}>
                      {discount > 0 && (
                        <Text style={styles.cardOriginalPrice}>{totalCredits} cr</Text>
                      )}
                      <Text style={styles.cardCredits}>{finalPrice}</Text>
                      <Text style={styles.cardCreditsLabel}>{discount > 0 ? `cr (${discount}% off)` : 'cr total'}</Text>
                      <Text style={styles.cardChevron}>{isExpanded ? '▲' : '▼'}</Text>
                    </View>
                  </View>

                  {/* Expanded perks */}
                  {isExpanded && (
                    <View style={styles.expanded}>
                      {pkg.description ? (
                        <Text style={styles.description}>{pkg.description}</Text>
                      ) : null}

                      <Text style={styles.perksLabel}>Included perks</Text>
                      {(pkg.perks || []).map((perk) => (
                        <View key={perk.id} style={styles.perkRow}>
                          <View style={styles.perkDot} />
                          <View style={styles.perkInfo}>
                            <Text style={styles.perkName}>{perk.name}</Text>
                            {perk.category_name ? (
                              <Text style={styles.perkCategory}>{perk.category_name}</Text>
                            ) : null}
                          </View>
                          <Text style={styles.perkPrice}>{perk.credit_price} cr</Text>
                        </View>
                      ))}

                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Original value</Text>
                        <Text style={[styles.totalValue, discount > 0 && styles.strikethrough]}>{totalCredits} credits</Text>
                      </View>
                      {discount > 0 && (
                        <View style={styles.totalRow}>
                          <Text style={[styles.totalLabel, { color: '#059669' }]}>Bundle discount</Text>
                          <Text style={[styles.totalValue, { color: '#059669' }]}>−{discount}%</Text>
                        </View>
                      )}
                      {discount > 0 && (
                        <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 4, paddingTop: 8 }]}>
                          <Text style={[styles.totalLabel, { fontWeight: '800', color: '#111827' }]}>You pay</Text>
                          <Text style={[styles.totalValue, { color: '#6366f1', fontSize: 18 }]}>{finalPrice} credits</Text>
                        </View>
                      )}

                      <View style={styles.exclusiveBadge}>
                        <Text style={styles.exclusiveText}>🔒 Exclusive to your company</Text>
                      </View>

                      {/* Redeem button */}
                      <TouchableOpacity
                        style={[
                          styles.redeemBtn,
                          (!canAfford || isRedeemingThis) && styles.redeemBtnDisabled,
                        ]}
                        onPress={() => handleRedeem(pkg)}
                        disabled={!canAfford || isRedeemingThis}
                        activeOpacity={0.8}
                      >
                        {isRedeemingThis ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.redeemBtnText}>
                            {canAfford ? `Redeem for ${finalPrice} credits` : 'Insufficient credits'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Success modal */}
      <Modal visible={!!successModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalIcon}>🎉</Text>
            <Text style={styles.modalTitle}>Package Redeemed!</Text>
            <Text style={styles.modalSub}>
              {successModal?.message}
            </Text>
            <Text style={styles.modalBalance}>
              New balance: {successModal?.new_balance} credits
            </Text>
            <Text style={styles.modalQrHint}>
              Check your wallet for individual perk QR codes.
            </Text>
            <Pressable
              style={styles.modalBtn}
              onPress={() => setSuccessModal(null)}
            >
              <Text style={styles.modalBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  balancePill: {
    marginTop: 10,
    backgroundColor: '#eef2ff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  balanceText: { fontSize: 13, fontWeight: '700', color: '#6366f1' },
  content: { padding: 16, gap: 12 },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 21 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardProviders: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardCredits: { fontSize: 18, fontWeight: '800', color: '#6366f1' },
  cardCreditsLabel: { fontSize: 11, color: '#6b7280' },
  cardChevron: { fontSize: 10, color: '#9ca3af', marginTop: 4 },
  expanded: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  description: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    paddingTop: 12,
    marginBottom: 12,
  },
  perksLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingTop: 12,
    marginBottom: 8,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
    gap: 10,
  },
  perkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366f1',
  },
  perkInfo: { flex: 1 },
  perkName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  perkCategory: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  perkPrice: { fontSize: 14, fontWeight: '700', color: '#6366f1' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  strikethrough: { textDecorationLine: 'line-through', color: '#9ca3af', fontWeight: '400' },
  cardOriginalPrice: { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through', textAlign: 'right' },
  exclusiveBadge: {
    marginTop: 12,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  exclusiveText: { fontSize: 12, fontWeight: '600', color: '#6366f1' },
  redeemBtn: {
    marginTop: 14,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  redeemBtnDisabled: {
    backgroundColor: '#d1d5db',
  },
  redeemBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  modalIcon: { fontSize: 48, marginBottom: 12 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 21, marginBottom: 12 },
  modalBalance: { fontSize: 18, fontWeight: '800', color: '#6366f1', marginBottom: 8 },
  modalQrHint: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginBottom: 20 },
  modalBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 40,
  },
  modalBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
