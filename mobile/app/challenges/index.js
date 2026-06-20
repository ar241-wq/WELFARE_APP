import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getChallenges } from '../../lib/api';

const TYPE_META = {
  kpi:         { label: 'KPI Target',        icon: '📊', color: '#1d4ed8', bg: '#eff6ff' },
  ai_adoption: { label: 'AI Adoption',       icon: '🤖', color: '#6d28d9', bg: '#f5f3ff' },
  first_to:    { label: 'First to Complete', icon: '⚡', color: '#b45309', bg: '#fffbeb' },
  innovation:  { label: 'Innovation',        icon: '💡', color: '#065f46', bg: '#ecfdf5' },
  custom:      { label: 'Challenge',         icon: '🎯', color: '#374151', bg: '#f3f4f6' },
};

export default function ChallengesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await getChallenges();
      setChallenges(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#6366f1" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Work Challenges 🏆</Text>
        <Text style={styles.subtitle}>Hit targets, adopt AI, compete & win credits</Text>
      </View>

      {challenges.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={styles.emptyText}>No active challenges</Text>
          <Text style={styles.emptySubtext}>Your employer hasn't launched any yet. Check back soon!</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {challenges.map((c) => {
            const meta = TYPE_META[c.challenge_type] || TYPE_META.custom;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.card, c.status === 'completed' && styles.cardCompleted]}
                onPress={() => router.push(`/challenges/${c.id}`)}
                activeOpacity={0.85}
              >
                {/* Type badge */}
                <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
                  <Text style={styles.typeBadgeIcon}>{meta.icon}</Text>
                  <Text style={[styles.typeBadgeTxt, { color: meta.color }]}>{meta.label}</Text>
                </View>

                <View style={styles.cardMain}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardTitle}>{c.title}</Text>
                    {c.target_metric ? (
                      <Text style={styles.cardMetric}>🎯 {c.target_metric}</Text>
                    ) : (
                      <Text style={styles.cardDesc} numberOfLines={2}>{c.description}</Text>
                    )}
                  </View>
                  <View style={styles.rewardBadge}>
                    <Text style={styles.rewardNum}>{c.reward_credits}</Text>
                    <Text style={styles.rewardLabel}>prize pool</Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <View style={[styles.statusChip, c.status === 'completed' ? styles.statusDone : styles.statusActive]}>
                    <Text style={[styles.statusTxt, c.status === 'completed' ? styles.statusDoneTxt : styles.statusActiveTxt]}>
                      {c.status === 'completed' ? '✓ Completed' : '● Active'}
                    </Text>
                  </View>
                  <Text style={styles.entryCount}>{c.entry_count} {c.entry_count === 1 ? 'entry' : 'entries'}</Text>
                  <Text style={styles.competitorCount}>🏢 {c.department_count} departments</Text>
                  {c.distributed && <Text style={styles.distributedBadge}>✓ Prize distributed</Text>}
                  {c.winner_department && <Text style={styles.winnerBadge}>🏆 {c.winner_department.name}</Text>}
                  {c.deadline && <Text style={styles.deadlineText}>Due {new Date(c.deadline).toLocaleDateString()}</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  title: { fontSize: 26, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    borderWidth: 1.5, borderColor: '#e5e7eb',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2, gap: 12,
  },
  cardCompleted: { opacity: 0.72, borderColor: '#d1d5db' },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  typeBadgeIcon: { fontSize: 13 },
  typeBadgeTxt: { fontSize: 11, fontWeight: '800' },
  cardMain: { flexDirection: 'row', gap: 12 },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 4 },
  cardMetric: { fontSize: 12, color: '#4338ca', fontWeight: '600', lineHeight: 17 },
  cardDesc: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  rewardBadge: {
    backgroundColor: '#fef3c7', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#fde68a', minWidth: 66,
  },
  rewardNum: { fontSize: 20, fontWeight: '900', color: '#d97706' },
  rewardLabel: { fontSize: 10, color: '#92400e', fontWeight: '700' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  statusChip: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusActive: { backgroundColor: '#ecfdf5' },
  statusDone: { backgroundColor: '#f3f4f6' },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  statusActiveTxt: { color: '#059669' },
  statusDoneTxt: { color: '#6b7280' },
  entryCount: { fontSize: 11, color: '#9ca3af' },
  competitorCount: { fontSize: 11, color: '#6b7280' },
  distributedBadge: { fontSize: 11, fontWeight: '700', color: '#059669' },
  winnerBadge: { fontSize: 11, fontWeight: '700', color: '#d97706' },
  deadlineText: { fontSize: 11, color: '#9ca3af' },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
});
