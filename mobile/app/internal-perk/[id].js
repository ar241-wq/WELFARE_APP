import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getInternalPerk, redeemInternalPerk } from '../../lib/api';

export default function InternalPerkScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [perk, setPerk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [requesting, setRequesting] = useState(false);

  async function load() {
    try {
      const data = await getInternalPerk(id);
      setPerk(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load perk.');
      router.back();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  const handleRequest = async () => {
    setRequesting(true);
    try {
      const res = await redeemInternalPerk(id, note);
      Alert.alert('Success!', res.detail, [{ text: 'Great!', onPress: load }]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not submit request.');
    } finally {
      setRequesting(false);
    }
  };

  if (loading || !perk) return <View style={s.center}><ActivityIndicator size="large" color="#1C3D5A" /></View>;

  const alreadyRequested = perk.has_requested;
  const statusColor = perk.my_request_status === 'approved' ? '#10b981' : perk.my_request_status === 'denied' ? '#ef4444' : '#f59e0b';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.root} contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={s.hero}>
          <Text style={{ fontSize: 64 }}>{perk.icon}</Text>
          <Text style={s.title}>{perk.title}</Text>
          <Text style={s.company}>{perk.company_name}</Text>
          <View style={s.costRow}>
            {perk.is_free || perk.credit_cost === 0
              ? <View style={s.freeBadge}><Text style={s.freeTxt}>FREE</Text></View>
              : <View style={s.costBadge}><Text style={s.costTxt}>{perk.credit_cost} credits</Text></View>
            }
            {perk.slots_remaining !== null && (
              <View style={s.slotBadge}>
                <Text style={s.slotTxt}>{perk.slots_remaining} slots left</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={s.descCard}>
          <Text style={s.descLabel}>About this perk</Text>
          <Text style={s.desc}>{perk.description}</Text>
        </View>

        {/* Already requested */}
        {alreadyRequested && (
          <View style={[s.statusCard, { borderColor: statusColor, backgroundColor: statusColor + '11' }]}>
            <Text style={[s.statusTitle, { color: statusColor }]}>
              {perk.my_request_status === 'pending' ? 'Request Pending' : perk.my_request_status === 'approved' ? 'Approved' : 'Denied'}
            </Text>
            <Text style={s.statusSub}>
              {perk.my_request_status === 'pending' ? 'Your HR team will review and get back to you.' : perk.my_request_status === 'approved' ? 'Your request has been approved. Enjoy!' : 'This request was not approved this time.'}
            </Text>
          </View>
        )}

        {/* Request form */}
        {!alreadyRequested && (
          <View style={s.form}>
            <Text style={s.noteLabel}>Add a note (optional)</Text>
            <TextInput
              style={s.noteInput}
              placeholder="Any context for HR..."
              placeholderTextColor="#9ca3af"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity style={s.btn} onPress={handleRequest} disabled={requesting}>
              {requesting
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnTxt}>
                    {perk.requires_approval ? 'Request This Perk' : 'Redeem Now'}
                  </Text>
              }
            </TouchableOpacity>
            {perk.requires_approval && (
              <Text style={s.approvalNote}>Requires HR approval</Text>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, padding: 28, marginBottom: 16, borderWidth: 1.5, borderColor: '#EEEFF2' },
  title: { fontSize: 22, fontWeight: '900', color: '#111', marginTop: 12, textAlign: 'center' },
  company: { fontSize: 14, color: '#1C3D5A', fontWeight: '700', marginTop: 4 },
  costRow: { flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  freeBadge: { backgroundColor: '#dcfce7', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8 },
  freeTxt: { color: '#16a34a', fontWeight: '800', fontSize: 14 },
  costBadge: { backgroundColor: '#EEEFF2', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8 },
  costTxt: { color: '#1C3D5A', fontWeight: '800', fontSize: 14 },
  slotBadge: { backgroundColor: '#fef3c7', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8 },
  slotTxt: { color: '#d97706', fontWeight: '700', fontSize: 14 },
  descCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1.5, borderColor: '#e5e7eb' },
  descLabel: { fontSize: 12, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  desc: { fontSize: 15, color: '#374151', lineHeight: 22 },
  statusCard: { borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1.5 },
  statusTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  statusSub: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  form: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: '#e5e7eb' },
  noteLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  noteInput: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 14, color: '#111', textAlignVertical: 'top', minHeight: 80, marginBottom: 16 },
  btn: { backgroundColor: '#1C3D5A', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  approvalNote: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 10 },
});
