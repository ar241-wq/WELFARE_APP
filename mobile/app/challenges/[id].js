import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getChallengeDetail } from '../../lib/api';

const TYPE_META = {
  kpi:         { label: 'KPI Target',        color: '#1C3D5A', bg: '#E8EDF2' },
  ai_adoption: { label: 'AI Adoption',       color: '#1C3D5A', bg: '#E8EDF2' },
  first_to:    { label: 'First to Complete', color: '#5B5E66', bg: '#EEEFF2' },
  innovation:  { label: 'Innovation',        color: '#065f46', bg: '#D1FAE5' },
  custom:      { label: 'Challenge',         color: '#5B5E66', bg: '#EEEFF2' },
};

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChallengeDetail(id)
      .then(setChallenge)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#1C3D5A" /></View>;
  }
  if (!challenge) {
    return <View style={styles.loader}><Text style={{ color: '#6b7280' }}>Challenge not found.</Text></View>;
  }

  const meta = TYPE_META[challenge.challenge_type] || TYPE_META.custom;
  const isCompleted = challenge.status === 'completed';
  const myDept = challenge.user_department;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Back */}
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backTxt}>‹ Back</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.typePill, { backgroundColor: meta.bg }]}>
            <Text style={[styles.typePillTxt, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={styles.heroTitle}>{challenge.title}</Text>
          {challenge.deadline && (
            <Text style={styles.heroDeadline}>Deadline: {new Date(challenge.deadline).toLocaleDateString()}</Text>
          )}
          <View style={styles.prizeBox}>
            <Text style={styles.prizeLabelTop}>Prize Pool</Text>
            <Text style={styles.prizeTotal}>{challenge.reward_credits} credits</Text>
            <Text style={styles.prizeSub}>split equally among winning department members</Text>
          </View>
        </View>

        {/* My department banner */}
        {myDept && !isCompleted && (
          <View style={styles.myDeptBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.myDeptTitle}>You're competing with {myDept.name}</Text>
              <Text style={styles.myDeptSub}>If your department wins, you and your colleagues share the prize.</Text>
            </View>
          </View>
        )}

        {/* Winner banner */}
        {isCompleted && challenge.winner_department && (
          <View style={styles.winnerBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.winnerLabel}>Winning Department</Text>
              <Text style={styles.winnerName}>{challenge.winner_department.name}</Text>
              {myDept && myDept.id === challenge.winner_department.id && (
                <Text style={styles.winnerYou}>That's your team! Credits sent to your wallet.</Text>
              )}
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>The Challenge</Text>
          <Text style={styles.desc}>{challenge.description}</Text>
        </View>

        {challenge.target_metric ? (
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Success Metric</Text>
            <Text style={styles.metricText}>{challenge.target_metric}</Text>
          </View>
        ) : null}

        {/* Department leaderboard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Departments Competing</Text>
          {challenge.departments.map((dept, i) => {
            const eachAmount = dept.member_count > 0
              ? (parseFloat(challenge.reward_credits) / dept.member_count).toFixed(2)
              : '—';
            const isWinner = challenge.winner_department?.id === dept.id;
            const isMe = myDept?.id === dept.id;
            return (
              <View key={dept.id} style={[styles.deptRow, isWinner && styles.deptRowWinner, isMe && !isWinner && styles.deptRowMe]}>
                <View style={styles.deptRank}>
                  <Text style={styles.deptRankTxt}>{isWinner ? '★' : `#${i + 1}`}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.deptNameRow}>
                    <Text style={[styles.deptName, isWinner && styles.deptNameWinner]}>{dept.name}</Text>
                    {isMe && <Text style={styles.deptYouBadge}>You</Text>}
                  </View>
                  <Text style={styles.deptMembers}>{dept.member_count} members</Text>
                </View>
                <View style={styles.deptPrize}>
                  <Text style={[styles.deptEach, isWinner && styles.deptEachWinner]}>{eachAmount}</Text>
                  <Text style={styles.deptEachLabel}>each</Text>
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F8' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { paddingHorizontal: 16, paddingBottom: 8, backgroundColor: '#fff' },
  backBtn: { paddingVertical: 4 },
  backTxt: { fontSize: 17, color: '#1C3D5A', fontWeight: '600' },

  hero: {
    backgroundColor: '#fff', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 28,
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 10,
  },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  typePillIcon: { fontSize: 15 },
  typePillTxt: { fontSize: 13, fontWeight: '800' },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#111827', textAlign: 'center' },
  heroDeadline: { fontSize: 13, color: '#9ca3af' },
  prizeBox: {
    backgroundColor: '#E8EDF2', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#D4D6DC', width: '100%', marginTop: 4,
  },
  prizeLabelTop: { fontSize: 12, fontWeight: '700', color: '#5B5E66', marginBottom: 4 },
  prizeTotal: { fontSize: 36, fontWeight: '900', color: '#1C3D5A' },
  prizeSub: { fontSize: 11, color: '#8E9099', marginTop: 4, textAlign: 'center' },

  myDeptBanner: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: '#F7F7F8',
    borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderWidth: 1.5, borderColor: '#D4D6DC',
  },
  myDeptTitle: { fontSize: 14, fontWeight: '800', color: '#1C3D5A', marginBottom: 3 },
  myDeptSub: { fontSize: 13, color: '#5B5E66', lineHeight: 18 },

  winnerBanner: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: '#F7F7F8',
    borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: '#D4D6DC',
  },
  winnerLabel: { fontSize: 11, fontWeight: '700', color: '#8E9099', textTransform: 'uppercase' },
  winnerName: { fontSize: 18, fontWeight: '900', color: '#1C3D5A' },
  winnerYou: { fontSize: 13, color: '#059669', fontWeight: '700', marginTop: 3 },

  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  desc: { fontSize: 15, color: '#374151', lineHeight: 22, backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  metricBox: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: '#F7F7F8', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#D4D6DC',
  },
  metricLabel: { fontSize: 11, fontWeight: '800', color: '#5B5E66', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 },
  metricText: { fontSize: 14, fontWeight: '700', color: '#1C3D5A' },

  deptRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1.5, borderColor: '#e5e7eb',
  },
  deptRowWinner: { borderColor: '#D4D6DC', backgroundColor: '#E8EDF2' },
  deptRowMe: { borderColor: '#1C3D5A', backgroundColor: '#F7F7F8' },
  deptRank: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  deptRankTxt: { fontSize: 14, fontWeight: '800', color: '#374151' },
  deptNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deptName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  deptNameWinner: { color: '#1C3D5A' },
  deptYouBadge: { fontSize: 10, fontWeight: '800', color: '#1C3D5A', backgroundColor: '#E8EDF2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  deptMembers: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  deptPrize: { alignItems: 'center' },
  deptEach: { fontSize: 18, fontWeight: '900', color: '#374151' },
  deptEachWinner: { color: '#1C3D5A' },
  deptEachLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '600' },
});
