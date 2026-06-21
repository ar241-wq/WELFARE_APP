import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getRedemptions, checkReview, submitReview } from '../lib/api';

function StarPicker({ value, onChange }) {
  return (
    <View style={rw.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)}>
          <Text style={[rw.star, n <= value && rw.starFilled]}>{n <= value ? '★' : '☆'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ReviewModal({ redemption, onClose, onSubmit }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!stars) { Alert.alert('Pick a rating', 'Please select 1-5 stars.'); return; }
    setSubmitting(true);
    try {
      await submitReview(redemption.id, stars, comment.trim());
      onSubmit();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={rw.overlay}>
        <View style={rw.card}>
          <Text style={rw.title}>Rate your experience</Text>
          <Text style={rw.perkName}>{redemption.perk_name}</Text>

          <StarPicker value={stars} onChange={setStars} />
          <Text style={rw.starsLabel}>{['', 'Terrible', 'Bad', 'OK', 'Good', 'Excellent'][stars] || 'Tap a star'}</Text>

          <TextInput
            style={rw.input}
            placeholder="Optional comment…"
            placeholderTextColor="#9ca3af"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[rw.submitBtn, !stars && rw.submitDisabled]}
            onPress={handleSubmit}
            disabled={!stars || submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={rw.submitTxt}>Submit Review</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={rw.skipBtn} onPress={onClose}>
            <Text style={rw.skipTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function RedemptionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [redemptions, setRedemptions] = useState([]);
  const [reviewStatus, setReviewStatus] = useState({}); // id -> { reviewed: bool }
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null); // redemption object being reviewed

  const load = useCallback(async () => {
    try {
      const data = await getRedemptions();
      const list = Array.isArray(data) ? data : data?.results || [];
      setRedemptions(list);

      // Check review status for all non-cancelled redemptions
      const redeemed = list.filter(r => r.status !== 'cancelled');
      const checks = await Promise.all(
        redeemed.map(r =>
          checkReview(r.id).then(d => [r.id, d]).catch(() => [r.id, { reviewed: false }])
        )
      );
      const statusMap = {};
      checks.forEach(([id, d]) => { statusMap[id] = d; });
      setReviewStatus(statusMap);
    } catch (e) {
      Alert.alert('Error', 'Could not load redemptions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const STATUS_COLOR = {
    pending: '#f59e0b',
    redeemed: '#10b981',
    expired: '#9ca3af',
    cancelled: '#ef4444',
  };

  const STATUS_LABEL = {
    pending: 'Pending',
    redeemed: 'Redeemed',
    expired: 'Expired',
    cancelled: 'Cancelled',
  };

  if (loading) {
    return (
      <View style={[s.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backTxt}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>My Redemptions</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {redemptions.length === 0 && (
          <Text style={s.empty}>No redemptions yet. Redeem perks from the catalog!</Text>
        )}
        {redemptions.map((r) => {
          const canReview = r.status !== 'cancelled' && reviewStatus[r.id] && !reviewStatus[r.id].reviewed;
          const alreadyReviewed = r.status !== 'cancelled' && reviewStatus[r.id]?.reviewed;
          const color = STATUS_COLOR[r.status] || '#6b7280';
          return (
            <View key={r.id} style={s.card}>
              <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.perkName}>{r.perk_name}</Text>
                  <Text style={s.providerName}>{r.provider_name}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: color + '18', borderColor: color }]}>
                  <Text style={[s.statusTxt, { color }]}>{STATUS_LABEL[r.status] || r.status}</Text>
                </View>
              </View>

              <View style={s.cardMeta}>
                <Text style={s.metaText}>{r.credit_price} credits</Text>
                {r.redeemed_at && (
                  <Text style={s.metaText}>
                    Redeemed {new Date(r.redeemed_at).toLocaleDateString()}
                  </Text>
                )}
              </View>

              {canReview && (
                <TouchableOpacity style={s.reviewBtn} onPress={() => setReviewing(r)}>
                  <Text style={s.reviewBtnTxt}>★ Leave a Review</Text>
                </TouchableOpacity>
              )}
              {alreadyReviewed && (
                <View style={s.reviewedTag}>
                  <Text style={s.reviewedTxt}>✓ Reviewed</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {reviewing && (
        <ReviewModal
          redemption={reviewing}
          onClose={() => setReviewing(null)}
          onSubmit={() => {
            setReviewing(null);
            load();
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  back: { marginBottom: 4 },
  backTxt: { fontSize: 15, color: '#6366f1', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60, fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#e5e7eb' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  perkName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  providerName: { fontSize: 13, color: '#6b7280' },
  statusBadge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, alignSelf: 'flex-start' },
  statusTxt: { fontSize: 12, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', gap: 16 },
  metaText: { fontSize: 12, color: '#9ca3af' },
  reviewBtn: { marginTop: 12, backgroundColor: '#fef3c7', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#f59e0b' },
  reviewBtnTxt: { fontSize: 14, fontWeight: '700', color: '#d97706' },
  reviewedTag: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: '#d1fae5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  reviewedTxt: { fontSize: 12, color: '#059669', fontWeight: '700' },
});

const rw = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 6 },
  perkName: { fontSize: 15, color: '#6b7280', marginBottom: 20 },
  stars: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 6 },
  star: { fontSize: 36, color: '#e5e7eb' },
  starFilled: { color: '#f59e0b' },
  starsLabel: { textAlign: 'center', fontSize: 14, color: '#6b7280', fontWeight: '600', marginBottom: 20 },
  input: {
    backgroundColor: '#f9fafb', borderRadius: 14, borderWidth: 1.5, borderColor: '#e5e7eb',
    padding: 14, fontSize: 15, color: '#111827', minHeight: 90, textAlignVertical: 'top', marginBottom: 16,
  },
  submitBtn: { backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  submitDisabled: { backgroundColor: '#d1d5db' },
  submitTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  skipBtn: { alignItems: 'center', paddingVertical: 10 },
  skipTxt: { color: '#9ca3af', fontSize: 15, fontWeight: '600' },
});
