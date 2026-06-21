import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { markSantaGiftsSeen } from '../lib/api';

const { width: W, height: H } = Dimensions.get('window');
const EMOJIS = ['🎁', '🎄', '⭐', '❄️', '🎅', '🔔', '✨', '🦌'];

// ── Confetti particle ──────────────────────────────────────────────────────────
function Particle({ delay }) {
  const y = useRef(new Animated.Value(-40)).current;
  const x = useRef(new Animated.Value(Math.random() * W)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  const size = 16 + Math.random() * 18;
  const duration = 2000 + Math.random() * 1200;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(y, { toValue: H * 0.9, duration, useNativeDriver: true }),
        Animated.timing(x, { toValue: x._value + (Math.random() - 0.5) * 200, duration, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 5, duration, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(duration * 0.6),
          Animated.timing(opacity, { toValue: 0, duration: duration * 0.4, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 5], outputRange: ['0deg', '900deg'] });
  return (
    <Animated.Text style={{
      position: 'absolute', fontSize: size, top: 0,
      transform: [{ translateX: x }, { translateY: y }, { rotate: spin }],
      opacity,
    }}>
      {emoji}
    </Animated.Text>
  );
}

// ── Main popup ─────────────────────────────────────────────────────────────────
export default function SantaGiftPopup({ gifts = [], onClose }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('box'); // 'box' | 'reveal'
  const [showConfetti, setShowConfetti] = useState(false);

  // Animations
  const boxScale = useRef(new Animated.Value(1)).current;
  const lidY = useRef(new Animated.Value(0)).current;
  const lidOpacity = useRef(new Animated.Value(1)).current;
  const contentScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  const gift = gifts[index];

  useEffect(() => {
    // Slide modal in
    Animated.spring(modalAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();
  }, []);

  useEffect(() => {
    // Reset animation state when moving to next gift
    if (phase === 'box') {
      boxScale.setValue(1);
      lidY.setValue(0);
      lidOpacity.setValue(1);
      contentScale.setValue(0);
      contentOpacity.setValue(0);
    }
  }, [index, phase]);

  function openBox() {
    Animated.sequence([
      // Shake
      Animated.sequence([
        Animated.timing(boxScale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.timing(boxScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
        Animated.timing(boxScale, { toValue: 1.07, duration: 80, useNativeDriver: true }),
        Animated.timing(boxScale, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]),
      // Lid flies off
      Animated.parallel([
        Animated.timing(lidY, { toValue: -140, duration: 380, useNativeDriver: true }),
        Animated.timing(lidOpacity, { toValue: 0, duration: 360, useNativeDriver: true }),
      ]),
      // Content springs in
      Animated.parallel([
        Animated.spring(contentScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 14 }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setPhase('reveal');
      setShowConfetti(false);
      setTimeout(() => setShowConfetti(true), 10);
      setTimeout(() => setShowConfetti(false), 4500);
    });
  }

  async function handleNext() {
    if (index < gifts.length - 1) {
      setIndex(i => i + 1);
      setPhase('box');
    } else {
      // Mark all seen on backend, then close
      await markSantaGiftsSeen().catch(() => {});
      Animated.timing(modalAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(onClose);
    }
  }

  const modalTranslateY = modalAnim.interpolate({ inputRange: [0, 1], outputRange: [H, 0] });

  if (!gift) return null;

  return (
    <Modal transparent animationType="none" visible statusBarTranslucent>
      {/* Overlay */}
      <View style={styles.overlay}>
        {showConfetti && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {Array.from({ length: 28 }).map((_, i) => <Particle key={i} delay={i * 60} />)}
          </View>
        )}

        <Animated.View style={[styles.sheet, { transform: [{ translateY: modalTranslateY }] }]}>
          <LinearGradient colors={['#0D2236', '#1C3D5A']} style={styles.sheetInner}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Gift counter */}
            {gifts.length > 1 && (
              <Text style={styles.counter}>{index + 1} of {gifts.length} gifts</Text>
            )}

            {/* From label */}
            <Text style={styles.fromLabel}>You got a gift! 🎁</Text>
            <Text style={styles.fromSub}>Your Secret Santa left something for you</Text>

            {phase === 'box' ? (
              /* ── Box state ── */
              <View style={styles.boxArea}>
                <Animated.View style={{ transform: [{ scale: boxScale }], alignItems: 'center' }}>
                  {/* Lid */}
                  <Animated.View style={[styles.lid, { transform: [{ translateY: lidY }], opacity: lidOpacity }]}>
                    <Text style={styles.lidEmoji}>🎀</Text>
                  </Animated.View>
                  {/* Box */}
                  <View style={styles.box}>
                    <Text style={styles.boxEmoji}>🎁</Text>
                  </View>
                </Animated.View>

                <TouchableOpacity style={styles.tapBtn} onPress={openBox}>
                  <Text style={styles.tapBtnTxt}>Tap to unwrap! ✨</Text>
                </TouchableOpacity>
                <Text style={styles.tapHint}>From {gift.event_title}</Text>
              </View>
            ) : (
              /* ── Reveal state ── */
              <Animated.View style={[styles.revealArea, { transform: [{ scale: contentScale }], opacity: contentOpacity }]}>
                <View style={styles.giftIconWrap}>
                  <Text style={{ fontSize: 64 }}>🎁</Text>
                </View>
                <Text style={styles.perkCategory}>{gift.perk_category}</Text>
                <Text style={styles.perkName}>{gift.perk_name}</Text>
                {gift.perk_description ? (
                  <Text style={styles.perkDesc} numberOfLines={3}>{gift.perk_description}</Text>
                ) : null}
                <View style={styles.giverRow}>
                  <Text style={styles.giverLabel}>🎅 from your Secret Santa</Text>
                </View>
              </Animated.View>
            )}

            {/* CTA */}
            {phase === 'reveal' && (
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnTxt}>
                  {index < gifts.length - 1 ? 'Open next gift 🎁' : 'Awesome, thanks! 🙌'}
                </Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: { maxHeight: H * 0.88 },
  sheetInner: {
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 28, paddingTop: 12, paddingBottom: 48,
    alignItems: 'center',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 24 },

  counter: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  fromLabel: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.4, marginBottom: 4 },
  fromSub: { fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 32 },

  // Box
  boxArea: { alignItems: 'center', width: '100%', marginBottom: 24 },
  lid: {
    width: 120, height: 38, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', zIndex: 10,
  },
  lidEmoji: { fontSize: 22 },
  box: {
    width: 130, height: 130, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 28,
  },
  boxEmoji: { fontSize: 60 },
  tapBtn: {
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 32, paddingVertical: 16,
    marginBottom: 12,
  },
  tapBtnTxt: { color: '#1C3D5A', fontWeight: '900', fontSize: 16 },
  tapHint: { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },

  // Reveal
  revealArea: { alignItems: 'center', width: '100%', marginBottom: 28 },
  giftIconWrap: {
    width: 110, height: 110, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  perkCategory: {
    fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8,
  },
  perkName: {
    fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center',
    letterSpacing: -0.3, lineHeight: 30, marginBottom: 10,
  },
  perkDesc: {
    fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center',
    lineHeight: 21, marginBottom: 20,
  },
  giverRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  giverLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  giverName: { fontSize: 14, color: '#fff', fontWeight: '800' },

  // Next button
  nextBtn: {
    width: '100%', backgroundColor: '#fff', borderRadius: 16,
    paddingVertical: 17, alignItems: 'center',
  },
  nextBtnTxt: { color: '#1C3D5A', fontWeight: '900', fontSize: 16 },
});
