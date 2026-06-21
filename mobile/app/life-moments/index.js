import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getMyLifeEvents } from '../../lib/api';

const EVENT_LABELS = {
  new_baby: { label: 'New Baby', icon: '🍼' },
  medical: { label: 'Medical Leave', icon: '🏥' },
  relocation: { label: 'Relocation', icon: '📦' },
  bereavement: { label: 'Bereavement', icon: '🌹' },
  burnout: { label: 'Burnout Leave', icon: '😮‍💨' },
};

const STATUS_COLORS = {
  pending_approval: { bg: '#fef3c7', text: '#d97706', label: 'Pending Approval' },
  approved: { bg: '#d1fae5', text: '#059669', label: 'Approved' },
  delivered: { bg: '#EEEFF2', text: '#1C3D5A', label: 'Delivered' },
};

export default function LifeMomentsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await getMyLifeEvents();
      setEvents(Array.isArray(data) ? data : data?.results || []);
    } catch (e) {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#1C3D5A" /></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Life Moments</Text>
          <Text style={styles.bannerText}>
            Share a life event and let your company and teammates support you with a care package.
          </Text>
        </View>

        {events.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No life events yet</Text>
            <Text style={styles.emptyText}>When something important happens in your life, mark it here and let your team show up for you.</Text>
          </View>
        ) : (
          events.map((event) => {
            const meta = EVENT_LABELS[event.event_type] || { label: event.event_type_display, icon: '❤️' };
            const pkg = event.care_package;
            const pkgStatus = pkg ? STATUS_COLORS[pkg.status] : null;
            return (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => pkg?.status === 'approved' && router.push({ pathname: '/life-moments/care-package', params: { eventId: event.id } })}
              >
                <View style={styles.eventHeader}>
                  <Text style={styles.eventIcon}>{meta.icon}</Text>
                  <View style={styles.eventMeta}>
                    <Text style={styles.eventLabel}>{meta.label}</Text>
                    <Text style={styles.eventDate}>{new Date(event.created_at).toLocaleDateString()}</Text>
                  </View>
                  {pkgStatus && (
                    <View style={[styles.statusPill, { backgroundColor: pkgStatus.bg }]}>
                      <Text style={[styles.statusText, { color: pkgStatus.text }]}>{pkgStatus.label}</Text>
                    </View>
                  )}
                </View>
                {pkg?.status === 'approved' && (
                  <Text style={styles.tapHint}>Tap to view your care package →</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View style={styles.fab}>
        <TouchableOpacity style={styles.fabBtn} onPress={() => router.push('/life-moments/new')}>
          <Text style={styles.fabText}>+ Mark Life Event</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F8' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  banner: { backgroundColor: '#EEEFF2', borderRadius: 16, padding: 20, marginBottom: 20 },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#1C3D5A', marginBottom: 6 },
  bannerText: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  eventCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1.5, borderColor: '#e5e7eb',
  },
  eventHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eventIcon: { fontSize: 28 },
  eventMeta: { flex: 1 },
  eventLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  eventDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  tapHint: { fontSize: 12, color: '#1C3D5A', fontWeight: '600', marginTop: 10, marginLeft: 40 },
  fab: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  fabBtn: { backgroundColor: '#1C3D5A', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
