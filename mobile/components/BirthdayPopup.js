import { useEffect, useRef, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Animated, Image, Dimensions, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { sendBirthdayGift } from '../lib/api';

const { width } = Dimensions.get('window');
const QUICK_AMOUNTS = [50, 100, 200, 500];

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
}

function Particle({ emoji, delay }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value((Math.random() - 0.5) * 80)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -160, duration: 2400, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.Text style={[styles.particle, { opacity, transform: [{ translateY }, { translateX }] }]}>
      {emoji}
    </Animated.Text>
  );
}

export default function BirthdayPopup({ people, onClose }) {
  const [current, setCurrent] = useState(0);
  const [gifting, setGifting] = useState(false);
  const [gifted, setGifted] = useState({});
  const [customAmount, setCustomAmount] = useState('');
  const [selectedQuick, setSelectedQuick] = useState(null);
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const person = people[current];

  useEffect(() => {
    setCustomAmount('');
    setSelectedQuick(null);
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, [current]);

  const effectiveAmount = customAmount.trim() ? parseInt(customAmount, 10) : selectedQuick;

  const handleGift = async () => {
    if (gifting || gifted[person.id] || !effectiveAmount || effectiveAmount <= 0) return;
    setGifting(true);
    try {
      await sendBirthdayGift(person.id, effectiveAmount);
      setGifted(prev => ({ ...prev, [person.id]: effectiveAmount }));
    } catch (_) {}
    setGifting(false);
  };

  const handleNext = () => {
    if (current < people.length - 1) {
      scaleAnim.setValue(0.85);
      setCurrent(c => c + 1);
    } else {
      onClose();
    }
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });
  const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.09] });

  const EMOJIS = ['🎂', '🎉', '✨', '🎈', '🌟', '🥳', '🎁', '💛'];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Floating particles */}
        <View style={styles.particleContainer} pointerEvents="none">
          {EMOJIS.map((e, i) => (
            <Particle key={i} emoji={e} delay={i * 300} />
          ))}
        </View>

        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Glow ring */}
          <Animated.View style={[styles.glowRing, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />

          <Text style={styles.cakeEmoji}>🎂</Text>
          <Text style={styles.title}>It's a Birthday!</Text>

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            {resolveUrl(person.avatar) ? (
              <Image source={{ uri: resolveUrl(person.avatar) }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarLetter}>{person.full_name[0]}</Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>{person.full_name}</Text>
          <Text style={styles.subtitle}>Your colleague is celebrating today 🎊</Text>

          {gifted[person.id] ? (
            <View style={styles.giftedBadge}>
              <Text style={styles.giftedText}>🎁 You sent {gifted[person.id]} credits!</Text>
            </View>
          ) : (
            <>
              <Text style={styles.giftLabel}>Send birthday credits anonymously</Text>

              {/* Quick amounts */}
              <View style={styles.quickRow}>
                {QUICK_AMOUNTS.map(amt => (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.quickBtn, selectedQuick === amt && !customAmount && styles.quickBtnSelected]}
                    onPress={() => { setSelectedQuick(amt); setCustomAmount(''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickNum, selectedQuick === amt && !customAmount && styles.quickNumSelected]}>{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom amount */}
              <View style={styles.customRow}>
                <Text style={styles.customPrefix}>or enter amount</Text>
                <View style={[styles.customInputWrap, customAmount.trim() && styles.customInputWrapActive]}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="0"
                    placeholderTextColor="#d1d5db"
                    keyboardType="number-pad"
                    value={customAmount}
                    onChangeText={(v) => { setCustomAmount(v.replace(/[^0-9]/g, '')); setSelectedQuick(null); }}
                    maxLength={5}
                  />
                  <Text style={styles.customSuffix}>credits</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.giftBtn, (!effectiveAmount || effectiveAmount <= 0 || gifting) && styles.giftBtnDisabled]}
                onPress={handleGift}
                disabled={!effectiveAmount || effectiveAmount <= 0 || gifting}
                activeOpacity={0.8}
              >
                <Text style={styles.giftBtnTxt}>
                  {gifting ? 'Sending…' : effectiveAmount ? `🎁 Gift ${effectiveAmount} Credits` : 'Select or enter amount'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.nextTxt}>
              {current < people.length - 1 ? `Next (${people.length - current - 1} more)` : 'Close'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  particleContainer: {
    position: 'absolute', alignItems: 'center',
    bottom: '50%', left: '50%', marginLeft: -40,
  },
  particle: { position: 'absolute', fontSize: 22 },

  card: {
    width: width * 0.88, backgroundColor: '#fff',
    borderRadius: 32, padding: 28, alignItems: 'center',
    shadowColor: '#f59e0b', shadowOpacity: 0.45, shadowRadius: 36, shadowOffset: { width: 0, height: 8 },
    elevation: 20,
  },
  glowRing: {
    position: 'absolute', width: '112%', height: '112%',
    borderRadius: 38, borderWidth: 2.5, borderColor: '#fbbf24',
    shadowColor: '#fbbf24', shadowOpacity: 1, shadowRadius: 24,
  },

  cakeEmoji: { fontSize: 48, marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '900', color: '#111', marginBottom: 18, letterSpacing: -0.5 },

  avatarWrapper: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 3, borderColor: '#fbbf24',
    shadowColor: '#f59e0b', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    marginBottom: 12, overflow: 'hidden',
  },
  avatar: { width: 84, height: 84 },
  avatarFallback: { flex: 1, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 34, fontWeight: '800', color: '#d97706' },

  name: { fontSize: 21, fontWeight: '800', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#9ca3af', marginBottom: 20, textAlign: 'center' },

  giftLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10, alignSelf: 'flex-start' },

  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 14, width: '100%' },
  quickBtn: {
    flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb',
  },
  quickBtnSelected: { backgroundColor: '#fef3c7', borderColor: '#fbbf24' },
  quickNum: { fontSize: 17, fontWeight: '800', color: '#6b7280' },
  quickNumSelected: { color: '#d97706' },

  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18, width: '100%' },
  customPrefix: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  customInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  customInputWrapActive: { borderColor: '#fbbf24', backgroundColor: '#fef3c7' },
  customInput: { flex: 1, fontSize: 18, fontWeight: '800', color: '#111' },
  customSuffix: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },

  giftBtn: {
    width: '100%', backgroundColor: '#f59e0b', borderRadius: 16,
    paddingVertical: 15, alignItems: 'center', marginBottom: 12,
    shadowColor: '#f59e0b', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  giftBtnDisabled: { backgroundColor: '#e5e7eb', shadowOpacity: 0 },
  giftBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  giftedBadge: {
    backgroundColor: '#ecfdf5', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14,
    marginBottom: 20, borderWidth: 1.5, borderColor: '#a7f3d0', width: '100%', alignItems: 'center',
  },
  giftedText: { fontSize: 16, fontWeight: '700', color: '#059669' },

  nextBtn: {
    width: '100%', backgroundColor: '#111', borderRadius: 18,
    paddingVertical: 15, alignItems: 'center',
  },
  nextTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
