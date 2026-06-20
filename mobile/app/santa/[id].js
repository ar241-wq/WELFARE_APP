import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSantaEvent, sendSantaGift } from '../../lib/api';

export default function SantaDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);

  async function load() {
    try {
      const data = await getSantaEvent(id);
      setEvent(data);
      if (data.credit_budget) setAmount(String(data.credit_budget));
    } catch (e) {
      Alert.alert('Error', 'Could not load event.');
      router.back();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  const handleSendGift = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('Enter amount'); return; }
    setSending(true);
    try {
      const res = await sendSantaGift(id, amt);
      Alert.alert('Gift Sent!', res.detail, [{ text: 'Awesome!', onPress: load }]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading || !event) return <View style={s.center}><ActivityIndicator size="large" color="#6366f1" /></View>;

  const isAssigned = event.status === 'assigned' || event.status === 'revealed';
  const isRevealed = event.status === 'revealed';

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 60 }}>
      {/* Header */}
      <View style={s.hero}>
        <Text style={{ fontSize: 56 }}>🎅</Text>
        <Text style={s.title}>{event.title}</Text>
        <Text style={s.dept}>{event.department_name}</Text>
        <View style={s.budgetPill}>
          <Text style={s.budgetTxt}>{event.credit_budget} credits budget</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statNum}>{event.participant_count}</Text>
          <Text style={s.statLabel}>Joined</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statNum}>{new Date(event.join_deadline).toLocaleDateString()}</Text>
          <Text style={s.statLabel}>Deadline</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statNum}>{new Date(event.reveal_date).toLocaleDateString()}</Text>
          <Text style={s.statLabel}>Reveal</Text>
        </View>
      </View>

      {/* My Assignment (status = assigned and I'm in) */}
      {isAssigned && event.my_assignment && !isRevealed && (
        <View style={s.assignmentCard}>
          <Text style={s.assignLabel}>Your Secret Assignment</Text>
          <Text style={s.assignName}>{event.my_assignment.receiver_name}</Text>
          <Text style={s.assignSub}>Send them a gift — they won't know it's from you until the reveal!</Text>

          <View style={s.amountRow}>
            <Text style={s.amountLabel}>Gift amount (credits)</Text>
            <TextInput
              style={s.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder={String(event.credit_budget)}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <TouchableOpacity style={s.giftBtn} onPress={handleSendGift} disabled={sending}>
            {sending
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.giftBtnTxt}>Send Secret Gift</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Reveal screen */}
      {isRevealed && event.all_assignments && (
        <View style={s.revealCard}>
          <Text style={s.revealTitle}>The Big Reveal!</Text>
          <Text style={s.revealSub}>Here's who had whom:</Text>
          {event.all_assignments.map((a, i) => (
            <View key={i} style={s.revealRow}>
              <Text style={s.revealGiver}>{a.giver_name}</Text>
              <Text style={s.revealArrow}>→</Text>
              <Text style={s.revealReceiver}>{a.receiver_name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Waiting state */}
      {event.status === 'open' && (
        <View style={s.waitCard}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>⏳</Text>
          <Text style={s.waitTitle}>Waiting for assignments</Text>
          <Text style={s.waitSub}>HR will lock assignments after the join deadline. Make sure you've joined!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 24, backgroundColor: '#fff', borderRadius: 24, padding: 28, borderWidth: 1.5, borderColor: '#e5e7eb' },
  title: { fontSize: 22, fontWeight: '900', color: '#111', marginTop: 10, textAlign: 'center' },
  dept: { fontSize: 14, color: '#6366f1', fontWeight: '700', marginTop: 4 },
  budgetPill: { marginTop: 12, backgroundColor: '#eef2ff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99 },
  budgetTxt: { color: '#6366f1', fontWeight: '800', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb' },
  statNum: { fontSize: 15, fontWeight: '800', color: '#111', textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2, fontWeight: '600' },
  assignmentCard: { backgroundColor: '#1a0533', borderRadius: 24, padding: 24, marginBottom: 20 },
  assignLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  assignName: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 6 },
  assignSub: { color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 20, marginBottom: 20 },
  amountLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  amountRow: { marginBottom: 16 },
  amountInput: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 18, fontWeight: '700', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  giftBtn: { backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  giftBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  revealCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: '#fde68a' },
  revealTitle: { fontSize: 20, fontWeight: '900', color: '#111', marginBottom: 4 },
  revealSub: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  revealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 8 },
  revealGiver: { flex: 1, fontWeight: '700', color: '#111', fontSize: 14 },
  revealArrow: { fontSize: 16 },
  revealReceiver: { flex: 1, fontWeight: '700', color: '#6366f1', fontSize: 14, textAlign: 'right' },
  waitCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb' },
  waitTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 6 },
  waitSub: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
});
