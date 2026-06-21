import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  StyleSheet, ActivityIndicator, RefreshControl, Alert, Modal, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Package, ChevronDown, ChevronUp, Tag, Zap, Star, CheckCircle } from 'lucide-react-native';
import { getCompanyPackages, redeemPackage, getWallet } from '../../lib/api';

const { width: W } = Dimensions.get('window');

function AnimCard({ children, style, delay = 0 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 340, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true, speed: 14, bounciness: 4 }),
    ]).start();
  }, []);
  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export default function PackagesScreen() {
  const insets = useSafeAreaInsets();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [balance, setBalance] = useState(null);
  const [redeeming, setRedeeming] = useState(null);
  const [successModal, setSuccessModal] = useState(null);

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
    const discountLine = discount > 0 ? `\n🏷️ ${discount}% bundle discount applied` : '';
    Alert.alert(
      'Redeem Package',
      `"${pkg.name}" costs ${finalPrice} credits.${discountLine}\n\nYour balance: ${balance ?? '...'} credits`,
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
              load();
            } catch (e) {
              Alert.alert('Error', e.message || 'Could not redeem package.');
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
      <LinearGradient colors={['#1C3D5A', '#0A1F2E']} style={s.loader}>
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  const discountedCount = packages.filter(p => (Number(p.discount_percentage) || 0) > 0).length;

  return (
    <>
      <ScrollView
        style={s.root}
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#fff" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <LinearGradient colors={['#1C3D5A', '#0D2236']} style={[s.header, { paddingTop: insets.top + 16 }]}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.headerTitle}>Exclusive Packages</Text>
              <Text style={s.headerSub}>Deals your company unlocked</Text>
            </View>
            <View style={s.headerBadge}>
              <Package size={18} color="rgba(255,255,255,0.85)" strokeWidth={1.75} />
            </View>
          </View>

          {/* Stats */}
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statNum}>{packages.length}</Text>
              <Text style={s.statLbl}>Packages</Text>
            </View>
            <View style={s.statSep} />
            <View style={s.statBox}>
              <Text style={s.statNum}>{discountedCount}</Text>
              <Text style={s.statLbl}>Discounted</Text>
            </View>
            <View style={s.statSep} />
            <View style={s.statBox}>
              <Text style={s.statNum}>{balance ?? '—'}</Text>
              <Text style={s.statLbl}>Your credits</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Cards ── */}
        <View style={s.list}>
          {packages.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Package size={30} color="#C4C6CC" strokeWidth={1.5} />
              </View>
              <Text style={s.emptyTitle}>No packages yet</Text>
              <Text style={s.emptySub}>When your employer accepts a provider deal,{'\n'}packages will appear here.</Text>
            </View>
          ) : packages.map((pkg, idx) => {
            const isOpen = expanded === pkg.id;
            const totalCredits = pkg.perks?.reduce((s, p) => s + Number(p.credit_price), 0) || 0;
            const discount = Number(pkg.discount_percentage) || 0;
            const finalPrice = pkg.discounted_price ?? (discount > 0 ? Math.round(totalCredits * (1 - discount / 100)) : totalCredits);
            const savings = discount > 0 ? totalCredits - finalPrice : 0;
            const providers = pkg.providers || [];
            const canAfford = balance === null || balance >= finalPrice;
            const busy = redeeming === pkg.id;

            return (
              <AnimCard key={pkg.id} delay={idx * 60}>
                <Pressable
                  onPress={() => setExpanded(isOpen ? null : pkg.id)}
                  style={({ pressed }) => [s.card, isOpen && s.cardOpen, pressed && s.cardPressed]}
                >
                  {/* Top accent strip for discounted packages */}
                  {discount > 0 && (
                    <LinearGradient
                      colors={['#059669', '#10B981']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={s.accentStrip}
                    >
                      <Tag size={9} color="#fff" strokeWidth={2.5} />
                      <Text style={s.accentTxt}>{discount}% BUNDLE DISCOUNT · SAVE {savings} CREDITS</Text>
                    </LinearGradient>
                  )}

                  {/* Main card content */}
                  <View style={s.cardBody}>
                    {/* Icon */}
                    <LinearGradient colors={['#1C3D5A', '#2B5D8A']} style={s.pkgIcon}>
                      <Package size={18} color="#fff" strokeWidth={1.75} />
                    </LinearGradient>

                    {/* Name + providers */}
                    <View style={s.cardInfo}>
                      <Text style={s.pkgName} numberOfLines={1}>{pkg.name}</Text>
                      <Text style={s.pkgProviders} numberOfLines={1}>
                        {providers.map(p => p.company_name || p.full_name).join(' × ')}
                      </Text>
                      <View style={s.exclusivePill}>
                        <Star size={8} color="#1C3D5A" strokeWidth={2.5} fill="#1C3D5A" />
                        <Text style={s.exclusiveTxt}>Company Exclusive</Text>
                      </View>
                    </View>

                    {/* Price + chevron */}
                    <View style={s.cardRight}>
                      {discount > 0 && (
                        <Text style={s.strikePrice}>{totalCredits} cr</Text>
                      )}
                      <Text style={s.finalPrice}>{finalPrice}</Text>
                      <Text style={s.creditLabel}>credits</Text>
                      <View style={s.chevron}>
                        {isOpen
                          ? <ChevronUp size={13} color="#9EA3AE" strokeWidth={2.5} />
                          : <ChevronDown size={13} color="#9EA3AE" strokeWidth={2.5} />}
                      </View>
                    </View>
                  </View>

                  {/* ── Expanded ── */}
                  {isOpen && (
                    <View style={s.expandWrap}>
                      <View style={s.divider} />

                      {pkg.description ? (
                        <Text style={s.desc}>{pkg.description}</Text>
                      ) : null}

                      {/* Perks list */}
                      <Text style={s.sectionLabel}>INCLUDED PERKS</Text>
                      <View style={s.perksList}>
                        {(pkg.perks || []).map((perk, pi) => (
                          <View key={perk.id} style={[s.perkRow, pi === (pkg.perks.length - 1) && { borderBottomWidth: 0 }]}>
                            <View style={s.perkDot} />
                            <View style={{ flex: 1 }}>
                              <Text style={s.perkName}>{perk.name}</Text>
                              {perk.category_name ? <Text style={s.perkCat}>{perk.category_name}</Text> : null}
                            </View>
                            <Text style={s.perkPrice}>{perk.credit_price} cr</Text>
                          </View>
                        ))}
                      </View>

                      {/* Price summary */}
                      {discount > 0 && (
                        <View style={s.summary}>
                          <View style={s.summaryRow}>
                            <Text style={s.summaryLbl}>Original</Text>
                            <Text style={s.summaryOriginal}>{totalCredits} credits</Text>
                          </View>
                          <View style={s.summaryRow}>
                            <Text style={[s.summaryLbl, { color: '#059669' }]}>Discount ({discount}%)</Text>
                            <Text style={s.summaryDiscount}>−{savings} credits</Text>
                          </View>
                          <View style={s.summaryDivider} />
                          <View style={s.summaryRow}>
                            <Text style={s.summaryFinalLbl}>You pay</Text>
                            <Text style={s.summaryFinal}>{finalPrice} credits</Text>
                          </View>
                        </View>
                      )}

                      {/* Redeem */}
                      <TouchableOpacity
                        style={[s.redeemBtn, (!canAfford || busy) && s.redeemBtnOff]}
                        onPress={() => handleRedeem(pkg)}
                        disabled={!canAfford || busy}
                        activeOpacity={0.82}
                      >
                        {busy ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <View style={s.redeemInner}>
                            <Zap size={15} color="#fff" strokeWidth={2.5} />
                            <Text style={s.redeemTxt}>
                              {canAfford ? `Redeem for ${finalPrice} credits` : 'Insufficient credits'}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </Pressable>
              </AnimCard>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Success modal ── */}
      <Modal visible={!!successModal} transparent animationType="fade" onRequestClose={() => setSuccessModal(null)}>
        <View style={s.overlay}>
          <Animated.View style={s.modal}>
            <LinearGradient colors={['#1C3D5A', '#0D2236']} style={s.modalTop}>
              <Text style={s.modalEmoji}>🎉</Text>
              <Text style={s.modalTitle}>Package Redeemed!</Text>
              <Text style={s.modalSub}>Your QR codes are ready</Text>
            </LinearGradient>

            <View style={s.modalBot}>
              {successModal?.discount_applied > 0 && (
                <View style={s.saveBadge}>
                  <Tag size={12} color="#059669" strokeWidth={2} />
                  <Text style={s.saveTxt}>{successModal.discount_applied}% bundle discount saved you credits</Text>
                </View>
              )}

              <View style={s.balRow}>
                <Text style={s.balLbl}>New balance</Text>
                <Text style={s.balVal}>{successModal?.new_balance} cr</Text>
              </View>

              <Text style={s.modalHint}>
                Find your redemption QR codes under Profile → My Redemptions
              </Text>

              <Pressable style={s.modalDoneBtn} onPress={() => setSuccessModal(null)}>
                <CheckCircle size={16} color="#fff" strokeWidth={2.5} />
                <Text style={s.modalDoneTxt}>Done</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F3F7' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { paddingHorizontal: 20, paddingBottom: 22 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  headerBadge: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 19, fontWeight: '900', color: '#fff' },
  statLbl: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  statSep: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.12)' },

  // List
  list: { padding: 14, gap: 12 },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 36 },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#EDEEF1', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0A1520', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#9EA3AE', textAlign: 'center', lineHeight: 20 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardOpen: { borderColor: '#1C3D5A', shadowOpacity: 0.1, shadowRadius: 14, elevation: 4 },
  cardPressed: { opacity: 0.95 },

  accentStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  accentTxt: { fontSize: 9.5, fontWeight: '800', color: '#fff', letterSpacing: 0.6 },

  cardBody: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },

  pkgIcon: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  cardInfo: { flex: 1 },
  pkgName: { fontSize: 14, fontWeight: '800', color: '#0A1520', letterSpacing: -0.1 },
  pkgProviders: { fontSize: 11, color: '#9EA3AE', marginTop: 2 },
  exclusivePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    marginTop: 6, alignSelf: 'flex-start',
    backgroundColor: '#EDF2FF', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6,
  },
  exclusiveTxt: { fontSize: 9.5, fontWeight: '700', color: '#1C3D5A' },

  cardRight: { alignItems: 'flex-end', flexShrink: 0 },
  strikePrice: { fontSize: 10, color: '#C4C6CC', textDecorationLine: 'line-through', marginBottom: 1 },
  finalPrice: { fontSize: 20, fontWeight: '900', color: '#1C3D5A', lineHeight: 22 },
  creditLabel: { fontSize: 9.5, color: '#9EA3AE', fontWeight: '600', marginTop: 1 },
  chevron: { marginTop: 6 },

  // Expanded
  expandWrap: { paddingHorizontal: 14, paddingBottom: 14 },
  divider: { height: 1, backgroundColor: '#F2F3F7', marginBottom: 12 },
  desc: { fontSize: 13, color: '#5B5E66', lineHeight: 19, marginBottom: 12 },

  sectionLabel: { fontSize: 9, fontWeight: '800', color: '#9EA3AE', letterSpacing: 1, marginBottom: 8 },

  perksList: {
    backgroundColor: '#F8F9FB', borderRadius: 12,
    borderWidth: 1, borderColor: '#EDEEF1', overflow: 'hidden',
    marginBottom: 12,
  },
  perkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#EDEEF1',
  },
  perkDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#1C3D5A', flexShrink: 0 },
  perkName: { fontSize: 13, fontWeight: '700', color: '#0A1520' },
  perkCat: { fontSize: 10, color: '#9EA3AE', marginTop: 1 },
  perkPrice: { fontSize: 12, fontWeight: '700', color: '#1C3D5A', marginLeft: 'auto' },

  summary: {
    backgroundColor: '#F8F9FB', borderRadius: 12,
    borderWidth: 1, borderColor: '#EDEEF1',
    padding: 12, gap: 8, marginBottom: 12,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLbl: { fontSize: 12, color: '#5B5E66', fontWeight: '500' },
  summaryOriginal: { fontSize: 12, color: '#C4C6CC', textDecorationLine: 'line-through' },
  summaryDiscount: { fontSize: 12, fontWeight: '700', color: '#059669' },
  summaryDivider: { height: 1, backgroundColor: '#EDEEF1' },
  summaryFinalLbl: { fontSize: 13, fontWeight: '800', color: '#0A1520' },
  summaryFinal: { fontSize: 16, fontWeight: '900', color: '#1C3D5A' },

  redeemBtn: {
    backgroundColor: '#1C3D5A', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: '#1C3D5A', shadowOpacity: 0.25,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  redeemBtnOff: { backgroundColor: '#C4C6CC', shadowOpacity: 0 },
  redeemInner: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  redeemTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 28 },
  modal: {
    backgroundColor: '#fff', borderRadius: 22, width: '100%',
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 28, shadowOffset: { width: 0, height: 10 },
  },
  modalTop: { alignItems: 'center', paddingTop: 32, paddingBottom: 28 },
  modalEmoji: { fontSize: 46, marginBottom: 10 },
  modalTitle: { fontSize: 21, fontWeight: '900', color: '#fff' },
  modalSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 },

  modalBot: { padding: 22, gap: 12 },

  saveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#ECFDF5', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  saveTxt: { fontSize: 12, fontWeight: '700', color: '#059669', flex: 1 },

  balRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F4F5F7', borderRadius: 12, padding: 14,
  },
  balLbl: { fontSize: 13, color: '#5B5E66', fontWeight: '600' },
  balVal: { fontSize: 18, fontWeight: '900', color: '#1C3D5A' },

  modalHint: { fontSize: 12, color: '#9EA3AE', textAlign: 'center', lineHeight: 18 },

  modalDoneBtn: {
    backgroundColor: '#1C3D5A', borderRadius: 13,
    paddingVertical: 14, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 7,
  },
  modalDoneTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
