import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Dimensions, Animated, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSantaEvent, sendSantaGiftPerk, getPerks } from '../../lib/api';

const { width: W, height: H } = Dimensions.get('window');
const EMOJIS = ['🎁', '🎄', '⭐', '❄️', '🎅', '🦌', '🔔', '✨'];
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// ── Confetti particle ────────────────────────────────────────────────────────
function Particle({ delay }) {
  const x = useRef(new Animated.Value(Math.random() * W)).current;
  const y = useRef(new Animated.Value(-40)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  const size = 18 + Math.random() * 20;
  const duration = 1800 + Math.random() * 1400;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(y, { toValue: H * 0.8, duration, useNativeDriver: true }),
        Animated.timing(x, { toValue: x._value + (Math.random() - 0.5) * 220, duration, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 6, duration, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(duration * 0.55),
          Animated.timing(opacity, { toValue: 0, duration: duration * 0.45, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 6], outputRange: ['0deg', '1080deg'] });
  return (
    <Animated.Text style={{
      position: 'absolute', fontSize: size, top: 0,
      transform: [{ translateX: x }, { translateY: y }, { rotate: spin }], opacity,
    }}>
      {emoji}
    </Animated.Text>
  );
}

function ConfettiBurst({ visible }) {
  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 32 }).map((_, i) => <Particle key={i} delay={i * 50} />)}
    </View>
  );
}

