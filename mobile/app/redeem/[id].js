import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  Alert, TextInput, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { getRedemptions, checkReview, submitReview } from '../../lib/api';

const POLL_INTERVAL_MS = 3000;

export default function RedeemScreen() {
  const { id, perk_name, perk_price } = useLocalSearchParams();
  const router = useRouter();
  const [redemption, setRedemption] = useState(null);
  const [loading, setLoading] = useState(true);
  // Review prompt state
  const [showReview, setShowReview] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef(null);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (perk_name) {
      const initial = { id, perk_name, perk_credit_price: perk_price, status: 'pending', perk: id };
      setRedemption(initial);
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const all = await getRedemptions();
        const list = Array.isArray(all) ? all : all?.results || [];
        const found = list.find((r) => String(r.id) === String(id));
        setRedemption(found || null);
      } catch (e) {
        Alert.alert('Error', 'Could not load redemption.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // ── Polling for status flip ───────────────────────────────────────────────
  useEffect(() => {
    if (!redemption || redemption.status === 'redeemed') return;

    pollRef.current = setInterval(async () => {
      try {
        const all = await getRedemptions();
        const list = Array.isArray(all) ? all : all?.results || [];
        const updated = list.find((r) => String(r.id) === String(id));
        if (updated && updated.status === 'redeemed') {
          clearInterval(pollRef.current);
          setRedemption(updated);
          // Check if already reviewed
          const check = await checkReview(id).catch(() => ({ reviewed: false }));
          if (!check.reviewed) {
            setShowReview(true);
          }
        }
      } catch (_) {
        // silently ignore poll errors
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current);
  }, [redemption?.status, id]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSubmitReview = async () => {
    if (selectedStars === 0) {
      Alert.alert('Select a rating', 'Please tap a star before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await submitReview(id, selectedStars, comment);
    } catch (e) {
      // Non-fatal — still navigate home
    } finally {
      setSubmitting(false);
      router.replace('/(tabs)/');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/');
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#1C3D5A" /></View>;
  }

  if (!redemption) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>Redemption not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Review Prompt ─────────────────────────────────────────────────────────
  if (showReview) {
    return (
      <ScrollView contentContainerStyle={styles.reviewContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>Perk redeemed!</Text>
          <Text style={styles.reviewSub}>How was {redemption.perk_name}?</Text>

          {/* Star selector */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setSelectedStars(n)} style={styles.starBtn}>
                <Text style={[styles.starIcon, selectedStars >= n && styles.starFilled]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Optional comment */}
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment... (optional)"
            placeholderTextColor="#9ca3af"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.submitBtn, selectedStars === 0 && styles.submitBtnDisabled]}
            onPress={handleSubmitReview}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>Submit Review</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── QR Screen ─────────────────────────────────────────────────────────────
  const qrValue = `REDEMPTION:${redemption.id}`;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Your Perk is Ready!</Text>
        <Text style={styles.perkName}>{redemption.perk_name}</Text>
        <Text style={styles.instruction}>Show this QR code to the provider</Text>

        <View style={styles.qrContainer}>
          <QRCode
            value={qrValue}
            size={220}
            color="#111827"
            backgroundColor="#fff"
          />
        </View>

        <View style={styles.infoBadge}>
          <Text style={styles.infoText}>Redemption #{redemption.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: redemption.status === 'redeemed' ? '#d1fae5' : '#EEEFF2' }]}>
            <Text style={[styles.statusText, { color: redemption.status === 'redeemed' ? '#059669' : '#1C3D5A' }]}>
              {redemption.status}
            </Text>
          </View>
        </View>

        <Text style={styles.cost}>{redemption.perk_credit_price} credits used</Text>
        {redemption.status === 'pending' && (
          <Text style={styles.waitingText}>Waiting for provider to scan...</Text>
        )}
      </View>

      <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)/')}>
        <Text style={styles.doneBtnText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F8', padding: 20, justifyContent: 'center' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#6b7280', marginBottom: 12 },
  backLink: { fontSize: 15, color: '#1C3D5A', fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  successIcon: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 6 },
  perkName: { fontSize: 16, color: '#1C3D5A', fontWeight: '600', marginBottom: 8 },
  instruction: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  qrContainer: { padding: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 2, borderColor: '#e5e7eb', marginBottom: 20 },
  infoBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  infoText: { fontSize: 13, color: '#6b7280' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cost: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  waitingText: { fontSize: 12, color: '#6b7280', marginTop: 8, fontStyle: 'italic' },
  doneBtn: {
    marginTop: 20, backgroundColor: '#1C3D5A', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // ── Review prompt ──
  reviewContainer: { flexGrow: 1, backgroundColor: '#F7F7F8', padding: 20, justifyContent: 'center' },
  reviewCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  reviewCheck: { fontSize: 40, marginBottom: 12 },
  reviewTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  reviewSub: { fontSize: 15, color: '#6b7280', marginBottom: 20 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  starBtn: { padding: 4 },
  starIcon: { fontSize: 36, color: '#d1d5db' },
  starFilled: { color: '#9A6700' },
  commentInput: {
    width: '100%', backgroundColor: '#f3f4f6', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827',
    textAlignVertical: 'top', marginBottom: 16, minHeight: 80,
  },
  submitBtn: {
    width: '100%', backgroundColor: '#1C3D5A', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginBottom: 10,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  skipBtn: { paddingVertical: 10 },
  skipBtnText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
});
