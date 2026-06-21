import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Trophy, Sparkles, Gift, ChevronRight } from 'lucide-react-native';
import {
  getWallet, getFeaturedPerks, getCategories, getCompanyFeed, donateCredits,
  getBirthdaysToday, getBirthdayGiftsReceived, getChallengeWinNotifications,
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import BirthdayPopup from '../../components/BirthdayPopup';
import BirthdayGiftsPopup from '../../components/BirthdayGiftsPopup';
import ChallengeWinPopup from '../../components/ChallengeWinPopup';

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
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1C3D5A" />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#1C3D5A" />}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View>
            <Text style={styles.greeting}>Good morning, {firstName}</Text>
            <Text style={styles.subGreeting}>Ready to explore your perks?</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/life-moments')} style={styles.heartBtn}>
            <Heart size={20} color="#5B5E66" strokeWidth={1.75} />
          </TouchableOpacity>
        </View>

        {/* Wallet Card */}
        {wallet && (
          <TouchableOpacity style={styles.walletCard} onPress={() => router.push('/wallet')}>
            <Text style={styles.walletLabel}>Credit Balance</Text>
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
            <Text style={styles.feedTitle}>Team Support</Text>
            {companyFeed.map((event) => (
              <View key={event.id} style={styles.feedCard}>
                <View style={styles.feedLeft}>
                  <View style={styles.feedDot} />
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
                  <Text style={styles.feedDonateTxt}>Send Care</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Challenges Card */}
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/challenges')}>
          <View style={[styles.actionIcon, { backgroundColor: '#F7F7F8' }]}>
            <Trophy size={18} color="#1C3D5A" strokeWidth={1.75} />
          </View>
          <View style={styles.actionLeft}>
            <Text style={styles.actionTitle}>Challenges</Text>
            <Text style={styles.actionSub}>Compete with your team for bonus credits</Text>
          </View>
          <ChevronRight size={16} color="#8E9099" strokeWidth={1.75} />
        </TouchableOpacity>

        {/* AI Assistant Card */}
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/ai-assistant')}>
          <View style={[styles.actionIcon, { backgroundColor: '#F7F7F8' }]}>
            <Sparkles size={18} color="#1C3D5A" strokeWidth={1.75} />
          </View>
          <View style={styles.actionLeft}>
            <Text style={styles.actionTitle}>Wellness AI</Text>
            <Text style={styles.actionSub}>Ask me what to redeem today</Text>
          </View>
          <ChevronRight size={16} color="#8E9099" strokeWidth={1.75} />
        </TouchableOpacity>

        {/* Secret Santa Card */}
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/santa')}>
          <View style={[styles.actionIcon, { backgroundColor: '#F7F7F8' }]}>
            <Gift size={18} color="#1C3D5A" strokeWidth={1.75} />
          </View>
          <View style={styles.actionLeft}>
            <Text style={styles.actionTitle}>Secret Santa</Text>
            <Text style={styles.actionSub}>Gift exchange with your team</Text>
          </View>
          <ChevronRight size={16} color="#8E9099" strokeWidth={1.75} />
        </TouchableOpacity>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Browse by Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              android_ripple={null}
              style={({ pressed }) => [styles.categoryChip, pressed && { opacity: 0.7 }]}
              onPress={() => router.push({ pathname: '/(tabs)/catalog', params: { category: cat.name } })}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </Pressable>
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Text style={styles.perkCategory}>{perk.category_name}</Text>
                {perk.review_count >= 10 && perk.avg_rating != null && (
                  <Text style={styles.perkRating}>★ {Number(perk.avg_rating).toFixed(1)}</Text>
                )}
              </View>
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
  container: { flex: 1, backgroundColor: '#F7F7F8' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#EEEFF2',
  },
  greeting: { fontSize: 20, fontWeight: '700', color: '#0A0A0B', letterSpacing: -0.3 },
  subGreeting: { fontSize: 13, color: '#8E9099', marginTop: 3 },
  heartBtn: { padding: 8 },

  // Wallet card — deep navy, no glow
  walletCard: {
    margin: 16, padding: 24, borderRadius: 16,
    backgroundColor: '#1C3D5A',
    shadowColor: '#0A0A0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },
  walletLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '500' },
  walletBalance: { color: '#FFFFFF', fontSize: 48, fontWeight: '700', marginTop: 4, letterSpacing: -1 },
  walletCredits: { color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 2 },
  expireBadge: {
    marginTop: 14, backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, alignSelf: 'flex-start',
  },
  expireText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500' },

  // Feed section
  feedSection: { marginHorizontal: 16, marginTop: 8, marginBottom: 4 },
  feedTitle: { fontSize: 13, fontWeight: '600', color: '#8E9099', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  feedCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 6,
    borderWidth: 1, borderColor: '#EEEFF2',
  },
  feedLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  feedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1C3D5A' },
  feedName: { fontSize: 14, fontWeight: '600', color: '#0A0A0B' },
  feedType: { fontSize: 12, color: '#8E9099', marginTop: 1 },
  feedDonations: { fontSize: 11, color: '#5B5E66', fontWeight: '500', marginTop: 3 },
  feedDonateBtn: {
    backgroundColor: '#F7F7F8', borderWidth: 1, borderColor: '#D4D6DC',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
  },
  feedDonateTxt: { fontSize: 12, fontWeight: '600', color: '#1C3D5A' },

  // Action cards (challenges, AI, santa) — unified style
  actionCard: {
    marginHorizontal: 16, marginBottom: 6, padding: 14,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#EEEFF2',
  },
  actionIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLeft: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '600', color: '#0A0A0B' },
  actionSub: { fontSize: 12, color: '#8E9099', marginTop: 1 },

  // Section title
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8E9099', marginHorizontal: 16, marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Categories
  categoryRow: { paddingHorizontal: 16, gap: 8 },
  categoryChip: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#EEEFF2', minWidth: 72,
  },
  categoryIcon: { fontSize: 20, marginBottom: 4 },
  categoryName: { fontSize: 11, fontWeight: '500', color: '#5B5E66' },

  // Perk cards
  perkCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 6, padding: 14,
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EEEFF2',
  },
  perkInfo: { flex: 1 },
  perkName: { fontSize: 14, fontWeight: '600', color: '#0A0A0B' },
  perkProvider: { fontSize: 12, color: '#8E9099', marginTop: 2 },
  perkCategory: { fontSize: 11, color: '#5B5E66', fontWeight: '500' },
  perkPrice: { alignItems: 'flex-end', marginLeft: 12 },
  perkPriceNum: { fontSize: 20, fontWeight: '700', color: '#1C3D5A' },
  perkPriceLabel: { fontSize: 11, color: '#8E9099', fontWeight: '500' },
  perkRating: { fontSize: 11, fontWeight: '600', color: '#8E9099' },

  emptyText: { textAlign: 'center', color: '#8E9099', marginTop: 20, fontSize: 14 },
});
