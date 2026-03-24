import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList, SafeAreaView, StyleSheet, Text,
  TouchableOpacity, View, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { colors } from '../../theme/colors';
import { supabase } from '../../utils/supabase';
import BookingCard from '../../components/BookingCard';

const DARK = '#0D0B1F';

const TABS = [
  { key: 'pending',   label: 'Pending',   icon: 'time-outline' },
  { key: 'upcoming',  label: 'Upcoming',  icon: 'calendar-outline' },
  { key: 'completed', label: 'Completed', icon: 'checkmark-circle-outline' },
];

const EMPTY_ICONS = {
  pending:   'time-outline',
  upcoming:  'calendar-outline',
  completed: 'checkmark-circle-outline',
};

const EMPTY_MESSAGES = {
  pending:   "You're all caught up.\nNew booking requests will appear here.",
  upcoming:  "No upcoming shoots.\nAccept a booking to get started.",
  completed: "No completed bookings yet.\nYour history will appear here.",
};

function isUpcoming(booking) {
  if (!booking.shoot_date) return true;
  return new Date(booking.shoot_date) >= new Date(new Date().toDateString());
}

function normalizeBooking(row) {
  return {
    id: row.id,
    shootType: row.shoot_type,
    shootDate: row.shoot_date,
    shootTime: row.shoot_time,
    duration: row.duration,
    paymentAmount: row.payment_amount,
    status: row.status,
    model: row.model_profile ? {
      name: row.model_profile.full_name,
      profileImageUrl: row.model_profile.profile_image_url,
    } : null,
    brand: row.brand_profile ? {
      brandName: row.brand_profile.full_name,
      logoUrl: row.brand_profile.profile_image_url,
    } : null,
    _raw: row,
  };
}

function EmptyState({ tab }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name={EMPTY_ICONS[tab]} size={34} color={colors.textLight} />
      </View>
      <Text style={styles.emptyText}>{EMPTY_MESSAGES[tab]}</Text>
    </View>
  );
}

export default function BookingsScreen({ navigation }) {
  const { user } = useAuth();
  const { profile } = useUser();

  const [activeTab, setActiveTab] = useState('pending');
  const [bookings, setBookings] = useState({ pending: [], upcoming: [], completed: [] });
  const [loading, setLoading] = useState(true);

  const userType = profile?.user_type ?? 'model';

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const col = userType === 'model' ? 'model_id' : 'brand_id';
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          model_profile:profiles!bookings_model_id_fkey(id, full_name, profile_image_url),
          brand_profile:profiles!bookings_brand_id_fkey(id, full_name, profile_image_url)
        `)
        .eq(col, user.id)
        .order('shoot_date', { ascending: true });

      if (error) throw error;
      const rows = data ?? [];

      setBookings({
        pending:   rows.filter((r) => r.status === 'pending').map(normalizeBooking),
        upcoming:  rows.filter((r) => (r.status === 'accepted' || r.status === 'confirmed') && isUpcoming(r)).map(normalizeBooking),
        completed: rows.filter((r) => r.status === 'completed').map(normalizeBooking),
      });
    } catch (err) {
      console.error('loadBookings error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user, userType]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const currentList = bookings[activeTab] ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* Dark header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>
              {Object.values(bookings).reduce((s, a) => s + a.length, 0)} total
            </Text>
          </View>
        </View>

        {/* Tab bar in dark zone */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            const count  = bookings[tab.key]?.length ?? 0;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* List */}
      <FlatList
        style={styles.list}
        data={currentList}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            userType={userType}
            onPress={() => navigation.navigate('BookingDetailScreen', { bookingId: item.id })}
          />
        )}
        ListEmptyComponent={!loading ? <EmptyState tab={activeTab} /> : null}
        contentContainerStyle={currentList.length === 0 ? styles.listEmpty : styles.listContent}
        refreshing={loading}
        onRefresh={loadBookings}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK },

  /* Header */
  header: { backgroundColor: DARK, paddingBottom: 20 },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.8,
  },
  totalBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  totalBadgeText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },

  /* Tabs */
  tabBar: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 8,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 12, gap: 5,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  tabLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  tabLabelActive: { color: DARK },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: colors.primary },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  tabBadgeTextActive: { color: '#FFFFFF' },

  /* List */
  list: {
    flex: 1, backgroundColor: colors.background,
    borderTopLeftRadius: 26, borderTopRightRadius: 26, marginTop: -26,
  },
  listContent: { padding: 16 },
  listEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Empty state */
  emptyWrap: { alignItems: 'center', gap: 16, paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 90, height: 90, borderRadius: 28,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0D0B1F', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  emptyText: {
    fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22,
  },
});
