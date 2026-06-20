import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../lib/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
function resolveUrl(src) {
  if (!src) return null;
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  return `${API_URL}${src}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await logout();
          signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  const initial = user?.full_name?.[0]?.toUpperCase() || '?';

  const menuItems = [
    { icon: '💝', label: 'Life Moments', onPress: () => router.push('/life-moments') },
    { icon: '📋', label: 'My Perk Requests', onPress: () => router.push('/request/new') },
    { icon: '🎫', label: 'My Redemptions', onPress: () => router.push('/wallet') },
  ];

  return (
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
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem} onPress={item.onPress}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
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
  badge: {
    marginTop: 8, backgroundColor: '#eef2ff',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  badgeText: { fontSize: 12, color: '#6366f1', fontWeight: '600' },
  menu: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  menuArrow: { fontSize: 20, color: '#9ca3af' },
  logoutBtn: {
    margin: 16, marginTop: 24, padding: 16, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#fee2e2', backgroundColor: '#fff', alignItems: 'center',
  },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: '700' },
});
