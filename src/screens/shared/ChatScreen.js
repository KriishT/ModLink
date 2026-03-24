import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { supabase } from '../../utils/supabase';
import MessageBubble from '../../components/MessageBubble';

const FLAGGED_WORDS = ['whatsapp', 'phone', 'number', 'meet outside', 'free', 'exposure'];

function containsFlaggedWord(text) {
  const lower = text.toLowerCase();
  return FLAGGED_WORDS.some((w) => lower.includes(w));
}

function formatMatchDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function hoursUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  if (diff <= 0) return null;
  return Math.round(diff / 36e5);
}

function MatchBanner({ match }) {
  const [expanded, setExpanded] = useState(true);
  if (!match) return null;
  const remaining = hoursUntil(match.expires_at);

  return (
    <TouchableOpacity style={styles.banner} onPress={() => setExpanded((v) => !v)} activeOpacity={0.9}>
      <View style={styles.bannerRow}>
        <Ionicons name="heart" size={13} color={colors.primary} />
        <Text style={styles.bannerText}>  You matched on {formatMatchDate(match.created_at)}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={13} color={colors.textLight} style={{ marginLeft: 'auto' }} />
      </View>
      {expanded && remaining !== null && (
        <Text style={styles.bannerExpiry}>Match expires in {remaining} hour{remaining !== 1 ? 's' : ''}</Text>
      )}
    </TouchableOpacity>
  );
}

function FlaggedWarning({ onReport, onBlock, onDismiss }) {
  return (
    <View style={styles.flaggedWarn}>
      <View style={styles.flaggedWarnRow}>
        <Ionicons name="warning-outline" size={16} color={colors.warning} />
        <Text style={styles.flaggedWarnText}>This message was flagged. You can report or block this user.</Text>
      </View>
      <View style={styles.flaggedWarnActions}>
        <TouchableOpacity style={[styles.flaggedBtn, styles.flaggedBtnDanger]} onPress={onReport}>
          <Text style={[styles.flaggedBtnText, { color: colors.error }]}>Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.flaggedBtn} onPress={onBlock}>
          <Text style={[styles.flaggedBtnText, { color: colors.textSecondary }]}>Block</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.flaggedBtn} onPress={onDismiss}>
          <Text style={[styles.flaggedBtnText, { color: colors.textLight }]}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChatScreen({ route, navigation }) {
  const { matchId, otherName } = route.params ?? {};
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [match, setMatch] = useState(null);
  const [showFlagWarning, setShowFlagWarning] = useState(false);
  const [pendingFlaggedText, setPendingFlaggedText] = useState('');

  const channelRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!matchId) return;
    supabase.from('matches').select('id, created_at, expires_at').eq('id', matchId).single()
      .then(({ data }) => setMatch(data));
  }, [matchId]);

  const loadMessages = useCallback(async () => {
    if (!matchId) return;
    const { data, error } = await supabase
      .from('messages').select('*').eq('match_id', matchId).order('created_at', { ascending: false });
    if (!error) setMessages(data ?? []);
  }, [matchId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  useEffect(() => {
    if (!matchId) return;
    const channel = supabase.channel(`chat-${matchId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => { setMessages((prev) => [payload.new, ...prev]); })
      .subscribe();
    channelRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, [matchId]);

  const doSend = async (text, flagged) => {
    if (!text.trim() || !user || !matchId) return;
    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({ match_id: matchId, sender_id: user.id, message_text: text.trim(), flagged: flagged ?? false });
      if (error) throw error;
      setInputText('');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    if (containsFlaggedWord(text)) { setPendingFlaggedText(text); setShowFlagWarning(true); return; }
    doSend(text, false);
  };

  const handleSendFlagged = () => { setShowFlagWarning(false); doSend(pendingFlaggedText, true); setPendingFlaggedText(''); };
  const handleReport = () => { setShowFlagWarning(false); setPendingFlaggedText(''); Alert.alert('Reported', 'Thank you. Our team will review this conversation.'); };
  const handleBlock = () => { setShowFlagWarning(false); setPendingFlaggedText(''); Alert.alert('Blocked', `${otherName ?? 'This user'} has been blocked.`); };

  const handleMenu = () => {
    Alert.alert(otherName ?? 'Options', '', [
      { text: 'Unmatch', style: 'destructive', onPress: () => Alert.alert('Unmatch?', 'This will delete the conversation.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Unmatch', style: 'destructive', onPress: async () => { await supabase.from('matches').delete().eq('id', matchId); navigation.goBack(); } }]) },
      { text: 'Report', onPress: () => Alert.alert('Reported', 'Thank you. Our moderation team will review.') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderMessage = ({ item }) => (
    <MessageBubble message={item} isOwn={item.sender_id === user?.id} />
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{(otherName ?? 'C')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.headerName} numberOfLines={1}>{otherName ?? 'Chat'}</Text>
        </View>
        <TouchableOpacity onPress={handleMenu} style={styles.headerBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <MatchBanner match={match} />

      {showFlagWarning && (
        <FlaggedWarning
          onReport={handleReport}
          onBlock={handleBlock}
          onDismiss={() => { setShowFlagWarning(false); handleSendFlagged(); }}
        />
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.msgList}
          showsVerticalScrollIndicator={false}
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message…"
            placeholderTextColor={colors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-up" size={19} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  banner: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  bannerExpiry: {
    fontSize: 11,
    color: colors.warning,
    marginTop: 4,
    fontWeight: '500',
  },
  flaggedWarn: {
    backgroundColor: 'rgba(245,166,35,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.3)',
    margin: 12,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  flaggedWarnRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  flaggedWarnText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  flaggedWarnActions: {
    flexDirection: 'row',
    gap: 8,
  },
  flaggedBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flaggedBtnDanger: {
    borderColor: 'rgba(232,75,120,0.3)',
  },
  flaggedBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  msgList: {
    paddingVertical: 14,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
});
