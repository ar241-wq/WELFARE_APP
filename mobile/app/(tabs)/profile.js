import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Image, Modal, Platform, Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Cake, Heart, ClipboardList, Ticket, ChevronRight, Copy, LogOut } from 'lucide-react-native';
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
      const month = String(selectedMonth + 1).padStart(2, '0');
      const day = String(selectedDay).padStart(2, '0');
      const updated = await updateProfile({ birthday: `1900-${month}-${day}` });
      signIn(updated);
      setShowBirthdayPicker(false);
      Alert.alert('Saved', 'Your birthday has been set. Your colleagues will be notified on the day!');
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
    { icon: <Cake size={18} color="#5B5E66" strokeWidth={1.75} />, label: birthdayLabel, onPress: () => setShowBirthdayPicker(true), highlight: !user?.birthday },
    { icon: <Heart size={18} color="#5B5E66" strokeWidth={1.75} />, label: 'Life Moments', onPress: () => router.push('/life-moments') },
    { icon: <ClipboardList size={18} color="#5B5E66" strokeWidth={1.75} />, label: 'My Perk Requests', onPress: () => router.push('/request/new') },
    { icon: <Ticket size={18} color="#5B5E66" strokeWidth={1.75} />, label: 'My Redemptions', onPress: () => router.push('/redemptions') },
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
                Alert.alert('Copied', 'Referral code copied to clipboard. Share it to earn 100 credits per signup!');
              }}
            >
              <View style={styles.referralTop}>
                <Text style={styles.referralLabel}>Referral code</Text>
                <Copy size={13} color="#5B5E66" strokeWidth={1.75} />
              </View>
              <Text style={styles.referralCode}>{user.referral_code}</Text>
              <Text style={styles.referralHint}>Earn 100 credits per signup</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={[styles.menuItem, i === menuItems.length - 1 && { borderBottomWidth: 0 }]} onPress={item.onPress}>
              <View style={styles.menuIconWrap}>{item.icon}</View>
              <Text style={[styles.menuLabel, item.highlight && styles.menuLabelHighlight]}>{item.label}</Text>
              <ChevronRight size={16} color="#D4D6DC" strokeWidth={1.75} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={16} color="#B42318" strokeWidth={1.75} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Birthday Picker Modal */}
      <Modal visible={showBirthdayPicker} transparent animationType="slide" onRequestClose={() => setShowBirthdayPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Your Birthday</Text>
            <Text style={styles.modalSub}>We'll surprise your colleagues on your special day!</Text>

            <View style={styles.pickerRow}>
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
              <Text style={styles.saveBtnTxt}>{saving ? 'Saving...' : `Save — ${MONTHS[selectedMonth]} ${selectedDay}`}</Text>
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
  container: { flex: 1, backgroundColor: '#F7F7F8' },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#EEEFF2' },
  title: { fontSize: 22, fontWeight: '700', color: '#0A0A0B', letterSpacing: -0.3 },

  avatarSection: { alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 28, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#EEEFF2' },
  avatarImage: { width: 72, height: 72, borderRadius: 36, marginBottom: 12 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#1C3D5A', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  name: { fontSize: 18, fontWeight: '700', color: '#0A0A0B', letterSpacing: -0.2 },
  email: { fontSize: 13, color: '#8E9099', marginTop: 3 },
  badge: { marginTop: 8, backgroundColor: '#EEEFF2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, color: '#5B5E66', fontWeight: '600' },

  referralBox: {
    marginTop: 16, backgroundColor: '#F7F7F8', borderWidth: 1, borderColor: '#EEEFF2',
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', width: '80%',
  },
  referralTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  referralLabel: { fontSize: 11, color: '#8E9099', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  referralCode: { fontSize: 22, fontWeight: '700', color: '#0A0A0B', letterSpacing: 3, marginVertical: 2 },
  referralHint: { fontSize: 11, color: '#8E9099', fontWeight: '500' },

  menu: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#EEEFF2', marginBottom: 8 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: '#EEEFF2', gap: 12,
  },
  menuIconWrap: { width: 32, alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#0A0A0B' },
  menuLabelHighlight: { color: '#1C3D5A', fontWeight: '600' },

  logoutBtn: {
    margin: 16, marginTop: 8, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#FEE2E0', backgroundColor: '#FFFFFF',
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  logoutText: { color: '#B42318', fontSize: 14, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,10,11,0.48)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0A0A0B', marginBottom: 4, letterSpacing: -0.2 },
  modalSub: { fontSize: 13, color: '#8E9099', marginBottom: 24 },

  pickerRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  pickerCol: { flex: 1 },
  pickerLabel: { fontSize: 11, fontWeight: '600', color: '#8E9099', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  pickerScroll: { height: 200, backgroundColor: '#F7F7F8', borderRadius: 12 },
  pickerItem: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginHorizontal: 4, marginVertical: 2 },
  pickerItemSelected: { backgroundColor: '#E8EDF2' },
  pickerItemTxt: { fontSize: 15, color: '#8E9099', fontWeight: '500', textAlign: 'center' },
  pickerItemTxtSelected: { color: '#1C3D5A', fontWeight: '700' },

  saveBtn: {
    backgroundColor: '#1C3D5A', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginBottom: 12,
  },
  saveBtnTxt: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelTxt: { color: '#8E9099', fontSize: 14, fontWeight: '500' },
});
