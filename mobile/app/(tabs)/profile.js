import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Image, Modal, Platform, Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { logout, updateProfile } from '../../lib/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
function resolveUrl(src) {
  if (!src) return null;
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  return `${API_URL}${src}`;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signIn } = useAuth();
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    user?.birthday ? new Date(user.birthday).getMonth() : 0
  );
  const [selectedDay, setSelectedDay] = useState(
    user?.birthday ? new Date(user.birthday).getDate() : 1
  );
  const [saving, setSaving] = useState(false);

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await logout();
          signIn(null);
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  async function saveBirthday() {
    setSaving(true);
    try {
      // Store as YYYY-MM-DD with year 1900 (year irrelevant, we only match month+day)
      const month = String(selectedMonth + 1).padStart(2, '0');
      const day = String(selectedDay).padStart(2, '0');
      const updated = await updateProfile({ birthday: `1900-${month}-${day}` });
      signIn(updated);
      setShowBirthdayPicker(false);
      Alert.alert('Saved! 🎂', 'Your birthday has been set. Your colleagues will be notified on the day!');
    } catch (_) {
      Alert.alert('Error', 'Could not save birthday.');
    }
    setSaving(false);
  }

  const birthdayLabel = user?.birthday
    ? `${MONTHS[new Date(user.birthday).getMonth()]} ${new Date(user.birthday).getDate()}`
    : 'Set your birthday';

  const initial = user?.full_name?.[0]?.toUpperCase() || '?';

  const menuItems = [
    { icon: '🎂', label: birthdayLabel, onPress: () => setShowBirthdayPicker(true), highlight: !user?.birthday },
    { icon: '💝', label: 'Life Moments', onPress: () => router.push('/life-moments') },
    { icon: '📋', label: 'My Perk Requests', onPress: () => router.push('/request/new') },
    { icon: '🎫', label: 'My Redemptions & Reviews', onPress: () => router.push('/redemptions') },
  ];

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.avatarSection}>
          {resolveUrl(user?.avatar) ? (
            <Image source={{ uri: resolveUrl(user.avatar) }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Employee</Text>
          </View>
          {user?.referral_code && (
            <TouchableOpacity
              style={styles.referralBox}
              onPress={() => {
                Clipboard.setString(user.referral_code);
                Alert.alert('Copied!', 'Referral code copied to clipboard. Share it to earn 100 credits per signup!');
              }}
            >
              <Text style={styles.referralLabel}>Your referral code</Text>
              <Text style={styles.referralCode}>{user.referral_code}</Text>
              <Text style={styles.referralHint}>Tap to copy · Earn 100 credits per signup</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={item.onPress}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={[styles.menuLabel, item.highlight && styles.menuLabelHighlight]}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Birthday Picker Modal */}
      <Modal visible={showBirthdayPicker} transparent animationType="slide" onRequestClose={() => setShowBirthdayPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🎂 Your Birthday</Text>
            <Text style={styles.modalSub}>We'll surprise your colleagues on your special day!</Text>

            <View style={styles.pickerRow}>
              {/* Month */}
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {MONTHS.map((m, i) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.pickerItem, selectedMonth === i && styles.pickerItemSelected]}
                      onPress={() => setSelectedMonth(i)}
                    >
                      <Text style={[styles.pickerItemTxt, selectedMonth === i && styles.pickerItemTxtSelected]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Day */}
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {DAYS.map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.pickerItem, selectedDay === d && styles.pickerItemSelected]}
                      onPress={() => setSelectedDay(d)}
                    >
                      <Text style={[styles.pickerItemTxt, selectedDay === d && styles.pickerItemTxtSelected]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveBirthday} disabled={saving}>
              <Text style={styles.saveBtnTxt}>{saving ? 'Saving…' : `Save — ${MONTHS[selectedMonth]} ${selectedDay}`}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBirthdayPicker(false)}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  avatarSection: { alignItems: 'center', backgroundColor: '#fff', paddingVertical: 32, marginBottom: 16 },
  avatarImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  email: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  badge: { marginTop: 8, backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, color: '#6366f1', fontWeight: '600' },
  referralBox: {
    marginTop: 16, backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#86efac',
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', width: '80%',
  },
  referralLabel: { fontSize: 11, color: '#16a34a', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  referralCode: { fontSize: 28, fontWeight: '900', color: '#15803d', letterSpacing: 4, marginVertical: 4 },
  referralHint: { fontSize: 11, color: '#4ade80', fontWeight: '500' },
  menu: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  menuLabelHighlight: { color: '#f59e0b' },
  menuArrow: { fontSize: 20, color: '#9ca3af' },
  logoutBtn: {
    margin: 16, marginTop: 24, padding: 16, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#fee2e2', backgroundColor: '#fff', alignItems: 'center',
  },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#6b7280', marginBottom: 24 },

  pickerRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  pickerCol: { flex: 1 },
  pickerLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  pickerScroll: { height: 200, backgroundColor: '#f9fafb', borderRadius: 14 },
  pickerItem: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginHorizontal: 4, marginVertical: 2 },
  pickerItemSelected: { backgroundColor: '#fef3c7' },
  pickerItemTxt: { fontSize: 15, color: '#6b7280', fontWeight: '500', textAlign: 'center' },
  pickerItemTxtSelected: { color: '#d97706', fontWeight: '800' },

  saveBtn: {
    backgroundColor: '#f59e0b', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginBottom: 12,
  },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelTxt: { color: '#9ca3af', fontSize: 15, fontWeight: '600' },
});
