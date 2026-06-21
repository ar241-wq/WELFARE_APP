import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { markLifeEvent } from '../../lib/api';

const EVENTS = [
  { key: 'new_baby', icon: '🍼', label: 'New Baby', desc: 'Welcoming a new child into the family' },
  { key: 'medical', icon: '🏥', label: 'Medical Leave', desc: 'Recovering from illness or surgery' },
  { key: 'relocation', icon: '📦', label: 'Relocation', desc: 'Moving to a new city or country' },
  { key: 'bereavement', icon: '🌹', label: 'Bereavement', desc: 'Loss of a loved one' },
  { key: 'burnout', icon: '😮‍💨', label: 'Burnout Leave', desc: 'Taking time to recover and recharge' },
];

export default function NewLifeEventScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!selected) {
      Alert.alert('Select an event', 'Please choose a life event type.');
      return;
    }
    setLoading(true);
    try {
      await markLifeEvent(selected, note);
      Alert.alert(
        'Life Event Marked',
        'Your HR manager has been notified and will prepare a care package for you. Your colleagues may also send you care credits.',
        [{ text: 'Thank you', onPress: () => router.replace('/life-moments') }]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not mark life event.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.subtitle}>What's happening in your life? This is private — only HR is notified.</Text>

      {EVENTS.map((event) => (
        <TouchableOpacity
          key={event.key}
          style={[styles.eventOption, selected === event.key && styles.eventOptionSelected]}
          onPress={() => setSelected(event.key)}
        >
          <Text style={styles.eventIcon}>{event.icon}</Text>
          <View style={styles.eventText}>
            <Text style={[styles.eventLabel, selected === event.key && styles.eventLabelSelected]}>
              {event.label}
            </Text>
            <Text style={styles.eventDesc}>{event.desc}</Text>
          </View>
          {selected === event.key && <Text style={styles.check}>✓</Text>}
        </TouchableOpacity>
      ))}

      <Text style={styles.noteLabel}>Optional note (private, only visible to HR)</Text>
      <TextInput
        style={styles.noteInput}
        placeholder="Add any details you'd like to share..."
        placeholderTextColor="#9ca3af"
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={[styles.submitBtn, !selected && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={!selected || loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Mark Life Event</Text>}
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20, lineHeight: 20 },
  eventOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 16, marginBottom: 10,
  },
  eventOptionSelected: { borderColor: '#1C3D5A', backgroundColor: '#EEEFF2' },
  eventIcon: { fontSize: 28 },
  eventText: { flex: 1 },
  eventLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  eventLabelSelected: { color: '#1C3D5A' },
  eventDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  check: { fontSize: 18, color: '#1C3D5A', fontWeight: '700' },
  noteLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  noteInput: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12,
    padding: 14, fontSize: 14, color: '#111827', textAlignVertical: 'top', minHeight: 100,
  },
  submitBtn: {
    marginTop: 20, backgroundColor: '#1C3D5A', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#d1d5db' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
