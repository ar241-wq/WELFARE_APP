import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { askAI, getMe } from '../lib/api';

const QUICK_PROMPTS = [
  "What should I redeem today?",
  "How many credits do I have?",
  "I'm feeling stressed",
  "What's expiring soon?",
];

function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.typingRow}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarIcon}>✦</Text>
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.dotsRow}>
          {dots.map((dot, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

function MessageBubble({ item }) {
  const isBot = item.role === 'bot';
  const time = new Date(item.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isBot) {
    return (
      <View style={styles.botRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarIcon}>✦</Text>
        </View>
        <View style={styles.botColumn}>
          <Text style={styles.senderLabel}>Wellness AI</Text>
          <View style={styles.botBubble}>
            <Text style={styles.botText}>{item.text}</Text>
          </View>
          <Text style={styles.timestamp}>{time}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.userRow}>
      <View style={styles.userColumn}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{item.text}</Text>
        </View>
        <Text style={[styles.timestamp, { textAlign: 'right' }]}>{time}</Text>
      </View>
    </View>
  );
}

export default function AIAssistantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [userName, setUserName] = useState('there');

  useEffect(() => {
    getMe()
      .then((me) => {
        const name = me?.full_name?.split(' ')[0] || 'there';
        setUserName(name);
        const welcome = {
          id: 'welcome',
          role: 'bot',
          text: `Hey ${name}! I'm your wellness coach. Ask me anything — what perks to redeem, how to use your credits, or just tell me how you're feeling today 💜`,
          ts: Date.now(),
        };
        setMessages([welcome]);
      })
      .catch(() => {
        setMessages([
          {
            id: 'welcome',
            role: 'bot',
            text: "Hey! I'm your wellness coach. Ask me anything — what perks to redeem, how to use your credits, or just tell me how you're feeling today 💜",
            ts: Date.now(),
          },
        ]);
      });
  }, []);

  function scrollToBottom() {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }

  async function sendMessage(text) {
    const trimmed = (text || input).trim();
    if (!trimmed) return;

    setInput('');
    setShowPrompts(false);

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text: trimmed, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    scrollToBottom();

    try {
      const data = await askAI(trimmed);
      const botMsg = { id: `b-${Date.now()}`, role: 'bot', text: data.reply, ts: Date.now() };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errMsg = {
        id: `e-${Date.now()}`,
        role: 'bot',
        text: "I'm having trouble right now, try again in a moment.",
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI Wellness Coach</Text>
          <Text style={styles.headerSub}>Powered by Llama 3</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={scrollToBottom}
        renderItem={({ item, index }) => (
          <>
            <MessageBubble item={item} />
            {/* Quick prompts after welcome message */}
            {item.id === 'welcome' && showPrompts && (
              <View style={styles.promptsContainer}>
                {QUICK_PROMPTS.map((prompt) => (
                  <TouchableOpacity
                    key={prompt}
                    style={styles.promptChip}
                    onPress={() => sendMessage(prompt)}
                  >
                    <Text style={styles.promptText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
        ListFooterComponent={isTyping ? <TypingIndicator /> : null}
      />

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your wellness coach..."
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={500}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
          blurOnSubmit
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => sendMessage()}
          disabled={!input.trim()}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f3ff' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  backIcon: { fontSize: 30, color: '#6366f1', lineHeight: 34 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 11, color: '#6366f1', fontWeight: '500', marginTop: 1 },

  // List
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },

  // Bot message
  botRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 16,
  },
  avatarIcon: { color: '#fff', fontSize: 13, fontWeight: '700' },
  botColumn: { flex: 1 },
  senderLabel: { fontSize: 11, color: '#6366f1', fontWeight: '700', marginBottom: 4 },
  botBubble: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  botText: { fontSize: 14, color: '#111827', lineHeight: 20 },

  // User message
  userRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
  userColumn: { alignItems: 'flex-end', maxWidth: '80%' },
  userBubble: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    borderTopRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userText: { fontSize: 14, color: '#fff', lineHeight: 20 },

  timestamp: { fontSize: 10, color: '#9ca3af', marginTop: 4 },

  // Typing indicator
  typingRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  typingBubble: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#6366f1' },

  // Quick prompts
  promptsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  promptChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eef2ff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  promptText: { fontSize: 13, color: '#4338ca', fontWeight: '600' },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f5f3ff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#c7d2fe' },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
