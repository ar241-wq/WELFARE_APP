import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
  Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Heart, Trophy, Sparkles, Gift, ChevronRight, Zap } from 'lucide-react-native';
import {
  getWallet, getFeaturedPerks, getCategories, getCompanyFeed, donateCredits,
  getBirthdaysToday, getBirthdayGiftsReceived, getChallengeWinNotifications,
  getSantaGiftNotifications, getChallenges, markBirthdayGiftsSeen,
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import BirthdayPopup from '../../components/BirthdayPopup';
import BirthdayGiftsPopup from '../../components/BirthdayGiftsPopup';
import ChallengeWinPopup from '../../components/ChallengeWinPopup';
import SantaGiftPopup from '../../components/SantaGiftPopup';

const { width: SCREEN_W } = Dimensions.get('window');

const CATEGORY_GRADIENTS = {
  'Fitness': ['#1C3D5A', '#2B5D8A'],
  'Food': ['#2D4A3E', '#3D6B5A'],
  'Learning': ['#1A3550', '#1E4A6E'],
  'Wellness': ['#1E3A4A', '#265068'],
  'Travel': ['#3A2E1C', '#5A4A2A'],
  'Entertainment': ['#2A1C3A', '#3D2855'],
};

function getHour() { return new Date().getHours(); }
function greeting() {
  const h = getHour();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function AnimatedCard({ delay = 0, children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 400, delay, useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={[{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    }, style]}>
      {children}
    </Animated.View>
  );
}

function PressableCard({ onPress, style, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const release = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  return (
    <Pressable onPressIn={press} onPressOut={release} onPress={onPress}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [companyFeed, setCompanyFeed] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [showBirthday, setShowBirthday] = useState(false);
  const [birthdayGifts, setBirthdayGifts] = useState([]);
  const [showBirthdayGifts, setShowBirthdayGifts] = useState(false);
  const [challengeWins, setChallengeWins] = useState([]);
  const [showChallengeWin, setShowChallengeWin] = useState(false);
  const [santaGifts, setSantaGifts] = useState([]);
  const [showSantaGifts, setShowSantaGifts] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pulse animation for wallet balance
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  async function load() {
    try {
      const [w, f, c, feed, bdays, bgifts, cwins, sgifts, chals] = await Promise.all([
        getWallet().catch(() => null),
        getFeaturedPerks().catch(() => []),
        getCategories().catch(() => []),
        getCompanyFeed().catch(() => []),
        getBirthdaysToday().catch(() => []),
        getBirthdayGiftsReceived().catch(() => []),
        getChallengeWinNotifications().catch(() => []),
        getSantaGiftNotifications().catch(() => []),
        getChallenges().catch(() => []),
      ]);
      setWallet(w);
      setFeatured(Array.isArray(f) ? f : f?.results || []);
      setCategories(Array.isArray(c) ? c : c?.results || []);
      setCompanyFeed(Array.isArray(feed) ? feed : []);
      const blist = Array.isArray(bdays) ? bdays : [];
      setBirthdays(blist);
      if (blist.length > 0) {
        const todayKey = `birthday_seen_${new Date().toISOString().slice(0, 10)}`;
        const alreadySeen = await AsyncStorage.getItem(todayKey).catch(() => null);
        if (!alreadySeen) setShowBirthday(true);
      }
      const glist = Array.isArray(bgifts) ? bgifts : [];
      if (glist.length > 0) { setBirthdayGifts(glist); setShowBirthdayGifts(true); }
      const wlist = Array.isArray(cwins) ? cwins : [];
      if (wlist.length > 0) { setChallengeWins(wlist); setShowChallengeWin(true); }
      const slist = Array.isArray(sgifts) ? sgifts : [];
      if (slist.length > 0) { setSantaGifts(slist); setShowSantaGifts(true); }
      const clist = Array.isArray(chals) ? chals : chals?.results || [];
      setChallenges(clist.filter(ch => ch.status === 'active').slice(0, 3));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Re-check notifications every time the home tab comes into focus
  useFocusEffect(useCallback(() => {
    async function checkNotifications() {
      const [cwins, bgifts, sgifts] = await Promise.all([
        getChallengeWinNotifications().catch(() => []),
        getBirthdayGiftsReceived().catch(() => []),
        getSantaGiftNotifications().catch(() => []),
      ]);
      const wlist = Array.isArray(cwins) ? cwins : [];
      if (wlist.length > 0) { setChallengeWins(wlist); setShowChallengeWin(true); }
      const glist = Array.isArray(bgifts) ? bgifts : [];
      if (glist.length > 0) { setBirthdayGifts(glist); setShowBirthdayGifts(true); }
      const slist = Array.isArray(sgifts) ? sgifts : [];
      if (slist.length > 0) { setSantaGifts(slist); setShowSantaGifts(true); }
    }
    checkNotifications();
  }, []));

  const handleDonate = (event) => {
    Alert.alert(
      `Support ${event.employee_name}`,
      `${event.employee_name} is going through ${event.event_type_display}. Send anonymous care credits?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '100 credits', onPress: () => sendDonation(event.id, 100) },
        { text: '250 credits', onPress: () => sendDonation(event.id, 250) },
        { text: '500 credits', onPress: () => sendDonation(event.id, 500) },
      ]
    );
  };

  const sendDonation = async (eventId, amount) => {
    try {
      await donateCredits(eventId, amount);
      Alert.alert('Sent', 'Your anonymous care credits have been sent.');
      load();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not send credits.');
    }
  };

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <LinearGradient colors={['#1C3D5A', '#0A1F2E']} style={styles.loader}>
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  const ACTION_ITEMS = [
    { icon: <Trophy size={20} color="#F4B942" strokeWidth={2} />, label: 'Challenges', sub: 'Win credits', route: '/challenges' },
    { icon: <Sparkles size={20} color="#A5C8FF" strokeWidth={2} />, label: 'Wellness AI', sub: 'Ask anything', route: '/ai-assistant' },
    { icon: <Gift size={20} color="#B8E0C8" strokeWidth={2} />, label: 'Secret Santa', sub: 'Gift exchange', route: '/santa' },
  ];

  return (
    <>
      {showBirthday && birthdays.length > 0 && (
        <BirthdayPopup people={birthdays} onClose={() => {
          const todayKey = `birthday_seen_${new Date().toISOString().slice(0, 10)}`;
          AsyncStorage.setItem(todayKey, '1').catch(() => {});
          setShowBirthday(false);
        }} />
      )}
      {showBirthdayGifts && birthdayGifts.length > 0 && (
        <BirthdayGiftsPopup gifts={birthdayGifts} onClose={() => { markBirthdayGiftsSeen().catch(() => {}); setShowBirthdayGifts(false); }} />
      )}
      {showChallengeWin && challengeWins.length > 0 && (
        <ChallengeWinPopup wins={challengeWins} onClose={() => setShowChallengeWin(false)} />
      )}
      {showSantaGifts && santaGifts.length > 0 && (
        <SantaGiftPopup gifts={santaGifts} onClose={() => setShowSantaGifts(false)} />
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#fff" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient Header + Wallet Card */}
        <LinearGradient
          colors={['#1C3D5A', '#0D2236']}
          style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
        >
          {/* Top row */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>{greeting()}, {firstName} 👋</Text>
              <Text style={styles.subGreeting}>Your wellness hub awaits</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/life-moments')} style={styles.heartBtn}>
              <Heart size={20} color="rgba(255,255,255,0.8)" strokeWidth={1.75} />
            </TouchableOpacity>
          </View>

          {/* Wallet card inside gradient */}
          {wallet && (
            <AnimatedCard delay={80}>
              <PressableCard onPress={() => router.push('/wallet')} style={styles.walletCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.13)', 'rgba(255,255,255,0.06)']}
                  style={styles.walletInner}
                >
                  <View style={styles.walletTop}>
                    <Text style={styles.walletLabel}>Credit Balance</Text>
                    <View style={styles.walletLiveBadge}>
                      <View style={styles.walletLiveDot} />
                      <Text style={styles.walletLiveTxt}>Live</Text>
                    </View>
                  </View>
                  <Animated.Text style={[styles.walletBalance, { transform: [{ scale: pulse }] }]}>
                    {wallet.balance}
                  </Animated.Text>
                  <Text style={styles.walletSub}>credits available</Text>
                  {wallet.expires_at && (
                    <View style={styles.expireBadge}>
                      <Text style={styles.expireText}>Expires {new Date(wallet.expires_at).toLocaleDateString()}</Text>
                    </View>
                  )}
                </LinearGradient>
              </PressableCard>
            </AnimatedCard>
          )}
          {/* Action Grid — inside gradient so glass effect is visible */}
          <AnimatedCard delay={140}>
            <View style={styles.actionGrid}>
              {ACTION_ITEMS.map((item, i) => (
                <PressableCard key={i} onPress={() => router.push(item.route)} style={styles.actionCell}>
                  <View style={styles.actionGradient}>
                    <View style={styles.actionIconWrap}>{item.icon}</View>
                    <Text style={styles.actionLabel}>{item.label}</Text>
                    <Text style={styles.actionSub}>{item.sub}</Text>
                  </View>
                </PressableCard>
              ))}
            </View>
          </AnimatedCard>
        </LinearGradient>

        {/* Team Support Feed */}
        {companyFeed.length > 0 && (
          <AnimatedCard delay={200}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.liveDot} />
                <Text style={styles.sectionTitle}>Team Support</Text>
              </View>
              {companyFeed.map((event) => (
                <PressableCard key={event.id} style={styles.feedCard}>
                  <View style={styles.feedLeft}>
                    <LinearGradient colors={['#1C3D5A', '#2B5D8A']} style={styles.feedAvatar}>
                      <Text style={styles.feedAvatarLetter}>{event.employee_name?.[0] || '?'}</Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <TouchableOpacity onPress={() => router.push(`/profile/${event.employee_id}`)}>
                        <Text style={styles.feedName}>{event.employee_name}</Text>
                      </TouchableOpacity>
                      <Text style={styles.feedType}>{event.event_type_display}</Text>
                      {event.total_donations > 0 && (
                        <Text style={styles.feedDonations}>❤️ {Number(event.total_donations)} credits from team</Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity style={styles.feedDonateBtn} onPress={() => handleDonate(event)}>
                    <Text style={styles.feedDonateTxt}>Send Care</Text>
                  </TouchableOpacity>
                </PressableCard>
              ))}
            </View>
          </AnimatedCard>
        )}

        {/* Active Challenges */}
        <AnimatedCard delay={230}>
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Trophy size={16} color="#F4B942" strokeWidth={2} />
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Active Challenges</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/challenges')}>
                <Text style={styles.seeAllTxt}>See all</Text>
              </TouchableOpacity>
            </View>
            {challenges.length > 0 ? challenges.map((ch) => {
              const daysLeft = ch.deadline
                ? Math.max(0, Math.ceil((new Date(ch.deadline) - Date.now()) / 86400000))
                : null;
              const TYPE_COLORS = { kpi: '#3B82F6', ai_challenge: '#8B5CF6', first_to: '#F59E0B', innovation: '#10B981', custom: '#1C3D5A' };
              const TYPE_LABELS = { kpi: 'KPI', ai_challenge: 'AI Challenge', first_to: 'First to Complete', innovation: 'Innovation', custom: 'Challenge' };
              const accentColor = TYPE_COLORS[ch.challenge_type] || '#1C3D5A';
              return (
                <PressableCard key={ch.id} onPress={() => router.push(`/challenges/${ch.id}`)} style={styles.challengeCard}>
                  <View style={[styles.challengeAccent, { backgroundColor: accentColor }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.challengeName} numberOfLines={1}>{ch.title}</Text>
                    <Text style={styles.challengeType}>{TYPE_LABELS[ch.challenge_type] || ch.challenge_type}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={styles.challengePrizePill}>
                      <Text style={styles.challengePrizeTxt}>🏆 {ch.reward_credits} cr</Text>
                    </View>
                    {daysLeft !== null && (
                      <View style={[styles.challengeDaysPill, daysLeft <= 3 && styles.challengeDaysUrgent]}>
                        <Text style={[styles.challengeDaysTxt, daysLeft <= 3 && styles.challengeDaysTxtUrgent]}>
                          {daysLeft === 0 ? 'Last day!' : `${daysLeft}d left`}
                        </Text>
                      </View>
                    )}
                  </View>
                </PressableCard>
              );
            }) : (
              <PressableCard onPress={() => router.push('/challenges')} style={styles.challengeCard}>
                <View style={[styles.challengeAccent, { backgroundColor: '#F4B942' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.challengeName}>No active challenges yet</Text>
                  <Text style={styles.challengeType}>Tap to browse challenges</Text>
                </View>
                <ChevronRight size={16} color="#C4C6CC" strokeWidth={2} />
              </PressableCard>
            )}
          </View>
        </AnimatedCard>

        {/* Browse by Category */}
        <AnimatedCard delay={260}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {categories.map((cat, i) => {
                const colors = CATEGORY_GRADIENTS[cat.name] || ['#1C3D5A', '#2B5D8A'];
                return (
                  <PressableCard
                    key={cat.id}
                    style={styles.categoryCard}
                    onPress={() => router.push({ pathname: '/(tabs)/catalog', params: { category: cat.name } })}
                  >
                    <LinearGradient colors={colors} style={styles.categoryGradient}>
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                    </LinearGradient>
                  </PressableCard>
                );
              })}
            </ScrollView>
          </View>
        </AnimatedCard>

        {/* Featured Perks */}
        <AnimatedCard delay={320}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Perks</Text>
            {featured.map((perk) => (
              <PressableCard
                key={perk.id}
                style={styles.perkCard}
                onPress={() => router.push(`/perk/${perk.id}`)}
              >
                <View style={styles.perkLeft}>
                  <Text style={styles.perkName}>{perk.name}</Text>
                  <Text style={styles.perkProvider}>{perk.provider_name}</Text>
                  <View style={styles.perkMeta}>
                    <View style={styles.perkCategoryPill}>
                      <Text style={styles.perkCategoryTxt}>{perk.category_name}</Text>
                    </View>
                    {perk.review_count >= 10 && perk.avg_rating != null && (
                      <Text style={styles.perkRating}>★ {Number(perk.avg_rating).toFixed(1)}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.perkPriceWrap}>
                  <LinearGradient colors={['#1C3D5A', '#2B5D8A']} style={styles.perkPricePill}>
                    <Text style={styles.perkPriceNum}>{perk.credit_price}</Text>
                    <Text style={styles.perkPriceLbl}>cr</Text>
                  </LinearGradient>
                  <ChevronRight size={14} color="#C4C6CC" strokeWidth={2} style={{ marginTop: 4 }} />
                </View>
              </PressableCard>
            ))}
            {featured.length === 0 && (
              <View style={styles.emptyBox}>
                <Zap size={28} color="#C4C6CC" strokeWidth={1.5} />
                <Text style={styles.emptyText}>No featured perks yet. Check the catalog!</Text>
              </View>
            )}
          </View>
        </AnimatedCard>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5F7' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Gradient header
  headerGradient: { paddingHorizontal: 20, paddingBottom: 28 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4 },
  subGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  heartBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },

  // Wallet card
  walletCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  walletInner: { padding: 24 },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  walletLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  walletLiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  walletLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  walletLiveTxt: { color: '#4ADE80', fontSize: 11, fontWeight: '700' },
  walletBalance: { color: '#FFFFFF', fontSize: 52, fontWeight: '900', letterSpacing: -2, lineHeight: 58 },
  walletSub: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 2 },
  expireBadge: { marginTop: 14, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, alignSelf: 'flex-start' },
  expireText: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500' },

  // Action grid
  actionGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 0, marginTop: 14 },
  actionCell: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  actionGradient: { padding: 14, alignItems: 'flex-start', minHeight: 100, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 16 },
  actionIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 13, fontWeight: '800', color: '#fff' },
  actionSub: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 3, lineHeight: 14 },

  // Section
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 0 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0A1520', letterSpacing: -0.2, marginBottom: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80', marginBottom: 12 },

  // Team feed
  feedCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#E8EAED',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  feedLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  feedAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  feedAvatarLetter: { color: '#fff', fontSize: 16, fontWeight: '800' },
  feedName: { fontSize: 14, fontWeight: '700', color: '#0A1520' },
  feedType: { fontSize: 12, color: '#8E9099', marginTop: 1 },
  feedDonations: { fontSize: 11, color: '#5B5E66', fontWeight: '500', marginTop: 3 },
  feedDonateBtn: {
    backgroundColor: '#F0F4F8', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: '#D4D6DC',
  },
  feedDonateTxt: { fontSize: 12, fontWeight: '700', color: '#1C3D5A' },

  // Categories
  categoryRow: { gap: 10, paddingBottom: 4 },
  categoryCard: { borderRadius: 14, overflow: 'hidden' },
  categoryGradient: { width: 80, height: 90, alignItems: 'center', justifyContent: 'center', gap: 6 },
  categoryIcon: { fontSize: 26 },
  categoryName: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)', textAlign: 'center' },

  // Perk cards
  perkCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: '#E8EAED',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  perkLeft: { flex: 1 },
  perkName: { fontSize: 14, fontWeight: '700', color: '#0A1520' },
  perkProvider: { fontSize: 12, color: '#8E9099', marginTop: 2 },
  perkMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  perkCategoryPill: { backgroundColor: '#F0F4F8', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  perkCategoryTxt: { fontSize: 11, color: '#1C3D5A', fontWeight: '600' },
  perkRating: { fontSize: 11, fontWeight: '600', color: '#8E9099' },
  perkPriceWrap: { alignItems: 'center', marginLeft: 12 },
  perkPricePill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  perkPriceNum: { fontSize: 16, fontWeight: '900', color: '#fff' },
  perkPriceLbl: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  emptyBox: { alignItems: 'center', padding: 32, gap: 12 },
  emptyText: { textAlign: 'center', color: '#8E9099', fontSize: 14 },

  seeAllTxt: { fontSize: 13, fontWeight: '700', color: '#1C3D5A' },

  // Challenge cards
  challengeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#E8EAED', overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    gap: 12,
  },
  challengeAccent: { width: 4, alignSelf: 'stretch', borderRadius: 4 },
  challengeName: { fontSize: 14, fontWeight: '700', color: '#0A1520' },
  challengeType: { fontSize: 11, color: '#8E9099', marginTop: 2, textTransform: 'capitalize' },
  challengePrizePill: { backgroundColor: '#FEF9E7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FDE68A' },
  challengePrizeTxt: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  challengeDaysPill: { backgroundColor: '#F0F4F8', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  challengeDaysTxt: { fontSize: 11, fontWeight: '600', color: '#5B5E66' },
  challengeDaysUrgent: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  challengeDaysTxtUrgent: { color: '#DC2626' },
});
