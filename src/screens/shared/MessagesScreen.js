import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList, Image, SafeAreaView, StyleSheet,
  Text, TextInput, TouchableOpacity, View, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { colors } from '../../theme/colors';
import { supabase } from '../../utils/supabase';

const DARK = '#0D0B1F';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d)) return '';
  const now = new Date();
  const diffH = (now - d) / 36e5;
  if (diffH < 24) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (diffH < 168) return d.toLocaleDateString('en-IN', { weekday: 'short' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function expiryCountdown(expiresAt) {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt) - new Date();
  if (diffMs <= 0) return null;
  const diffH = diffMs / 36e5;
  if (diffH >= 24) return null;
  const h = Math.floor(diffH);
  const m = Math.floor((diffMs % 36e5) / 60000);
  return `${h}h ${m}m left`;
}

function getInitials(name = '') {
  return name.trim().split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

// ─── components ─────────────────────────────────────────────────────────────

function Avatar({ uri, name, size = 54 }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size * 0.28 }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <Text style={[styles.avatarInitials, { fontSize: size * 0.3 }]}>{getInitials(name)}</Text>
    </View>
  );
}

function ConversationItem({ item, onPress }) {
  const countdown = expiryCountdown(item.expires_at);
  return (
    <TouchableOpacity
      style={[styles.convoItem, item.unread && styles.convoItemUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.78}
    >
      {item.unread && <View style={styles.unreadBar} />}
      <View style={styles.convoAvatarWrap}>
        <Avatar uri={item.otherAvatarUrl} name={item.otherName} size={54} />
        {item.unread && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.convoBody}>
        <View style={styles.convoTopRow}>
          <Text style={[styles.convoName, item.unread && styles.convoNameBold]} numberOfLines={1}>
            {item.otherName}
          </Text>
          <Text style={styles.convoTime}>{formatTime(item.lastMessageAt)}</Text>
        </View>
        <Text style={[styles.convoPreview, item.unread && styles.convoPreviewBold]} numberOfLines={1}>
          {item.lastMessage || 'No messages yet'}
        </Text>
        {countdown ? (
          <View style={styles.expiryRow}>
            <Ionicons name="time-outline" size={10} color={colors.warning} />
            <Text style={styles.expiryText}> {countdown}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="chatbubbles-outline" size={38} color={colors.textLight} />
      </View>
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtitle}>Make a match to start a conversation</Text>
    </View>
  );
}

// ─── screen ─────────────────────────────────────────────────────────────────

export default function MessagesScreen({ navigation }) {
  const { user } = useAuth();
  const { profile } = useUser();
  const [conversations, setConversations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  const loadMatches = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: matchRows, error } = await supabase
        .from('matches')
        .select(`
          id, model_id, brand_id, expires_at, created_at,
          model:profiles!matches_model_id_fkey(id, full_name, profile_image_url),
          brand:profiles!matches_brand_id_fkey(id, full_name, profile_image_url)
        `)
        .or(`model_id.eq.${user.id},brand_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enriched = await Promise.all(
        (matchRows || []).map(async (m) => {
          const otherProfile = m.model_id === user.id ? m.brand : m.model;
          const { data: msgRows } = await supabase
            .from('messages').select('message_text, created_at, sender_id')
            .eq('match_id', m.id).order('created_at', { ascending: false }).limit(1);
          const lastMsg = msgRows?.[0] ?? null;
          return {
            matchId: m.id,
            otherName: otherProfile?.full_name ?? 'Unknown',
            otherAvatarUrl: otherProfile?.profile_image_url ?? null,
            lastMessage: lastMsg?.message_text ?? null,
            lastMessageAt: lastMsg?.created_at ?? m.created_at,
            expires_at: m.expires_at,
            unread: !!(lastMsg && lastMsg.sender_id !== user.id),
          };
        })
      );

      enriched.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      setConversations(enriched);
      setFiltered(enriched);
    } catch (err) {
      console.error('loadMatches error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`messages-list-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadMatches())
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [user, loadMatches]);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(conversations); return; }
    const q = search.toLowerCase();
    setFiltered(conversations.filter((c) => c.otherName.toLowerCase().includes(q)));
  }, [search, conversations]);

  const handlePress = (item) => {
    navigation.navigate('ChatScreen', { matchId: item.matchId, otherName: item.otherName });
  };

  const unreadCount = conversations.filter((c) => c.unread).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* Dark header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Messages</Text>
            {unreadCount > 0 && (
              <Text style={styles.headerSub}>{unreadCount} unread</Text>
            )}
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="create-outline" size={20} color="rgba(255,255,255,0.65)" />
          </TouchableOpacity>
        </View>

        {/* Search in dark zone */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations…"
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Conversation list */}
      <FlatList
        style={styles.list}
        data={filtered}
        keyExtractor={(item) => item.matchId}
        renderItem={({ item }) => <ConversationItem item={item} onPress={handlePress} />}
        ListEmptyComponent={!loading ? <EmptyState /> : null}
        contentContainerStyle={filtered.length === 0 ? styles.listEmpty : styles.listContent}
        refreshing={loading}
        onRefresh={loadMatches}
      />
    </SafeAreaView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK },

  /* Header */
  header: {
    backgroundColor: DARK,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 14,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 34, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1,
  },
  headerSub: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 2 },
  editBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },

  /* Search */
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#FFFFFF', padding: 0 },

  /* List */
  list: {
    flex: 1, backgroundColor: colors.background,
    borderTopLeftRadius: 26, borderTopRightRadius: 26, marginTop: -26,
  },
  listContent: { paddingTop: 8, paddingBottom: 24 },
  listEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },

  /* Conversation item */
  convoItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, gap: 14,
  },
  convoItemUnread: { backgroundColor: colors.accent },
  unreadBar: {
    position: 'absolute', left: 0, top: 14, bottom: 14,
    width: 3, borderRadius: 2, backgroundColor: colors.primary,
  },
  convoAvatarWrap: { position: 'relative' },
  avatarFallback: {
    backgroundColor: colors.primaryPale, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontWeight: '700', color: colors.primary },
  unreadDot: {
    position: 'absolute', bottom: -1, right: -1,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.surface,
  },
  convoBody: { flex: 1, gap: 3 },
  convoTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convoName: { fontSize: 15, fontWeight: '500', color: colors.textPrimary, flex: 1, marginRight: 8 },
  convoNameBold: { fontWeight: '800' },
  convoTime: { fontSize: 11, color: colors.textLight },
  convoPreview: { fontSize: 13, color: colors.textSecondary },
  convoPreviewBold: { fontWeight: '600', color: colors.textPrimary },
  expiryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  expiryText: { fontSize: 11, color: colors.warning, fontWeight: '500' },

  /* Empty */
  emptyWrap: { alignItems: 'center', gap: 14, paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.border,
  },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.4 },
  emptySubtitle: {
    fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21,
  },
});
