import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image, StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getGroupMessages, sendGroupMessage, getMe } from '../../../lib/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function GroupChatThread() {
  const { groupId, groupName, groupIcon } = useLocalSearchParams();
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const msgs = await getGroupMessages(groupId);
      setMessages(msgs);
    } catch (_) {}
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    getMe().then(setMe).catch(() => {});
    load();
    pollRef.current = setInterval(load, 3000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    setSending(true);
    try {
      const msg = await sendGroupMessage(groupId, t);
      setMessages(prev => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (_) {}
    setSending(false);
  };

  const renderMsg = ({ item, index }) => {
    const isMine = me && item.sender_id === me.id;
    const prevItem = messages[index - 1];
    const showName = !isMine && (!prevItem || prevItem.sender_id !== item.sender_id);

    return (
      <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
        {!isMine && (
          <View style={[styles.msgAvatar, !showName && { opacity: 0 }]}>
            {item.sender_avatar ? (
              <Image source={{ uri: resolveUrl(item.sender_avatar) }} style={styles.msgAvatarImg} />
            ) : (
              <Text style={styles.msgAvatarLetter}>{(item.sender_name || '?')[0]}</Text>
            )}
          </View>
        )}
        <View style={{ maxWidth: '72%' }}>
          {showName && <Text style={styles.msgSenderName}>{item.sender_name}</Text>}
          <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.text}</Text>
          </View>
          <Text style={[styles.msgTime, isMine && { textAlign: 'right' }]}>{formatTime(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerIcon}>
          <Text style={{ fontSize: 22 }}>{groupIcon || '💬'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>{groupName}</Text>
          <Text style={styles.headerSub}>Community Chat</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#1C3D5A" />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => String(m.id)}
            renderItem={renderMsg}
            contentContainerStyle={styles.msgList}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={{ fontSize: 40 }}>{groupIcon || '💬'}</Text>
                <Text style={styles.emptyChatTitle}>{groupName} Community</Text>
                <Text style={styles.emptyChatText}>Be the first to say something!</Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Message the community…"
            placeholderTextColor="#9ca3af"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.sendIcon}>↑</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F8' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f0f0f0', gap: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: '#1C3D5A', lineHeight: 26, marginLeft: -2 },
  headerIcon: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#EEEFF2',
    alignItems: 'center', justifyContent: 'center',
  },
  headerName: { fontSize: 16, fontWeight: '800', color: '#111' },
  headerSub: { fontSize: 11, color: '#a3a3a3', fontWeight: '600' },

  msgList: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6, gap: 8 },
  msgRowMine: { flexDirection: 'row-reverse' },
  msgAvatar: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#EEEFF2',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  msgAvatarImg: { width: 30, height: 30 },
  msgAvatarLetter: { fontSize: 12, fontWeight: '800', color: '#1C3D5A' },
  msgSenderName: { fontSize: 11, color: '#b0b0b0', marginBottom: 3, marginLeft: 2 },
  bubble: {
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  bubbleMine: { backgroundColor: '#1C3D5A', borderBottomRightRadius: 6 },
  bubbleTheirs: { backgroundColor: '#fff', borderBottomLeftRadius: 6, borderWidth: 1, borderColor: '#f0f0f0' },
  bubbleText: { fontSize: 15, color: '#111', lineHeight: 21 },
  bubbleTextMine: { color: '#fff' },
  msgTime: { fontSize: 10, color: '#ccc', marginTop: 2, marginHorizontal: 4 },

  emptyChat: { alignItems: 'center', paddingTop: 80 },
  emptyChatTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginTop: 12, marginBottom: 4 },
  emptyChatText: { fontSize: 14, color: '#b0b0b0' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#f0f0f0', gap: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 99,
    paddingHorizontal: 18, paddingVertical: 11, fontSize: 15, color: '#111',
    maxHeight: 110,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#1C3D5A',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  sendBtnDisabled: { backgroundColor: '#D4D6DC', shadowOpacity: 0 },
  sendIcon: { color: '#fff', fontSize: 20, fontWeight: '800' },
});
