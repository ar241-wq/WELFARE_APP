import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, TextInput, SafeAreaView, StatusBar, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getConversations, searchUsers, getMe, getRedemptions } from '../../lib/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function Avatar({ url, name, size = 52 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' }}>
      {url
        ? <Image source={{ uri: resolveUrl(url) }} style={{ width: size, height: size }} />
        : <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: '#6366f1' }}>{(name || '?')[0]}</Text>
      }
    </View>
  );
}

function WellnessGate() {
  const router = useRouter();
  return (
    <View style={styles.gate}>
      <View style={styles.gateCard}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>💬</Text>
        <Text style={styles.gateTitle}>Wellness Chat</Text>
        <Text style={styles.gateSub}>
          Redeem a perk to unlock private messaging with your wellness community — colleagues who share your interests.
        </Text>
        <TouchableOpacity style={styles.gateBtn} onPress={() => router.push('/(tabs)/catalog')}>
          <Text style={styles.gateBtnTxt}>Browse Perks</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasAccess, setHasAccess] = useState(null);

  const load = useCallback(async () => {
    try {
      const [meData, convos, redemptions] = await Promise.all([getMe(), getConversations(), getRedemptions()]);
      setMe(meData);
      setConversations(convos);
      const list = Array.isArray(redemptions) ? redemptions : redemptions?.results || [];
      setHasAccess(list.length > 0);
    } catch (_) {
      setHasAccess(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try { setSearchResults(await searchUsers(query)); } catch (_) {}
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const openChat = (userId, userName, userAvatar) => {
    router.push({ pathname: '/chat/[userId]', params: { userId, userName, userAvatar: userAvatar || '' } });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>;
  if (hasAccess === false) return <WellnessGate />;

  const showSearch = query.trim().length > 0;

  const renderConvo = ({ item }) => (
    <TouchableOpacity style={styles.row} onPress={() => openChat(item.user_id, item.user_name, item.user_avatar)} activeOpacity={0.7}>
      <View style={{ position: 'relative' }}>
        <Avatar url={item.user_avatar} name={item.user_name} />
        {item.unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>{item.unread > 9 ? '9+' : item.unread}</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={styles.rowMeta}>
          <Text style={[styles.rowName, item.unread > 0 && { fontWeight: '800' }]}>{item.user_name}</Text>
          <Text style={styles.rowTime}>{timeAgo(item.last_time)}</Text>
        </View>
        <Text style={[styles.rowPreview, item.unread > 0 && { color: '#111', fontWeight: '600' }]} numberOfLines={1}>
          {item.last_message || 'Say hi 👋'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderUser = ({ item }) => (
    <TouchableOpacity style={styles.row} onPress={() => openChat(item.id, item.full_name, item.avatar)} activeOpacity={0.7}>
      <Avatar url={item.avatar} name={item.full_name} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.rowName}>{item.full_name}</Text>
        <Text style={styles.rowPreview}>Tap to start chatting</Text>
      </View>
      <View style={styles.startBtn}>
        <Text style={styles.startBtnTxt}>Chat</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Messages</Text>
          {me && <Text style={styles.headerSub}>{me.full_name}</Text>}
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={{ fontSize: 15, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search colleagues…"
            placeholderTextColor="#b0b0b0"
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={{ color: '#b0b0b0', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showSearch ? (
        <FlatList
          data={searchResults}
          keyExtractor={i => String(i.id)}
          renderItem={renderUser}
          contentContainerStyle={{ paddingTop: 8 }}
          ListEmptyComponent={!searching
            ? <View style={styles.empty}><Text style={styles.emptyTxt}>No colleagues found</Text></View>
            : <ActivityIndicator style={{ marginTop: 24 }} color="#6366f1" />
          }
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={i => String(i.user_id)}
          renderItem={renderConvo}
          contentContainerStyle={{ paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>💬</Text>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyTxt}>Search for a colleague to start a conversation</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: '#a3a3a3', marginTop: 1 },
  searchRow: { paddingHorizontal: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6',
    borderRadius: 99, paddingHorizontal: 16, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111' },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f3f4f6',
  },
  badge: {
    position: 'absolute', right: -2, top: -2, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff', paddingHorizontal: 3,
  },
  badgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
  rowMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName: { fontSize: 15, fontWeight: '700', color: '#111' },
  rowTime: { fontSize: 12, color: '#b0b0b0' },
  rowPreview: { fontSize: 13, color: '#a3a3a3', marginTop: 2 },
  startBtn: { backgroundColor: '#eef2ff', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99 },
  startBtnTxt: { color: '#6366f1', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 56, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 6 },
  emptyTxt: { fontSize: 14, color: '#a3a3a3', textAlign: 'center' },
  gate: { flex: 1, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center', padding: 24 },
  gateCard: {
    backgroundColor: '#fff', borderRadius: 28, padding: 32, alignItems: 'center',
    shadowColor: '#6366f1', shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 6, width: '100%',
  },
  gateTitle: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 10 },
  gateSub: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  gateBtn: { backgroundColor: '#6366f1', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 99 },
  gateBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
