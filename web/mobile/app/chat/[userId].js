import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image, StatusBar, Modal, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getMessages, sendMessage, getMe, giftCredits, getWallet } from '../../lib/api';

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

const GIFT_AMOUNTS = [25, 50, 100, 200];

export default function ChatThread() {
  const { userId, userName, userAvatar } = useLocalSearchParams();
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const pollRef = useRef(null);

  // Gift modal state
  const [showGift, setShowGift] = useState(false);
  const [giftAmount, setGiftAmount] = useState(50);
  const [giftNote, setGiftNote] = useState('');
  const [gifting, setGifting] = useState(false);
  const [myBalance, setMyBalance] = useState(null);

  const load = useCallback(async () => {
    try {
      const msgs = await getMessages(userId);
      setMessages(msgs);
    } catch (_) {}
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    getMe().then(setMe).catch(() => {});
    getWallet().then(w => setMyBalance(Number(w.balance))).catch(() => {});
    load();
    // Poll every 3s for new messages
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
      const msg = await sendMessage(userId, t);
      setMessages(prev => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (_) {}
    setSending(false);
  };

  const openGiftModal = () => {
    setGiftAmount(50);
    setGiftNote('');
    setShowGift(true);
  };

  const handleGift = async () => {
    if (gifting) return;
    setGifting(true);
    try {
      const result = await giftCredits(userId, giftAmount, giftNote.trim());
      // Update local balance
      setMyBalance(Number(result.new_balance));
      setShowGift(false);
      Alert.alert('Gifted!', `${giftAmount} credits sent to ${result.recipient_name}.`);
      // Auto-send a DM about the gift
      const autoMsg = `🎁 I just gifted you ${giftAmount} credits!${giftNote.trim() ? ' ' + giftNote.trim() : ''}`;
      try {
        const msg = await sendMessage(userId, autoMsg);
        setMessages(prev => [...prev, msg]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      } catch (_) {}
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to gift credits.');
    }
    setGifting(false);
  };

  const renderMsg = ({ item, index }) => {
    const isMine = me && item.sender_id === me.id;
    const prevItem = messages[index - 1];
    const showName = !isMine && (!prevItem || prevItem.sender_id !== item.sender_id);

    return (
      <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
        {!isMine && (
          <View style={[styles.msgAvatar, !showName && { opacity: 0 }]}>
            {userAvatar ? (
              <Image source={{ uri: resolveUrl(userAvatar) }} style={styles.msgAvatarImg} />
            ) : (
              <Text style={styles.msgAvatarLetter}>{(userName || '?')[0]}</Text>
            )}
          </View>
        )}
        <View style={{ maxWidth: '72%' }}>
          {showName && <Text style={styles.msgSenderName}>{item.sender_name}</Text>}
          {!!item.reply_context && (
            <View style={[styles.replyContext, isMine && styles.replyContextMine]}>
              <Text style={styles.replyContextTxt}>{item.reply_context}</Text>
            </View>
          )}
          <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.text}</Text>
          </View>
          <Text style={[styles.msgTime, isMine && { textAlign: 'right' }]}>{formatTime(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  const giftDisabled = gifting || myBalance === null || myBalance < giftAmount;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          {userAvatar ? (
            <Image source={{ uri: resolveUrl(userAvatar) }} style={styles.headerAvatarImg} />
          ) : (
            <Text style={styles.headerAvatarLetter}>{(userName || '?')[0]}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>{userName}</Text>
          <Text style={styles.headerStatus}>Online</Text>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#6366f1" />
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
                <Text style={{ fontSize: 40 }}>👋</Text>
                <Text style={styles.emptyChatText}>Say hi to {userName?.split(' ')[0]}!</Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={`Message ${userName?.split(' ')[0] || ''}...`}
            placeholderTextColor="#9ca3af"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity style={styles.giftBtn} onPress={openGiftModal}>
            <Text style={styles.giftBtnIcon}>🎁</Text>
          </TouchableOpacity>
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

      {/* Gift Modal */}
      <Modal
        visible={showGift}
        transparent
        animationType="slide"
        onRequestClose={() => !gifting && setShowGift(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Gift Credits to {userName}</Text>

            {myBalance !== null && (
              <Text style={styles.balanceText}>Your balance: {myBalance} credits</Text>
            )}

            <Text style={styles.modalSectionLabel}>Choose amount</Text>
            <View style={styles.chipsRow}>
              {GIFT_AMOUNTS.map(amt => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.chip, giftAmount === amt && styles.chipSelected]}
                  onPress={() => setGiftAmount(amt)}
                >
                  <Text style={[styles.chipText, giftAmount === amt && styles.chipTextSelected]}>
                    {amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalSectionLabel}>Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a note…"
              placeholderTextColor="#9ca3af"
              value={giftNote}
              onChangeText={setGiftNote}
              maxLength={200}
            />

            <TouchableOpacity
              style={[styles.giftSubmitBtn, giftDisabled && styles.giftSubmitBtnDisabled]}
              onPress={handleGift}
              disabled={giftDisabled}
            >
              {gifting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.giftSubmitText}>Gift {giftAmount} Credits 🎁</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => !gifting && setShowGift(false)}
              disabled={gifting}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fafafa' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f0f0f0', gap: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: '#6366f1', lineHeight: 26, marginLeft: -2 },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#eef2ff',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 2, borderColor: '#e0e7ff',
  },
  headerAvatarImg: { width: 42, height: 42 },
  headerAvatarLetter: { fontSize: 17, fontWeight: '800', color: '#6366f1' },
  headerName: { fontSize: 16, fontWeight: '800', color: '#111' },
  headerStatus: { fontSize: 11, color: '#22c55e', fontWeight: '700' },

  msgList: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6, gap: 8 },
  msgRowMine: { flexDirection: 'row-reverse' },
  msgAvatar: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#eef2ff',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  msgAvatarImg: { width: 30, height: 30 },
  msgAvatarLetter: { fontSize: 12, fontWeight: '800', color: '#6366f1' },
  msgSenderName: { fontSize: 11, color: '#b0b0b0', marginBottom: 3, marginLeft: 2 },
  replyContext: {
    alignSelf: 'flex-start', backgroundColor: '#f3f4f6', borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 4,
    flexDirection: 'row', alignItems: 'center',
  },
  replyContextMine: { alignSelf: 'flex-end', backgroundColor: '#e0e7ff' },
  replyContextTxt: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  bubble: {
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  bubbleMine: { backgroundColor: '#6366f1', borderBottomRightRadius: 6 },
  bubbleTheirs: { backgroundColor: '#fff', borderBottomLeftRadius: 6, borderWidth: 1, borderColor: '#f0f0f0' },
  bubbleText: { fontSize: 15, color: '#111', lineHeight: 21 },
  bubbleTextMine: { color: '#fff' },
  msgTime: { fontSize: 10, color: '#ccc', marginTop: 2, marginHorizontal: 4 },

  emptyChat: { alignItems: 'center', paddingTop: 80 },
  emptyChatText: { fontSize: 16, color: '#b0b0b0', marginTop: 10 },

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
  giftBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#6366f1',
    alignItems: 'center', justifyContent: 'center',
  },
  giftBtnIcon: { fontSize: 18 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366f1',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6366f1', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  sendBtnDisabled: { backgroundColor: '#c7d2fe', shadowOpacity: 0 },
  sendIcon: { color: '#fff', fontSize: 20, fontWeight: '800' },

  // Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 6 },
  balanceText: { fontSize: 13, color: '#6366f1', fontWeight: '700', marginBottom: 20 },
  modalSectionLabel: { fontSize: 12, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  chipsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  chip: {
    flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: '#f3f4f6',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  chipSelected: { backgroundColor: '#eef2ff', borderColor: '#6366f1' },
  chipText: { fontSize: 15, fontWeight: '700', color: '#6b7280' },
  chipTextSelected: { color: '#6366f1' },
  noteInput: {
    backgroundColor: '#f3f4f6', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: '#111',
    marginBottom: 24,
  },
  giftSubmitBtn: {
    backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  giftSubmitBtnDisabled: { backgroundColor: '#c7d2fe', shadowOpacity: 0 },
  giftSubmitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { fontSize: 15, color: '#9ca3af', fontWeight: '600' },
});
