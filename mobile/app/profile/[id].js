import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getColleagueProfile } from '../../lib/api';

const EVENT_ICONS = {
  new_baby: '🍼', medical: '🏥', relocation: '📦',
  bereavement: '🌹', burnout: '😮‍💨',
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
}

export default function ColleagueProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getColleagueProfile(id)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#6366f1" /></View>;
  }
  if (!profile) {
    return <View style={styles.loader}><Text style={{ color: '#6b7280' }}>Profile not found.</Text></View>;
  }

  const avatarUrl = resolveUrl(profile.avatar);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Back */}
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backTxt}>‹ Back</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{profile.full_name[0]}</Text>
            </View>
          )}
          <Text style={styles.name}>{profile.full_name}</Text>
          {profile.department && (
            <View style={styles.deptPill}>
              <Text style={styles.deptPillTxt}>🏢 {profile.department.name}</Text>
            </View>
          )}
          {profile.birthday && (
            <Text style={styles.birthday}>🎂 Birthday: {profile.birthday}</Text>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{profile.credits_received}</Text>
            <Text style={styles.statLabel}>Credits received</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={styles.statNum}>{profile.life_events.length}</Text>
            <Text style={styles.statLabel}>Life moments</Text>
          </View>
        </View>

        {/* Life events */}
        {profile.life_events.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Life Moments</Text>
            {profile.life_events.map((e) => (
              <View key={e.id} style={styles.eventRow}>
                <Text style={styles.eventIcon}>{EVENT_ICONS[e.event_type] || '❤️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventType}>{e.event_type_display}</Text>
                  <Text style={styles.eventDate}>{new Date(e.created_at).toLocaleDateString()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Message button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.msgBtn}
            onPress={() => router.push(`/chat/dm/${profile.id}`)}
            activeOpacity={0.85}
          >
            <Text style={styles.msgTxt}>💬 Send a Message</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { paddingHorizontal: 16, paddingBottom: 8, backgroundColor: '#fff' },
  backTxt: { fontSize: 17, color: '#6366f1', fontWeight: '600' },

  hero: {
    backgroundColor: '#fff', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 8,
  },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 4 },
  avatarFallback: {
    width: 90, height: 90, borderRadius: 45, marginBottom: 4,
    backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#c7d2fe',
  },
  avatarLetter: { fontSize: 36, fontWeight: '800', color: '#6366f1' },
  name: { fontSize: 22, fontWeight: '900', color: '#111827' },
  deptPill: {
    backgroundColor: '#eff6ff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1.5, borderColor: '#bfdbfe',
  },
  deptPillTxt: { fontSize: 13, fontWeight: '700', color: '#1d4ed8' },
  birthday: { fontSize: 13, color: '#9ca3af' },

  statsRow: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 16,
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden',
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: '#e5e7eb' },
  statNum: { fontSize: 26, fontWeight: '900', color: '#6366f1' },
  statLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '600', marginTop: 2 },

  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  eventRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  eventIcon: { fontSize: 26 },
  eventType: { fontSize: 14, fontWeight: '700', color: '#111827' },
  eventDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  msgBtn: {
    backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  msgTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
