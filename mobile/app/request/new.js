import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { submitPerkRequest } from '../../lib/api';

export default function RequestPerkScreen() {
  const router = useRouter();
  const [perkName, setPerkName] = useState('');
  const [description, setDescription] = useState('');
  const [credits, setCredits] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!perkName || !description || !credits || !reason) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await submitPerkRequest({
        perk_name: perkName,
        perk_description: description,
        estimated_credits: parseFloat(credits),
        reason,
      });
      Alert.alert('Request Submitted', 'Your HR manager will review your request shortly.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not submit request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.subtitle}>
        Can't find what you need in the catalog? Request it here and HR will review your request.
      </Text>

      <Text style={styles.label}>Perk Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Spotify Premium"
        placeholderTextColor="#9ca3af"
        value={perkName}
        onChangeText={setPerkName}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Describe the perk and what it includes..."
        placeholderTextColor="#9ca3af"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Estimated Credits</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 80"
        placeholderTextColor="#9ca3af"
        value={credits}
        onChangeText={setCredits}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Why do you want this perk?</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Explain why this would benefit you..."
        placeholderTextColor="#9ca3af"
        value={reason}
        onChangeText={setReason}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Request</Text>}
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15,
    color: '#111827', backgroundColor: '#f9fafb', marginBottom: 16,
  },
  multiline: { textAlignVertical: 'top', minHeight: 90 },
  submitBtn: { backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
