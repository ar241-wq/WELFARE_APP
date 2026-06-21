import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, StyleSheet,
  Image, Modal, SafeAreaView, ActivityIndicator,
  Animated, Dimensions, StatusBar, RefreshControl, ScrollView,
  KeyboardAvoidingView, Platform, Alert, FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, Eye, Lock } from 'lucide-react-native';
import {
  getCommunityCategories, getCommunityPosts, getMyInstants,
  createPost, likePost, deletePost, markInstantViewed, getMe, sendMessage,
} from '../../lib/api';

const { width: W, height: H } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const CARD_W = W - 48;
const CARD_H = CARD_W * 1.22;

function ru(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}
function ago(s) {
  const d = (Date.now() - new Date(s).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  return `${Math.floor(d / 3600)}h ago`;
}
function tleft(s) {
  if (!s || s <= 0) return null;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

// ─── Stack of instant cards ───────────────────────────────────────────────────
function InstantStack({ posts, onOpen }) {
  // Show max 3 cards, stacked with offset
  const visible = posts.slice(0, 3);

  if (posts.length === 0) return null;

  return (
    <View style={st.outer}>
      {/* Shadow cards behind (rendered first = bottom of stack) */}
      {visible.length >= 3 && (
        <View style={[st.card, st.cardBack2]} />
      )}
      {visible.length >= 2 && (
        <View style={[st.card, st.cardBack1]} />
      )}

      {/* Top card — tappable */}
      <TouchableOpacity
        style={[st.card, st.cardTop]}
        onPress={() => onOpen(posts[0])}
        activeOpacity={0.95}
      >
        {/* Blurred photo — hidden until tapped */}
        {posts[0].image_url ? (
          <Image
            source={{ uri: ru(posts[0].image_url) }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            blurRadius={22}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#D4D6DC' }]} />
        )}

        {/* Dark overlay */}
        <View style={st.overlay} />

        {/* Centre tap hint */}
        <View style={st.tapHintWrap}>
          <View style={st.eyeCircle}>
            <Eye size={28} color="#0A0A0B" strokeWidth={1.75} />
          </View>
          <Text style={st.tapLabel}>Tap to open</Text>
          <Text style={st.tapSub}>Disappears once you see it</Text>
        </View>

        {/* Author + expiry at bottom */}
        <View style={st.cardFooter}>
          <View style={st.footerAvatar}>
            {posts[0].author_avatar
              ? <Image source={{ uri: ru(posts[0].author_avatar) }} style={{ width: '100%', height: '100%' }} />
              : <Text style={{ color: '#1C3D5A', fontWeight: '800', fontSize: 15 }}>{(posts[0].author_name || '?')[0]}</Text>
            }
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={st.footerName}>{posts[0].author_name}</Text>
            <Text style={st.footerMeta}>{posts[0].category_icon} {posts[0].category_name}</Text>
          </View>
          {tleft(posts[0].seconds_left) && (
            <View style={st.expiryBadge}>
              <Text style={st.expiryTxt}>{tleft(posts[0].seconds_left)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Count badge */}
      {posts.length > 1 && (
        <View style={st.countBadge}>
          <Text style={st.countTxt}>{posts.length}</Text>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  outer: { alignItems: 'center', marginTop: 16, marginBottom: 32 },
  card: {
    width: CARD_W, height: CARD_H, borderRadius: 28, overflow: 'hidden',
    backgroundColor: '#e0e7ff',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  cardTop: { zIndex: 3 },
  cardBack1: {
    position: 'absolute', zIndex: 2,
    transform: [{ translateY: 14 }, { scaleX: 0.93 }],
    backgroundColor: '#D4D6DC', opacity: 0.75,
  },
  cardBack2: {
    position: 'absolute', zIndex: 1,
    transform: [{ translateY: 26 }, { scaleX: 0.86 }],
    backgroundColor: '#EEEFF2', opacity: 0.5,
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)' },
  tapHintWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  eyeCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16,
  },
  tapLabel: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 6 },
  tapSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
  cardFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', padding: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  footerAvatar: {
    width: 38, height: 38, borderRadius: 19, overflow: 'hidden',
    backgroundColor: '#EEEFF2', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  footerName: { color: '#fff', fontWeight: '800', fontSize: 14 },
  footerMeta: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 1 },
  expiryBadge: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  expiryTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  countBadge: {
    marginTop: 20, width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1C3D5A', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1C3D5A', shadowOpacity: 0.4, shadowRadius: 8,
  },
  countTxt: { color: '#fff', fontWeight: '900', fontSize: 14 },
});

// ─── Full-screen instant viewer ───────────────────────────────────────────────
const REACTIONS = ['❤️', '🔥', '😂', '😮', '👏', '💪'];

function InstantViewer({ post, onClose, me }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flyAnim = useRef(new Animated.Value(0)).current;
  const [reacted, setReacted] = useState(null);
  const [replyMode, setReplyMode] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    markInstantViewed(post.id).catch(() => {});
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(flyAnim, { toValue: -H * 0.4, duration: 280, useNativeDriver: true }),
    ]).start(onClose);
  };

  const instantContext = `📸 Instant · ${post.category_icon || ''} ${post.category_name || ''}`.trim();

  const react = async (emoji) => {
    setReacted(emoji);
    try {
      if (emoji === '❤️') {
        await likePost(post.id);
      } else {
        await sendMessage(post.author_id, emoji, instantContext);
      }
      setSent(true);
    } catch (e) {
      Alert.alert('Could not send', e.message || 'Check your connection and try again.');
      setReacted(null);
      return;
    }
    setTimeout(dismiss, 700);
  };

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await sendMessage(post.author_id, text, instantContext);
      setSent(true);
      setTimeout(dismiss, 600);
    } catch (e) {
      Alert.alert('Could not send', e.message || 'Check your connection and try again.');
      setSending(false);
    }
  };

  const isOwn = me && post.author_id === me.id;

  return (
    <Animated.View style={[iv.root, { opacity: fadeAnim, transform: [{ translateY: flyAnim }] }]}>
      <StatusBar hidden />

      {/* Background photo */}
      {post.image_url
        ? <Image source={{ uri: ru(post.image_url) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        : <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0A0A0B', alignItems: 'center', justifyContent: 'center' }]}>
            <Camera size={60} color="rgba(255,255,255,0.2)" strokeWidth={1.25} />
          </View>
      }


      {/* Reaction pop (non-interactive) */}
      {reacted && (
        <View style={iv.reactedPop} pointerEvents="none">
          <Text style={{ fontSize: 72 }}>{reacted}</Text>
        </View>
      )}

      {/* Caption (non-interactive) */}
      {post.caption ? (
        <View style={iv.caption} pointerEvents="none">
          <Text style={iv.captionTxt}>{post.caption}</Text>
        </View>
      ) : null}

      {/* Flex column: header | tap-to-close middle | bottom buttons */}
      <KeyboardAvoidingView style={iv.col} behavior={Platform.OS === 'ios' ? 'padding' : undefined} pointerEvents="box-none">
        {/* Header */}
        <SafeAreaView pointerEvents="box-none">
          <View style={iv.head}>
            <View style={iv.headAv}>
              {post.author_avatar
                ? <Image source={{ uri: ru(post.author_avatar) }} style={{ width: 40, height: 40 }} />
                : <Text style={{ color: '#1C3D5A', fontWeight: '800', fontSize: 17 }}>{(post.author_name || '?')[0]}</Text>
              }
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={iv.headName}>{post.author_name}</Text>
              <Text style={iv.headMeta}>{post.category_icon} {post.category_name} · {ago(post.created_at)}</Text>
            </View>
            {tleft(post.seconds_left) && (
              <View style={iv.expiryPill}>
                <Text style={iv.expiryTxt}>{tleft(post.seconds_left)} left</Text>
              </View>
            )}
            <TouchableOpacity onPress={dismiss} style={iv.closeBtn} hitSlop={{ top: 16, right: 16, bottom: 16, left: 16 }}>
              <Text style={iv.closeX}>✕</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Middle: tap to close */}
        <TouchableOpacity style={{ flex: 1 }} onPress={dismiss} activeOpacity={1} />

        {/* Bottom buttons */}
        <SafeAreaView>
            <View style={iv.bottom}>
              {!isOwn && !replyMode && (
                <>
                  <TouchableOpacity
                    style={iv.replyBtn}
                    onPress={() => { setReplyMode(true); setTimeout(() => inputRef.current?.focus(), 50); }}
                    activeOpacity={0.85}
                  >
                    <Text style={iv.replyTxt}>Reply to {post.author_name?.split(' ')[0]}</Text>
                  </TouchableOpacity>
                  <View style={iv.reactRow}>
                    {REACTIONS.map(e => (
                      <TouchableOpacity key={e} style={[iv.reactBtn, reacted === e && iv.reactOn]} onPress={() => react(e)} activeOpacity={0.75}>
                        <Text style={{ fontSize: 24 }}>{e}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              {!isOwn && replyMode && (
                <View style={iv.replyInputRow}>
                  <TextInput
                    ref={inputRef}
                    style={iv.replyInput}
                    placeholder={`Reply to ${post.author_name?.split(' ')[0]}…`}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={replyText}
                    onChangeText={setReplyText}
                    autoFocus
                    returnKeyType="send"
                    onSubmitEditing={sendReply}
                    multiline={false}
                  />
                  <TouchableOpacity style={iv.sendBtn} onPress={sendReply} disabled={sending || !replyText.trim()}>
                    {sending
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={iv.sendTxt}>Send</Text>
                    }
                  </TouchableOpacity>
                </View>
              )}
              {isOwn && (
                <View style={{ alignItems: 'center', paddingBottom: 8 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Tap anywhere to close</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>

      {/* Sent confirmation overlay */}
      {sent && (
        <View style={iv.sentPop} pointerEvents="none">
          <Text style={iv.sentTxt}>Sent ✓</Text>
        </View>
      )}
    </Animated.View>
  );
}

const iv = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 999, backgroundColor: '#000' },
  col: { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 },
  headAv: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: '#EEEFF2', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)' },
  headName: { color: '#fff', fontWeight: '800', fontSize: 15 },
  headMeta: { color: 'rgba(255,255,255,0.58)', fontSize: 12, marginTop: 1 },
  expiryPill: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', marginRight: 8 },
  expiryTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  closeBtn: { padding: 4 },
  closeX: { color: 'rgba(255,255,255,0.7)', fontSize: 20, fontWeight: '700' },
  caption: { position: 'absolute', bottom: 260, left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.52)', borderRadius: 20, padding: 16 },
  captionTxt: { color: '#fff', fontSize: 16, lineHeight: 23 },
  reactedPop: { position: 'absolute', top: '33%', left: 0, right: 0, alignItems: 'center' },
  headerLayer: { position: 'absolute', top: 0, left: 0, right: 0 },
  bottomLayer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 16 : 24 },
  bottom: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 16 : 24 },
  replyBtn: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 99, paddingVertical: 15, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  replyTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  reactRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  reactBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  reactOn: { backgroundColor: 'rgba(99,102,241,0.65)', borderColor: '#1C3D5A' },
  sentPop: { position: 'absolute', top: '45%', left: 0, right: 0, alignItems: 'center' },
  sentTxt: { backgroundColor: 'rgba(99,102,241,0.85)', color: '#fff', fontWeight: '800', fontSize: 18, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 99 },
  replyInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  replyInput: { flex: 1, height: 46, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99, paddingHorizontal: 18, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  sendBtn: { height: 46, paddingHorizontal: 20, borderRadius: 99, backgroundColor: '#1C3D5A', alignItems: 'center', justifyContent: 'center' },
  sendTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

// ─── My instant row (sender preview) ─────────────────────────────────────────
function MyInstantRow({ myPosts, onAdd, onViewMine }) {
  return (
    <View style={mr.wrap}>
      <TouchableOpacity style={mr.addBtn} onPress={onAdd} activeOpacity={0.8}>
        {myPosts[0]?.image_url
          ? <Image source={{ uri: ru(myPosts[0].image_url) }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={2} />
          : null
        }
        <View style={[StyleSheet.absoluteFill, { backgroundColor: myPosts[0] ? 'rgba(0,0,0,0.35)' : 'transparent', borderRadius: 99 }]} />
        <Camera size={22} color="#FFFFFF" strokeWidth={1.75} />
      </TouchableOpacity>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={mr.title}>{myPosts.length > 0 ? `You sent ${myPosts.length} instant${myPosts.length > 1 ? 's' : ''}` : 'Share an instant'}</Text>
        <Text style={mr.sub}>Camera only · disappears once seen</Text>
      </View>
      {myPosts.length > 0 && (
        <TouchableOpacity style={mr.viewBtn} onPress={onViewMine}>
          <Text style={mr.viewBtnTxt}>View</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const mr = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 16, marginBottom: 4, backgroundColor: '#fff', borderRadius: 22, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  addBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1C3D5A', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  title: { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 3 },
  sub: { fontSize: 12, color: '#a3a3a3' },
  viewBtn: { backgroundColor: '#EEEFF2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99 },
  viewBtnTxt: { color: '#1C3D5A', fontWeight: '800', fontSize: 13 },
});

// ─── Snap creation modal ──────────────────────────────────────────────────────
function SnapModal({ photo, categories, onPost, onRetake, onClose }) {
  const [cat, setCat] = useState(categories[0]?.id || null);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);

  const submit = async () => {
    if (!cat) { Alert.alert('Pick a community'); return; }
    setPosting(true);
    await onPost(cat, caption.trim(), photo);
    setPosting(false);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" statusBarTranslucent>
      <View style={sm.root}>
        {photo && <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={sm.topBar}>
            <TouchableOpacity onPress={onClose}><Text style={sm.close}>✕</Text></TouchableOpacity>
            <Text style={sm.topTitle}>New Instant</Text>
            <TouchableOpacity style={sm.retakeBtn} onPress={onRetake}><Text style={sm.retakeTxt}>Retake</Text></TouchableOpacity>
          </View>
          <View style={{ flex: 1 }} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : undefined}>
            <View style={sm.panel}>
              <Text style={sm.label}>Community</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
                {categories.map(c => (
                  <TouchableOpacity key={c.id} style={[sm.chip, cat === c.id && sm.chipOn]} onPress={() => setCat(c.id)}>
                    <Text style={[sm.chipTxt, cat === c.id && sm.chipTxtOn]}>{c.icon} {c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={sm.row}>
                <TextInput style={sm.input} placeholder="Add a caption…" placeholderTextColor="rgba(255,255,255,0.4)" value={caption} onChangeText={setCaption} maxLength={160} />
                <TouchableOpacity style={sm.sendBtn} onPress={submit} disabled={posting}>
                  {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={sm.sendTxt}>Send</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
const sm = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  close: { fontSize: 22, color: '#fff', fontWeight: '700', padding: 4 },
  topTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  retakeBtn: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99 },
  retakeTxt: { color: '#fff', fontWeight: '600', fontSize: 13 },
  panel: { backgroundColor: 'rgba(8,6,22,0.85)', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 16, paddingTop: 22, paddingBottom: 36 },
  label: { color: 'rgba(255,255,255,0.5)', fontWeight: '800', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  chipOn: { backgroundColor: '#1C3D5A', borderColor: '#1C3D5A' },
  chipTxt: { color: 'rgba(255,255,255,0.65)', fontWeight: '600', fontSize: 13 },
  chipTxtOn: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, height: 46, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99, paddingHorizontal: 18, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  sendBtn: { height: 46, paddingHorizontal: 24, borderRadius: 99, backgroundColor: '#1C3D5A', alignItems: 'center', justifyContent: 'center' },
  sendTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

// ─── Wellness gate ────────────────────────────────────────────────────────────
function WellnessGate() {
  const router = useRouter();
  return (
    <SafeAreaView style={wg.root}>
      <View style={wg.card}>
        <View style={wg.icon}><Lock size={28} color="#1C3D5A" strokeWidth={1.75} /></View>
        <Text style={wg.title}>Wellness Instants</Text>
        <Text style={wg.sub}>Redeem a perk to unlock Instants — raw, unfiltered moments shared with colleagues who share your wellness interests. Disappears once seen.</Text>
        <TouchableOpacity style={wg.btn} onPress={() => router.push('/(tabs)/catalog')}>
          <Text style={wg.btnTxt}>Browse Perks</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
const wg = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F8', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, alignItems: 'center', width: '100%', shadowColor: '#0A0A0B', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4, borderWidth: 1, borderColor: '#EEEFF2' },
  icon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EEEFF2', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { fontSize: 20, fontWeight: '700', color: '#0A0A0B', marginBottom: 10, letterSpacing: -0.2 },
  sub: { fontSize: 14, color: '#8E9099', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  btn: { backgroundColor: '#1C3D5A', paddingHorizontal: 28, paddingVertical: 13, borderRadius: 10 },
  btnTxt: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function InstantsScreen() {
  const [me, setMe] = useState(null);
  const [categories, setCategories] = useState([]);
  const [instants, setInstants] = useState([]); // unseen from others
  const [myPosts, setMyPosts] = useState([]);
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [showSnap, setShowSnap] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cats, posts, mine, meData] = await Promise.all([
        getCommunityCategories(),
        getCommunityPosts(),
        getMyInstants(),
        getMe(),
      ]);
      setMe(meData);
      setCategories(cats);
      // API now returns flat array of unviewed posts
      setInstants(Array.isArray(posts) ? posts : []);
      setMyPosts(Array.isArray(mine) ? mine : []);
      setHasAccess(cats.length > 0);
    } catch (e) {
      if (String(e).includes('403') || String(e?.message).includes('403')) setHasAccess(false);
      else setHasAccess(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Camera needed', 'Allow camera to share an instant.'); return; }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.88, allowsEditing: false, exif: false });
    if (!res.canceled) { setPhoto(res.assets[0]); setShowSnap(true); }
  };

  const doPost = async (catId, caption, photoAsset) => {
    try {
      const fd = new FormData();
      fd.append('category_id', String(catId));
      fd.append('caption', caption);
      if (photoAsset) {
        const uri = photoAsset.uri;
        const name = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(name);
        fd.append('image', { uri, name, type: match ? `image/${match[1]}` : 'image/jpeg' });
      }
      const newPost = await createPost(fd);
      setMyPosts(prev => [newPost, ...prev]);
      setShowSnap(false);
      setPhoto(null);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not send instant.');
    }
  };

  const handleOpen = (post) => {
    setViewing(post);
    // Remove from stack immediately — it's gone once you open it
    setInstants(prev => prev.filter(p => p.id !== post.id));
  };

  if (loading && hasAccess === null) return <View style={s.center}><ActivityIndicator size="large" color="#1C3D5A" /></View>;
  if (hasAccess === false) return <WellnessGate />;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={{ backgroundColor: '#fff' }}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>Instants</Text>
            <Text style={s.sub}>
              {instants.length > 0 ? `${instants.length} waiting · tap to open` : 'Wellness · disappears once seen'}
            </Text>
          </View>
          <TouchableOpacity style={s.camBtn} onPress={openCamera} activeOpacity={0.85}>
            <Camera size={20} color="#FFFFFF" strokeWidth={1.75} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1C3D5A" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* My instant row */}
        <MyInstantRow
          myPosts={myPosts}
          onAdd={openCamera}
          onViewMine={() => myPosts[0] && setViewing(myPosts[0])}
        />

        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color="#1C3D5A" />
        ) : instants.length > 0 ? (
          <>
            <Text style={s.stackLabel}>
              {instants.length} instant{instants.length !== 1 ? 's' : ''} from your community
            </Text>
            <InstantStack posts={instants} onOpen={handleOpen} />
          </>
        ) : (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>All caught up</Text>
            <Text style={s.emptySub}>No new instants. Be first — tap the camera to share a moment with your community.</Text>
            <TouchableOpacity style={[wg.btn, { marginTop: 20 }]} onPress={openCamera}>
              <Text style={wg.btnTxt}>Take an Instant</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Full-screen viewer */}
      {viewing && (
        <InstantViewer
          post={viewing}
          me={me}
          onClose={() => setViewing(null)}
        />
      )}

      {/* Snap creation */}
      {showSnap && photo && (
        <SnapModal
          photo={photo}
          categories={categories}
          onPost={doPost}
          onRetake={async () => {
            const res = await ImagePicker.launchCameraAsync({ quality: 0.88 });
            if (!res.canceled) setPhoto(res.assets[0]);
          }}
          onClose={() => { setShowSnap(false); setPhoto(null); }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f0f0f0' },
  title: { fontSize: 28, fontWeight: '900', color: '#111', letterSpacing: -1 },
  sub: { fontSize: 12, color: '#a3a3a3', fontWeight: '600', marginTop: 1 },
  camBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#1C3D5A', alignItems: 'center', justifyContent: 'center' },
  stackLabel: { textAlign: 'center', fontSize: 13, color: '#a3a3a3', fontWeight: '600', marginTop: 20, marginBottom: 4 },
  empty: { alignItems: 'center', paddingTop: 56, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#a3a3a3', textAlign: 'center', lineHeight: 21 },
});
