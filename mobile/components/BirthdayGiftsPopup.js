import { useEffect, useRef, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Animated, Image, Dimensions, ScrollView,
} from 'react-native';

const { width } = Dimensions.get('window');

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
}

function FloatingEmoji({ emoji, startX, delay }) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(y, { toValue: -200, duration: 2800, useNativeDriver: true }),
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

export default function BirthdayGiftsPopup({ gifts, onClose }) {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(-1)).current;

  const total = gifts.reduce((sum, g) => sum + g.amount, 0);

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    // Shine sweep
    Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, { toValue: 2, duration: 2000, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(shineAnim, { toValue: -1, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.8] });
  const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const shineX = shineAnim.interpolate({ inputRange: [-1, 2], outputRange: [-300, 600] });

  const PARTICLES = [
    { emoji: '🎂', x: 20 }, { emoji: '✨', x: 60 }, { emoji: '🎁', x: 100 },
    { emoji: '💛', x: 140 }, { emoji: '🌟', x: 180 }, { emoji: '🎉', x: 220 },
  ];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Particles */}
        <View style={styles.particleWrap} pointerEvents="none">
          {PARTICLES.map((p, i) => (
            <FloatingEmoji key={i} emoji={p.emoji} startX={p.x} delay={i * 380} />
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

          <Text style={styles.bigEmoji}>🎂</Text>
          <Text style={styles.title}>Happy Birthday!</Text>
          <Text style={styles.subtitle}>Your colleagues sent you love today</Text>

          {/* Total */}
          <View style={styles.totalBadge}>
            <Text style={styles.totalNum}>{total}</Text>
            <Text style={styles.totalLabel}>birthday credits received</Text>
          </View>

          {/* Gift list */}
          <ScrollView style={styles.giftList} showsVerticalScrollIndicator={false}>
            {gifts.map((g, i) => (
              <Animated.View
                key={g.id}
                style={[styles.giftRow, { opacity: scaleAnim }]}
              >
                <View style={styles.giftAvatar}>
                  {resolveUrl(g.from_avatar) ? (
                    <Image source={{ uri: resolveUrl(g.from_avatar) }} style={styles.giftAvatarImg} />
                  ) : (
                    <Text style={styles.giftAvatarLetter}>{g.from_name[0]}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.giftName}>{g.from_name}</Text>
                  <Text style={styles.giftMsg}>sent you birthday credits 🎁</Text>
                </View>
                <View style={styles.giftAmountBadge}>
                  <Text style={styles.giftAmount}>+{g.amount}</Text>
                </View>
              </Animated.View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeTxt}>Thank you all! 🥰</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  particleWrap: {
    position: 'absolute', bottom: '48%', left: 0, right: 0, height: 1,
  },
  floatEmoji: { position: 'absolute', bottom: 0, fontSize: 22 },

  card: {
    width: width * 0.88, backgroundColor: '#fff',
    borderRadius: 32, padding: 28, alignItems: 'center',
    maxHeight: '80%',
    shadowColor: '#f59e0b', shadowOpacity: 0.5, shadowRadius: 40, shadowOffset: { width: 0, height: 8 },
    elevation: 24, overflow: 'hidden',
  },
  glowRing: {
    position: 'absolute', width: '115%', height: '115%',
    borderRadius: 40, borderWidth: 2.5, borderColor: '#fbbf24',
    shadowColor: '#fbbf24', shadowOpacity: 1, shadowRadius: 28,
  },
  shine: {
    position: 'absolute', top: 0, bottom: 0, width: 80,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  bigEmoji: { fontSize: 54, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: '900', color: '#111', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#9ca3af', marginBottom: 20 },

  totalBadge: {
    backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 28, paddingVertical: 14,
    alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#fde68a',
    width: '100%',
  },
  totalNum: { fontSize: 42, fontWeight: '900', color: '#d97706' },
  totalLabel: { fontSize: 12, color: '#92400e', fontWeight: '700', marginTop: 2 },

  giftList: { width: '100%', maxHeight: 220, marginBottom: 20 },
  giftRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f3f4f6',
  },
  giftAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fef3c7',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 2, borderColor: '#fde68a',
  },
  giftAvatarImg: { width: 44, height: 44 },
  giftAvatarLetter: { fontSize: 18, fontWeight: '800', color: '#d97706' },
  giftName: { fontSize: 14, fontWeight: '700', color: '#111' },
  giftMsg: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  giftAmountBadge: {
    backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#fde68a',
  },
  giftAmount: { fontSize: 16, fontWeight: '900', color: '#d97706' },

  closeBtn: {
    width: '100%', backgroundColor: '#111', borderRadius: 18,
    paddingVertical: 16, alignItems: 'center',
  },
  closeTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
