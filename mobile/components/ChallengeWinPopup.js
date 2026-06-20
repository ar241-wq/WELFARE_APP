import { useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Animated, Dimensions, ScrollView,
} from 'react-native';

const { width } = Dimensions.get('window');

const PARTICLES = [
  { emoji: '🏆', x: 10 }, { emoji: '✨', x: 50 }, { emoji: '🎉', x: 90 },
  { emoji: '💰', x: 130 }, { emoji: '⚡', x: 170 }, { emoji: '🌟', x: 210 },
  { emoji: '🏅', x: 250 }, { emoji: '🎊', x: 290 },
];

function FloatingEmoji({ emoji, startX, delay }) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(y, { toValue: -220, duration: 2600, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.Text style={[styles.floatEmoji, { left: startX, opacity, transform: [{ translateY: y }] }]}>
      {emoji}
    </Animated.Text>
  );
}

export default function ChallengeWinPopup({ wins, onClose }) {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(-1)).current;

  const totalAmount = wins.reduce((sum, w) => sum + parseFloat(w.amount), 0);

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, { toValue: 2, duration: 1800, useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(shineAnim, { toValue: -1, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.9] });
  const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const shineX = shineAnim.interpolate({ inputRange: [-1, 2], outputRange: [-300, 600] });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Particles */}
        <View style={styles.particleWrap} pointerEvents="none">
          {PARTICLES.map((p, i) => (
            <FloatingEmoji key={i} emoji={p.emoji} startX={p.x} delay={i * 300} />
          ))}
        </View>

        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Glow ring */}
          <Animated.View style={[styles.glowRing, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />

          {/* Shine sweep */}
          <Animated.View
            style={[styles.shine, { transform: [{ translateX: shineX }, { rotate: '20deg' }] }]}
            pointerEvents="none"
          />

          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.title}>Your Department Won!</Text>
          <Text style={styles.subtitle}>The prize has been split among your team</Text>

          {/* Total */}
          <View style={styles.totalBadge}>
            <Text style={styles.totalNum}>{totalAmount.toFixed(0)}</Text>
            <Text style={styles.totalLabel}>credits added to your wallet</Text>
          </View>

          {/* Win list */}
          <ScrollView style={styles.winList} showsVerticalScrollIndicator={false}>
            {wins.map((w) => (
              <View key={w.id} style={styles.winRow}>
                <View style={styles.winLeft}>
                  <Text style={styles.winDept}>🏢 {w.department_name}</Text>
                  <Text style={styles.winChallenge}>{w.challenge_title}</Text>
                </View>
                <View style={styles.winAmountBadge}>
                  <Text style={styles.winAmount}>+{w.amount}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeTxt}>Claim Your Victory! 🎊</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center',
  },
  particleWrap: {
    position: 'absolute', bottom: '48%', left: 0, right: 0, height: 1,
  },
  floatEmoji: { position: 'absolute', bottom: 0, fontSize: 22 },

  card: {
    width: width * 0.88, backgroundColor: '#fff',
    borderRadius: 32, padding: 28, alignItems: 'center',
    maxHeight: '82%',
    shadowColor: '#f59e0b', shadowOpacity: 0.6, shadowRadius: 40, shadowOffset: { width: 0, height: 8 },
    elevation: 24, overflow: 'hidden',
  },
  glowRing: {
    position: 'absolute', width: '116%', height: '116%',
    borderRadius: 42, borderWidth: 3, borderColor: '#fbbf24',
    shadowColor: '#fbbf24', shadowOpacity: 1, shadowRadius: 30,
  },
  shine: {
    position: 'absolute', top: 0, bottom: 0, width: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  trophy: { fontSize: 60, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '900', color: '#111', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#9ca3af', marginBottom: 20 },

  totalBadge: {
    backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 28, paddingVertical: 14,
    alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#fde68a', width: '100%',
  },
  totalNum: { fontSize: 44, fontWeight: '900', color: '#d97706' },
  totalLabel: { fontSize: 12, color: '#92400e', fontWeight: '700', marginTop: 2 },

  winList: { width: '100%', maxHeight: 200, marginBottom: 20 },
  winRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f3f4f6',
  },
  winLeft: { flex: 1 },
  winDept: { fontSize: 13, fontWeight: '700', color: '#111' },
  winChallenge: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  winAmountBadge: {
    backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#fde68a',
  },
  winAmount: { fontSize: 16, fontWeight: '900', color: '#d97706' },

  closeBtn: {
    width: '100%', backgroundColor: '#111', borderRadius: 18,
    paddingVertical: 16, alignItems: 'center',
  },
  closeTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