// ── Gift box reveal animation ────────────────────────────────────────────────
function GiftReveal({ giftReceived, onDone }) {
  const lidY = useRef(new Animated.Value(0)).current;
  const lidOpacity = useRef(new Animated.Value(1)).current;
  const contentScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const boxScale = useRef(new Animated.Value(1)).current;
  const [phase, setPhase] = useState('box'); // 'box' | 'open' | 'done'

  function openBox() {
    setPhase('open');
    Animated.sequence([
      // Shake
      Animated.sequence([
        Animated.timing(boxScale, { toValue: 1.08, duration: 120, useNativeDriver: true }),
        Animated.timing(boxScale, { toValue: 0.96, duration: 100, useNativeDriver: true }),
        Animated.timing(boxScale, { toValue: 1.05, duration: 100, useNativeDriver: true }),
        Animated.timing(boxScale, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]),
      // Lid flies up
      Animated.parallel([
        Animated.timing(lidY, { toValue: -120, duration: 400, useNativeDriver: true }),
        Animated.timing(lidOpacity, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
      // Content pops out
      Animated.parallel([
        Animated.spring(contentScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 14 }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => { setPhase('done'); onDone?.(); });
  }

  return (
    <View style={rv.container}>
      {phase !== 'done' ? (
        <Animated.View style={[rv.boxWrap, { transform: [{ scale: boxScale }] }]}>
          {/* Lid */}
          <Animated.View style={[rv.lid, { transform: [{ translateY: lidY }], opacity: lidOpacity }]}>
            <Text style={rv.lidEmoji}>🎀</Text>
          </Animated.View>
          {/* Box body */}
          <View style={rv.box}>
            <Text style={rv.boxEmoji}>🎁</Text>
          </View>
          {phase === 'box' && (
            <TouchableOpacity style={rv.tapBtn} onPress={openBox}>
              <Text style={rv.tapBtnTxt}>Tap to unwrap!</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      ) : (
        <Animated.View style={[rv.giftContent, { transform: [{ scale: contentScale }], opacity: contentOpacity }]}>
          <Text style={rv.fromLabel}>From {giftReceived.giver_name}</Text>
          <Text style={rv.perkEmoji}>🎁</Text>
          <Text style={rv.perkNameReveal}>{giftReceived.perk_name || 'A surprise gift!'}</Text>
          {giftReceived.perk_description ? (
            <Text style={rv.perkDescReveal}>{giftReceived.perk_description}</Text>
          ) : null}
        </Animated.View>
      )}
    </View>
  );
}

// ── Perk card ────────────────────────────────────────────────────────────────
function PerkCard({ perk, selected, onSelect }) {
  const thumb = perk.images?.[0]?.image;
  const imgUri = thumb ? (thumb.startsWith('http') ? thumb : `${API_URL}${thumb}`) : null;
  return (
    <TouchableOpacity
      style={[s.perkCard, selected && s.perkCardSelected]}
      onPress={() => onSelect(selected ? null : perk)}
      activeOpacity={0.75}
    >
      {imgUri ? (
        <Image source={{ uri: imgUri }} style={s.perkThumb} resizeMode="cover" />
      ) : (
        <View style={[s.perkThumb, s.perkThumbPlaceholder]}>
          <Text style={{ fontSize: 24 }}>🎁</Text>
        </View>
      )}
      <View style={s.perkInfo}>
        <Text style={s.perkName} numberOfLines={1}>{perk.name}</Text>
        <Text style={s.perkDesc} numberOfLines={2}>{perk.description}</Text>
        <View style={s.perkPriceRow}>
          <Text style={s.perkPrice}>{perk.credit_price} credits</Text>
          {selected && <Text style={s.perkSelectedBadge}>✓ Selected</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function SantaDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState(null);
  const [perks, setPerks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerk, setSelectedPerk] = useState(null);
  const [sending, setSending] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [showReveal, setShowReveal] = useState(false);

  const cardScale = useRef(new Animated.Value(1)).current;

  async function load() {
    try {
      const data = await getSantaEvent(id);
      setEvent(data);
      if (data.status === 'assigned' && data.my_assignment && !data.my_assignment.gift_sent) {
        const perkData = await getPerks({ max_price: data.credit_budget });
        const list = Array.isArray(perkData) ? perkData : (perkData?.results ?? []);
        setPerks(list);
      }
    } catch {
      Alert.alert('Error', 'Could not load event.');
      router.back();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  const fireConfetti = useCallback(() => {
    setShowConfetti(false);
    setTimeout(() => setShowConfetti(true), 10);
    Animated.sequence([
      Animated.spring(cardScale, { toValue: 1.06, useNativeDriver: true, speed: 30 }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
    setTimeout(() => setShowConfetti(false), 4000);
  }, []);

  const handleSend = async () => {
    if (!selectedPerk) return;
    setSending(true);
    try {
      await sendSantaGiftPerk(id, selectedPerk.id);
      setJustSent(true);
      fireConfetti();
      await load();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading || !event) return <View style={s.center}><ActivityIndicator size="large" color="#1C3D5A" /></View>;

  const assignment = event.my_assignment;
  const giftReceived = event.my_gift_received;

  // ── ASSIGNED ─────────────────────────────────────────────────────────────
  if (event.status === 'assigned') {
    if (!assignment) {
      return (
        <View style={[s.center, { backgroundColor: '#0f0a1e', paddingHorizontal: 32 }]}>
            <Text style={s.missedTitle}>You didn't join in time</Text>
          <Text style={s.missedSub}>Assignments are locked. Join the next one!</Text>
          <TouchableOpacity style={s.outlineBtn} onPress={() => router.back()}>
            <Text style={s.outlineBtnTxt}>Go back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const giftSent = assignment.gift_sent || justSent;

    if (giftSent) {
      const perkName = selectedPerk?.name || assignment.gifted_perk_name;
      return (
        <View style={{ flex: 1, backgroundColor: '#0f0a1e' }}>
          <ConfettiBurst visible={showConfetti} />
          <View style={[s.center, { paddingHorizontal: 32 }]}>
            <Text style={{ fontSize: 72, marginBottom: 16 }}>🎁</Text>
            <Text style={s.sentTitle}>Gift sent!</Text>
            <Text style={s.sentSub}>
              You gifted{' '}
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '900' }}>{assignment.receiver_name}</Text>
            </Text>
            {perkName && (
              <View style={s.sentPerkBadge}>
                <Text style={s.sentPerkBadgeTxt}>🎁 {perkName}</Text>
              </View>
            )}
            <Text style={[s.sentSub, { marginTop: 14, opacity: 0.4 }]}>
              The reveal is on {new Date(event.reveal_date).toLocaleDateString()}.
            </Text>
            <TouchableOpacity style={s.outlineBtn} onPress={() => router.back()}>
              <Text style={s.outlineBtnTxt}>Back to events</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: '#0f0a1e' }}>
        <ConfettiBurst visible={showConfetti} />
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: insets.top + 24, paddingBottom: 80 }}>
          <TouchableOpacity onPress={() => router.back()} style={s.backRow}>
            <Text style={s.backArrow}>←</Text>
            <Text style={s.backLabel}>{event.title}</Text>
          </TouchableOpacity>


          {/* Who you got */}
          <Animated.View style={[s.missionCard, { transform: [{ scale: cardScale }] }]}>
            <Text style={s.missionEmoji}>🎅</Text>
            <Text style={s.missionLabel}>Your secret assignment</Text>
            <Text style={s.missionName}>{assignment.receiver_name}</Text>
            <Text style={s.missionSub}>Pick a perk from the catalog to send as their gift!</Text>
          </Animated.View>

          {/* Perk list */}
          {perks.length === 0 ? (
            <View style={s.noPerks}>
              <Text style={s.noPerksText}>No perks available within the {event.credit_budget} credit budget.</Text>
              <Text style={s.noPerksText}>Ask HR to increase the budget.</Text>
            </View>
          ) : (
            <>
              <Text style={s.sectionLabel}>Perks within {event.credit_budget} credits — tap to pick</Text>
              {perks.map((p) => (
                <PerkCard key={p.id} perk={p} selected={selectedPerk?.id === p.id} onSelect={setSelectedPerk} />
              ))}
            </>
          )}
        </ScrollView>

        {/* Sticky send button */}
        {selectedPerk && (
          <View style={[s.stickyFooter, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity style={s.sendBtn} onPress={handleSend} disabled={sending}>
              {sending
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.sendBtnTxt}>Gift "{selectedPerk.name}"</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ── REVEALED ─────────────────────────────────────────────────────────────
  if (event.status === 'revealed') {
    // If this user received a gift, show the unwrap experience first
    if (giftReceived && !showReveal) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0f0a1e' }}>
          <ConfettiBurst visible={showConfetti} />
          <ScrollView contentContainerStyle={{ padding: 24, paddingTop: insets.top + 24, paddingBottom: 60, flexGrow: 1 }}>
            <TouchableOpacity onPress={() => router.back()} style={s.backRow}>
              <Text style={s.backArrow}>←</Text>
              <Text style={s.backLabel}>{event.title}</Text>
            </TouchableOpacity>
            <Text style={[s.missionLabel, { textAlign: 'center', marginBottom: 8 }]}>You got a gift!</Text>
            <GiftReveal giftReceived={giftReceived} onDone={() => fireConfetti()} />

            {/* What you sent */}
            {assignment && (
              <View style={s.sentSummary}>
                <Text style={s.sentSummaryLabel}>You gifted</Text>
                <Text style={s.sentSummaryName}>{assignment.receiver_name}</Text>
                {assignment.gifted_perk_name && (
                  <View style={s.sentPerkBadge}>
                    <Text style={s.sentPerkBadgeTxt}>{assignment.gifted_perk_name}</Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity style={[s.outlineBtn, { marginTop: 24 }]} onPress={() => setShowReveal(true)}>
              <Text style={s.outlineBtnTxt}>See all pairings →</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    // Full reveal table
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0a1e' }}>
        <ConfettiBurst visible={showConfetti} />
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: insets.top + 24, paddingBottom: 60 }}>
          <TouchableOpacity onPress={() => router.back()} style={s.backRow}>
            <Text style={s.backArrow}>←</Text>
            <Text style={s.backLabel}>{event.title}</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <Text style={s.revealTitle}>The Big Reveal!</Text>
            <Text style={s.revealSub}>Here's who had whom</Text>
          </View>
          <View style={s.revealCard}>
            {event.all_assignments?.map((a, i) => (
              <View key={i} style={s.revealRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.revealGiver}>{a.giver_name}</Text>
                  {a.gifted_perk_name && (
                    <Text style={s.revealPerk}>{a.gifted_perk_name}</Text>
                  )}
                </View>
                <Text style={s.revealArrow}>→</Text>
                <Text style={s.revealReceiver}>{a.receiver_name}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── OPEN ─────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={[s.root, { backgroundColor: '#F7F7F8' }]} contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 60 }}>
      <TouchableOpacity onPress={() => router.back()} style={s.backRow}>
        <Text style={[s.backArrow, { color: '#1C3D5A' }]}>←</Text>
        <Text style={[s.backLabel, { color: '#111' }]}>{event.title}</Text>
      </TouchableOpacity>
      <View style={s.openHero}>
        <Text style={s.openTitle}>{event.title}</Text>
        <Text style={s.openDept}>{event.department_name}</Text>
        <View style={s.budgetPill}><Text style={s.budgetTxt}>{event.credit_budget} credits budget</Text></View>
      </View>
      <View style={s.statsRow}>
        {[
          { val: event.participant_count, label: 'Joined' },
          { val: new Date(event.join_deadline).toLocaleDateString(), label: 'Deadline' },
          { val: new Date(event.reveal_date).toLocaleDateString(), label: 'Reveal' },
        ].map((item) => (
          <View key={item.label} style={s.statBox}>
            <Text style={s.statNum}>{item.val}</Text>
            <Text style={s.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
      <View style={s.waitCard}>
        <Text style={{ fontSize: 36, marginBottom: 10 }}>⏳</Text>
        <Text style={s.waitTitle}>Waiting for assignments</Text>
        <Text style={s.waitSub}>HR will shuffle after the join deadline. Make sure you've joined!</Text>
      </View>
    </ScrollView>
  );
}

// ── Reveal box styles ────────────────────────────────────────────────────────
const rv = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 20 },
  boxWrap: { alignItems: 'center' },
  lid: {
    width: 120, height: 36, backgroundColor: '#1C3D5A', borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    zIndex: 10,
  },
  lidEmoji: { fontSize: 22 },
  box: {
    width: 120, height: 120, backgroundColor: '#162D42', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
  },
  boxEmoji: { fontSize: 52 },
  tapBtn: {
    marginTop: 20, backgroundColor: '#1C3D5A', borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 14,
  },
  tapBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 16 },
  giftContent: { alignItems: 'center', paddingHorizontal: 20 },
  fromLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: '700', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  perkEmoji: { fontSize: 64, marginBottom: 14 },
  perkNameReveal: { color: '#fff', fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  perkDescReveal: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

// ── Main styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  backArrow: { fontSize: 20, color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
  backLabel: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },

  starsRow: { textAlign: 'center', fontSize: 16, marginBottom: 18, letterSpacing: 6, opacity: 0.4 },

  missionCard: {
    borderRadius: 28, padding: 28, alignItems: 'center', marginBottom: 20,
    backgroundColor: '#1e0f3a', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
  },
  missionEmoji: { fontSize: 60, marginBottom: 14 },
  missionLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
  missionName: { color: '#fff', fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  missionSub: { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  sectionLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 },

  perkCard: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, padding: 14, marginBottom: 10, gap: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
  },
  perkCardSelected: { borderColor: '#1C3D5A', backgroundColor: 'rgba(28,61,90,0.25)' },
  perkThumb: { width: 72, height: 72, borderRadius: 12 },
  perkThumbPlaceholder: { backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  perkInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  perkName: { color: '#fff', fontWeight: '800', fontSize: 14 },
  perkDesc: { color: 'rgba(255,255,255,0.38)', fontSize: 12, lineHeight: 17 },
  perkPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  perkPrice: { color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 13 },
  perkSelectedBadge: { color: '#6ee7b7', fontWeight: '800', fontSize: 12 },

  noPerks: { alignItems: 'center', padding: 28, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16 },
  noPerksText: { color: 'rgba(255,255,255,0.35)', textAlign: 'center', fontSize: 13, lineHeight: 20 },

  stickyFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0f0a1e', paddingHorizontal: 24, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  sendBtn: {
    backgroundColor: '#1C3D5A', borderRadius: 16, paddingVertical: 17, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  sendBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 16 },

  sentTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 10, textAlign: 'center' },
  sentSub: { fontSize: 15, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 22 },
  sentPerkBadge: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  sentPerkBadgeTxt: { color: 'rgba(255,255,255,0.75)', fontWeight: '800', fontSize: 14 },

  outlineBtn: { marginTop: 28, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center' },
  outlineBtnTxt: { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 14 },

  missedTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 8, textAlign: 'center' },
  missedSub: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 20, marginBottom: 28 },

  revealTitle: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 4 },
  revealSub: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  revealCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
  revealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', gap: 8 },
  revealGiver: { fontWeight: '700', color: '#fff', fontSize: 14 },
  revealPerk: { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '600', marginTop: 2 },
  revealArrow: { fontSize: 16, color: 'rgba(255,255,255,0.3)', paddingHorizontal: 8 },
  revealReceiver: { flex: 1, fontWeight: '700', color: 'rgba(255,255,255,0.75)', fontSize: 14, textAlign: 'right' },

  sentSummary: { marginTop: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  sentSummaryLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  sentSummaryName: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 10 },

  openHero: { alignItems: 'center', marginBottom: 20, backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1.5, borderColor: '#e5e7eb' },
  openTitle: { fontSize: 20, fontWeight: '900', color: '#111', marginTop: 8, textAlign: 'center' },
  openDept: { fontSize: 13, color: '#5B5E66', fontWeight: '700', marginTop: 4 },
  budgetPill: { marginTop: 10, backgroundColor: '#EEEFF2', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99 },
  budgetTxt: { color: '#1C3D5A', fontWeight: '800', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb' },
  statNum: { fontSize: 13, fontWeight: '800', color: '#111', textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2, fontWeight: '600' },
  waitCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb' },
  waitTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 6 },
  waitSub: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
});
