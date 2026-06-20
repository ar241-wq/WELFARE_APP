import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSantaEvents, joinSantaEvent } from '../../lib/api';

function statusColor(s) {
  if (s === 'open') return '#10b981';
  if (s === 'assigned') return '#6366f1';
  return '#f59e0b';
}
function statusLabel(s) {
  if (s === 'open') return 'Open — Join Now';
  if (s === 'assigned') return 'Assigned';
  return 'Revealed';
}

export default function SantaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await getSantaEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleJoin = async (event) => {
    try {
      const res = await joinSantaEvent(event.id);
      Alert.alert(res.joined ? 'Joined!' : 'Left event', res.joined ? 'You are in the Secret Santa!' : 'You left the event.');
      load();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top + 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <Text style={s.title}>Secret Santa</Text>
      <Text style={s.sub}>Gift exchange with your department</Text>

      {events.length === 0 && (
        <View style={s.empty}>
          <Text style={{ fontSize: 52, marginBottom: 12 }}>🎄</Text>
          <Text style={s.emptyTitle}>No events yet</Text>
          <Text style={s.emptySub}>Your HR will create a Secret Santa event for your department.</Text>
        </View>
      )}

      {events.map((ev) => (
        <TouchableOpacity key={ev.id} style={s.card} onPress={() => router.push(`/santa/${ev.id}`)}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>{ev.title}</Text>
            <View style={[s.statusBadge, { backgroundColor: statusColor(ev.status) + '22', borderColor: statusColor(ev.status) }]}>
              <Text style={[s.statusTxt, { color: statusColor(ev.status) }]}>{statusLabel(ev.status)}</Text>
            </View>
          </View>
          <Text style={s.dept}>{ev.department_name}</Text>
          <View style={s.row}>
            <Text style={s.meta}>Budget: {ev.credit_budget} credits</Text>
            <Text style={s.meta}>{ev.participant_count} joined</Text>
          </View>
          <Text style={s.meta}>Reveal: {new Date(ev.reveal_date).toLocaleDateString()}</Text>
          {ev.status === 'open' && (
            <TouchableOpacity
              style={[s.joinBtn, ev.is_joined && s.joinBtnOut]}
              onPress={() => handleJoin(ev)}
            >
              <Text style={[s.joinTxt, ev.is_joined && s.joinTxtOut]}>
                {ev.is_joined ? 'Leave Event' : 'Join Event'}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#111', paddingHorizontal: 20, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: '#9ca3af', fontWeight: '600', paddingHorizontal: 20, marginTop: 4, marginBottom: 20 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  card: {
    marginHorizontal: 16, marginBottom: 14, backgroundColor: '#fff',
    borderRadius: 20, padding: 18, borderWidth: 1.5, borderColor: '#e5e7eb',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#111', flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1.5 },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  dept: { fontSize: 13, color: '#6366f1', fontWeight: '600', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  meta: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  joinBtn: {
    marginTop: 14, backgroundColor: '#6366f1', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  joinBtnOut: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb' },
  joinTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  joinTxtOut: { color: '#374151' },
});
