import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  Alert, TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { getRedemptions, checkReview, submitReview } from '../../lib/api';

const POLL_INTERVAL_MS = 3000;

export default function RedeemScreen() {
  const { id, perk_name, perk_price, perk_id } = useLocalSearchParams();
  const router = useRouter();
  const [redemption, setRedemption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef(null);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        if (perk_name) {
          // Came directly from perk detail after purchase
          const initial = {
            id,
            perk_name,
            perk_credit_price: perk_price,
            status: 'pending',
            perk: perk_id || id,
          };
          setRedemption(initial);
        } else {
          const all = await getRedemptions();
          const list = Array.isArray(all) ? all : all?.results || [];
          const found = list.find((r) => String(r.id) === String(id));
          setRedemption(found || null);
        }
        // Check review status immediately on load
        const check = await checkReview(id).catch(() => ({ reviewed: false }));
        setAlreadyReviewed(check.reviewed);
      } catch (e) {
        Alert.alert('Error', 'Could not load redemption.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // ── Poll for QR scan (auto-trigger review prompt) ─────────────────────────
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
          if (!alreadyReviewed) setShowReview(true);
        }
      } catch (_) {}
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current);
  }, [redemption?.status, id, alreadyReviewed]);

  // ── Submit review ─────────────────────────────────────────────────────────
  const handleSubmitReview = async () => {
    if (selectedStars === 0) {
      Alert.alert('Select a rating', 'Please tap a star before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await submitReview(id, selectedStars, comment);
      setAlreadyReviewed(true);
      setShowReview(false);
      // Go to perk detail to see the review in the list
      const resolvedPerkId = redemption?.perk || perk_id;
      if (resolvedPerkId && String(resolvedPerkId) !== String(id)) {
        router.replace(`/perk/${resolvedPerkId}`);
      } else {
        router.replace('/(tabs)/');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not submit review. Please try again.');
      setSubmitting(false);
    }
  };

  // ── Loading / not found ───────────────────────────────────────────────────
  if (loading) {
    return <View style={s.loader}><ActivityIndicator size="large" color="#1C3D5A" /></View>;
  }

  if (!redemption) {
    return (
      <View style={s.loader}>
        <Text style={s.errorText}>Redemption not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Full-screen review form ───────────────────────────────────────────────
  if (showReview) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.reviewContainer} keyboardShouldPersistTaps="handled">
          <View style={s.reviewCard}>
            <Text style={s.reviewTitle}>How was it?</Text>
            <Text style={s.reviewSub}>{redemption.perk_name}</Text>

            <View style={s.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setSelectedStars(n)} style={s.starBtn}>
                  <Text style={[s.starIcon, selectedStars >= n && s.starFilled]}>
                    {selectedStars >= n ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedStars > 0 && (
              <Text style={s.starsLabel}>{['', 'Terrible', 'Bad', 'OK', 'Good', 'Excellent'][selectedStars]}</Text>
            )}

            <TextInput
              style={s.commentInput}
              placeholder="Add a comment… (optional)"
              placeholderTextColor="#9ca3af"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            <TouchableOpacity
              style={[s.submitBtn, selectedStars === 0 && s.submitBtnDisabled]}
              onPress={handleSubmitReview}
              disabled={submitting || selectedStars === 0}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.submitBtnText}>Submit Review</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={s.skipBtn} onPress={() => setShowReview(false)}>
              <Text style={s.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── QR screen ─────────────────────────────────────────────────────────────
  const qrValue = `REDEMPTION:${redemption.id}`;

  return (
    <View style={s.container}>
      <View style={s.card}>
        <Text style={s.title}>Your Perk is Ready!</Text>
        <Text style={s.perkName}>{redemption.perk_name}</Text>
        <Text style={s.instruction}>Show this QR code to the provider</Text>

        <View style={s.qrContainer}>
          <QRCode value={qrValue} size={220} color="#111827" backgroundColor="#fff" />
        </View>

        <View style={s.infoBadge}>
          <Text style={s.infoText}>Redemption #{redemption.id}</Text>
          <View style={[s.statusBadge, { backgroundColor: redemption.status === 'redeemed' ? '#d1fae5' : '#EEEFF2' }]}>
            <Text style={[s.statusText, { color: redemption.status === 'redeemed' ? '#059669' : '#1C3D5A' }]}>
              {redemption.status}
            </Text>
          </View>
        </View>

        <Text style={s.cost}>{redemption.perk_credit_price} credits used</Text>
        {redemption.status === 'pending' && (
          <Text style={s.waitingText}>Waiting for provider to scan…</Text>
        )}
      </View>

      {/* Review button — available immediately after purchase */}
      {alreadyReviewed ? (
        <View style={s.reviewedBadge}>
          <Text style={s.reviewedTxt}>✓ You reviewed this perk</Text>
        </View>
      ) : (
        <TouchableOpacity style={s.reviewBtn} onPress={() => setShowReview(true)}>
          <Text style={s.reviewBtnTxt}>★  Leave a Review</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={s.doneBtn} onPress={() => router.replace('/(tabs)/')}>
        <Text style={s.doneBtnText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F8', padding: 20, justifyContent: 'center' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#6b7280', marginBottom: 12 },
  backLink: { fontSize: 15, color: '#1C3D5A', fontWeight: '600' },

  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 6 },
  perkName: { fontSize: 16, color: '#1C3D5A', fontWeight: '600', marginBottom: 8 },
  instruction: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  qrContainer: {
    padding: 16, backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 2, borderColor: '#e5e7eb', marginBottom: 20,
  },
  infoBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  infoText: { fontSize: 13, color: '#6b7280' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cost: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  waitingText: { fontSize: 12, color: '#6b7280', marginTop: 8, fontStyle: 'italic' },

  reviewBtn: {
    marginTop: 14, backgroundColor: '#EDF2FF', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#C7D7FF',
  },
  reviewBtnTxt: { fontSize: 15, fontWeight: '700', color: '#1C3D5A' },

  reviewedBadge: {
    marginTop: 14, backgroundColor: '#d1fae5', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  reviewedTxt: { fontSize: 15, fontWeight: '700', color: '#059669' },

  doneBtn: {
    marginTop: 10, backgroundColor: '#1C3D5A', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // ── Review form ──
  reviewContainer: { flexGrow: 1, backgroundColor: '#F7F7F8', padding: 20, justifyContent: 'center' },
  reviewCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  reviewTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  reviewSub: { fontSize: 15, color: '#6b7280', marginBottom: 20, textAlign: 'center' },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  starBtn: { padding: 4 },
  starIcon: { fontSize: 38, color: '#d1d5db' },
  starFilled: { color: '#f59e0b' },
  starsLabel: { fontSize: 13, color: '#6b7280', fontWeight: '600', marginBottom: 18 },
  commentInput: {
    width: '100%', backgroundColor: '#f3f4f6', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827',
    textAlignVertical: 'top', marginBottom: 16, minHeight: 80,
  },
  submitBtn: {
    width: '100%', backgroundColor: '#1C3D5A', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginBottom: 10,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  skipBtn: { paddingVertical: 10 },
  skipBtnText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
});
