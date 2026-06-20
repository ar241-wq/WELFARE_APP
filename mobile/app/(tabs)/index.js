import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getWallet, getFeaturedPerks, getCategories, getCompanyFeed, donateCredits, getBirthdaysToday, getBirthdayGiftsReceived, getChallengeWinNotifications } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import BirthdayPopup from '../../components/BirthdayPopup';
import BirthdayGiftsPopup from '../../components/BirthdayGiftsPopup';
import ChallengeWinPopup from '../../components/ChallengeWinPopup';

const EVENT_ICONS = {
  new_baby: '🍼',
  medical: '🏥',
  relocation: '📦',
  bereavement: '🌹',
  burnout: '😮‍💨',
};

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const [w, f, c, feed, bdays, bgifts, cwins] = await Promise.all([
        getWallet(), getFeaturedPerks(), getCategories(),
        getCompanyFeed().catch(() => []),
        getBirthdaysToday().catch(() => []),
        getBirthdayGiftsReceived().catch(() => []),
        getChallengeWinNotifications().catch(() => []),
      ]);
      setWallet(w);
      setFeatured(Array.isArray(f) ? f : f?.results || []);
      setCategories(Array.isArray(c) ? c : c?.results || []);
      setCompanyFeed(Array.isArray(feed) ? feed : []);
      const blist = Array.isArray(bdays) ? bdays : [];
      setBirthdays(blist);
      if (blist.length > 0) setShowBirthday(true);
      const glist = Array.isArray(bgifts) ? bgifts : [];
      if (glist.length > 0) { setBirthdayGifts(glist); setShowBirthdayGifts(true); }
      const wlist = Array.isArray(cwins) ? cwins : [];
      if (wlist.length > 0) { setChallengeWins(wlist); setShowChallengeWin(true); }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleDonate = (event) => {
    Alert.alert(
      `Support ${event.employee_name} 💝`,
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
      Alert.alert('Sent! 💝', 'Your anonymous care credits have been sent.');
      load();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not send credits.');
    }
  };

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <>
    {showBirthday && birthdays.length > 0 && (
      <BirthdayPopup people={birthdays} onClose={() => setShowBirthday(false)} />
    )}
    {showBirthdayGifts && birthdayGifts.length > 0 && (
      <BirthdayGiftsPopup gifts={birthdayGifts} onClose={() => setShowBirthdayGifts(false)} />
    )}
    {showChallengeWin && challengeWins.length > 0 && (
      <ChallengeWinPopup wins={challengeWins} onClose={() => setShowChallengeWin(false)} />
    )}
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

      {/* Company Life Events Feed */}
      {companyFeed.length > 0 && (
        <View style={styles.feedSection}>
          <Text style={styles.feedTitle}>Your Team Needs Support 💙</Text>
          {companyFeed.map((event) => (
            <View key={event.id} style={styles.feedCard}>
              <View style={styles.feedLeft}>
                <Text style={styles.feedIcon}>{EVENT_ICONS[event.event_type] || '❤️'}</Text>
                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={() => router.push(`/profile/${event.employee_id}`)}>
                    <Text style={styles.feedName}>{event.employee_name}</Text>
                  </TouchableOpacity>
                  <Text style={styles.feedType}>{event.event_type_display}</Text>
                  {event.total_donations > 0 && (
                    <Text style={styles.feedDonations}>{Number(event.total_donations)} credits sent by team</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.feedDonateBtn} onPress={() => handleDonate(event)}>
                <Text style={styles.feedDonateTxt}>Send Care 💝</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Challenges Card */}
      <TouchableOpacity style={styles.challengeCard} onPress={() => router.push('/challenges')}>
        <View style={styles.aiLeft}>
          <Text style={styles.challengeTitle}>🏆  Challenges</Text>
          <Text style={styles.challengeSub}>Compete with your team for bonus credits</Text>
        </View>
        <View style={styles.aiChevron}>
          <Text style={{ color: '#d97706', fontSize: 20 }}>›</Text>
        </View>
      </TouchableOpacity>

      {/* AI Assistant Card */}
      <TouchableOpacity style={styles.aiCard} onPress={() => router.push('/ai-assistant')}>
        <View style={styles.aiLeft}>
          <Text style={styles.aiTitle}>✦  Wellness AI</Text>
          <Text style={styles.aiSub}>Ask me what to redeem today</Text>
        </View>
        <View style={styles.aiChevron}>
          <Text style={{ color: '#6366f1', fontSize: 20 }}>›</Text>
        </View>
      </TouchableOpacity>

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
    </>
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

  // Company feed
  feedSection: { marginHorizontal: 16, marginTop: 16 },
  feedTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 10 },
  feedCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 8,
    borderWidth: 1.5, borderColor: '#fce7f3',
  },
  feedLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  feedIcon: { fontSize: 28 },
  feedName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  feedType: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  feedDonations: { fontSize: 11, color: '#ec4899', fontWeight: '600', marginTop: 3 },
  feedDonateBtn: {
    backgroundColor: '#fdf2f8', borderWidth: 1.5, borderColor: '#f9a8d4',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
  },
  feedDonateTxt: { fontSize: 12, fontWeight: '700', color: '#ec4899' },

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
  challengeCard: {
    marginHorizontal: 16, marginBottom: 8, padding: 16,
    backgroundColor: '#fffbeb', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#fde68a',
  },
  challengeTitle: { fontSize: 15, fontWeight: '800', color: '#92400e' },
  challengeSub: { fontSize: 13, color: '#d97706', marginTop: 2 },
  aiCard: {
    marginHorizontal: 16, marginBottom: 8, padding: 16,
    backgroundColor: '#eef2ff', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#c7d2fe',
  },
  aiLeft: { flex: 1 },
  aiTitle: { fontSize: 15, fontWeight: '800', color: '#4338ca' },
  aiSub: { fontSize: 13, color: '#6366f1', marginTop: 2 },
  aiChevron: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
