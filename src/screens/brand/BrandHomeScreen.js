import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Image, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../utils/supabase';
import SafetyBanner from '../../components/SafetyBanner';
import BookingCard from '../../components/BookingCard';
import { ModLinkWordmark } from '../../components/ModLinkLogo';

const DARK = '#0D0B1F';

const MOCK_MODELS = [
  { id: 'm1', name: 'Aanya Sharma', city: 'Mumbai',    categories: ['Fashion', 'Lifestyle'], rating: 4.8, rate: 8000,  profileImageUrl: null },
  { id: 'm2', name: 'Priya Nair',   city: 'Bangalore', categories: ['E-commerce', 'Beauty'], rating: 4.6, rate: 6500,  profileImageUrl: null },
  { id: 'm3', name: 'Rhea Kapoor',  city: 'Delhi',     categories: ['Streetwear', 'Campaign'], rating: 4.9, rate: 12000, profileImageUrl: null },
  { id: 'm4', name: 'Meera Joshi',  city: 'Pune',      categories: ['Lookbook', 'Catalog'],  rating: 4.5, rate: 5000,  profileImageUrl: null },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'MORNING';
  if (h < 17) return 'AFTERNOON';
  return 'EVENING';
}

function Avatar({ uri, name, size = 58 }) {
  const initials = name
    ? name.trim().split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size * 0.28 }} resizeMode="cover" />;
  }
  return (
    <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <Text style={{ fontSize: size * 0.28, fontWeight: '900', color: colors.primary }}>{initials}</Text>
    </View>
  );
}

function ModelCard({ model, onViewProfile }) {
  return (
    <View style={styles.modelCard}>
      <Avatar uri={model.profileImageUrl} name={model.name} size={60} />
      <Text style={styles.modelName} numberOfLines={1}>{model.name}</Text>
      <View style={styles.ratingRow}>
        <Ionicons name="star" size={11} color={colors.warning} />
        <Text style={styles.ratingText}>{model.rating?.toFixed(1) ?? '—'}</Text>
      </View>
      <Text style={styles.modelCats} numberOfLines={1}>{(model.categories || []).slice(0, 2).join(' · ')}</Text>
      <Text style={styles.modelRate}>
        ₹{Number(model.rate || 0).toLocaleString('en-IN')}
        <Text style={styles.perDay}>/day</Text>
      </Text>
      <View style={styles.cityRow}>
        <Ionicons name="location-outline" size={10} color={colors.textLight} />
        <Text style={styles.cityText}>{model.city}</Text>
      </View>
      <TouchableOpacity style={styles.viewBtn} onPress={() => onViewProfile(model)} activeOpacity={0.8}>
        <Text style={styles.viewBtnText}>View</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function BrandHomeScreen({ navigation }) {
  const { user } = useAuth();
  const { brandProfile, profile } = useUser();

  const [models,        setModels]        = useState([]);
  const [bookings,      setBookings]      = useState([]);
  const [appCount,      setAppCount]      = useState(0);
  const [loadingModels, setLoadingModels] = useState(true);
  const [loadingBook,   setLoadingBook]   = useState(true);

  const isVerified = brandProfile?.verified === true;
  const brandName  = brandProfile?.brand_name || profile?.full_name || 'Brand';

  useEffect(() => { fetchModels(); fetchBookings(); fetchAppCount(); }, []);

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from('model_profiles')
        .select('id, categories, rate_half_day, rate_full_day, profiles(full_name, profile_image_url, city, average_rating)')
        .limit(10);
      if (error || !data?.length) { setModels(MOCK_MODELS); return; }
      setModels(data.map((mp) => ({
        id: mp.id,
        name: mp.profiles?.full_name ?? 'Model',
        profileImageUrl: mp.profiles?.profile_image_url ?? null,
        categories: mp.categories || [],
        rate: mp.rate_half_day || mp.rate_full_day || 0,
        city: mp.profiles?.city || '—',
        rating: mp.profiles?.average_rating || 0,
      })));
    } catch { setModels(MOCK_MODELS); }
    finally { setLoadingModels(false); }
  };

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('bookings').select('*').eq('brand_id', user.id)
        .in('status', ['pending', 'accepted', 'confirmed'])
        .order('created_at', { ascending: false }).limit(5);
      if (!error && data) setBookings(data);
    } catch {}
    finally { setLoadingBook(false); }
  };

  const fetchAppCount = async () => {
    if (!user) return;
    try {
      const { count } = await supabase
        .from('swipes').select('*', { count: 'exact', head: true })
        .eq('target_id', user.id).eq('direction', 'right').eq('reviewed', false);
      setAppCount(count || 0);
    } catch { setAppCount(0); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* ── Dark editorial hero ─────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.topBar}>
          <ModLinkWordmark size={19} variant="light" />
          <View style={styles.topIcons}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('BrandDiscover')}>
              <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.65)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={18} color="rgba(255,255,255,0.65)" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.greetArea}>
          <Text style={styles.greetLabel}>GOOD {getGreeting()}</Text>
          <Text style={styles.greetName}>{brandName}</Text>
        </View>

        {/* Quick action pills in hero */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickPill} onPress={() => navigation.navigate('PostJob')} activeOpacity={0.85}>
            <Ionicons name="megaphone-outline" size={16} color="#fff" />
            <Text style={styles.quickPillText}>Post Casting</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickPill, styles.quickPillOutline]} onPress={() => navigation.navigate('BrandDiscover')} activeOpacity={0.85}>
            <Ionicons name="people-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={[styles.quickPillText, { color: 'rgba(255,255,255,0.8)' }]}>Browse Models</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── White scroll content ─────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        {!isVerified && (
          <View style={styles.bannerWrap}>
            <SafetyBanner
              type="warning"
              message="Complete verification to post castings and contact models."
              actionLabel="Verify Now"
              onAction={() => navigation.navigate('BrandProfileSetup')}
            />
          </View>
        )}

        {/* Applications banner */}
        <TouchableOpacity
          style={styles.appBanner}
          onPress={() => navigation.navigate('Applications')}
          activeOpacity={0.88}
        >
          <View style={styles.appBannerLeft}>
            <Text style={styles.appCount}>{appCount}</Text>
            <Text style={styles.appLabel}>
              model{appCount !== 1 ? 's' : ''} applied to your castings
            </Text>
          </View>
          <View style={styles.appArrow}>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Suggested models */}
        <View style={styles.sectionHeader}>
          <View style={styles.accent} />
          <Text style={styles.sectionTitle}>Suggested Models</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BrandDiscover')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {loadingModels ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modelsScroll}>
            {models.map((m) => (
              <ModelCard key={m.id} model={m} onViewProfile={(model) => navigation.navigate('ModelProfile', { modelId: model.id })} />
            ))}
          </ScrollView>
        )}

        {/* Active bookings */}
        <View style={styles.sectionHeader}>
          <View style={styles.accent} />
          <Text style={styles.sectionTitle}>Active Bookings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {loadingBook ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
        ) : bookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="calendar-outline" size={28} color={colors.textLight} />
            </View>
            <Text style={styles.emptyText}>No active bookings yet</Text>
            <Text style={styles.emptySub}>Post a casting call to get started</Text>
          </View>
        ) : (
          bookings.map((b) => (
            <BookingCard key={b.id} booking={b} userType="brand"
              onPress={() => navigation.navigate('BookingDetail', { bookingId: b.id })} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK },

  /* Hero */
  hero: { backgroundColor: DARK, paddingBottom: 28 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20,
  },
  topIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  greetArea: { paddingHorizontal: 20, gap: 3, marginBottom: 22 },
  greetLabel: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: 2.8,
  },
  greetName: {
    fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1, lineHeight: 42,
  },
  quickRow: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 10,
  },
  quickPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 11,
  },
  quickPillOutline: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  quickPillText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  /* Scroll */
  scroll: {
    flex: 1, backgroundColor: colors.background,
    borderTopLeftRadius: 26, borderTopRightRadius: 26, marginTop: -26,
  },
  scrollContent: { paddingBottom: 48, paddingTop: 4 },
  bannerWrap: { paddingHorizontal: 20, paddingTop: 20 },

  /* Section headers */
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, marginTop: 28, marginBottom: 14, gap: 10,
  },
  accent: { width: 3, height: 16, borderRadius: 2, backgroundColor: colors.primary },
  sectionTitle: {
    flex: 1, fontSize: 12, fontWeight: '800', color: colors.textPrimary,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  seeAll: { fontSize: 13, fontWeight: '600', color: colors.primary },

  /* Applications banner */
  appBanner: {
    marginHorizontal: 20, marginTop: 20,
    backgroundColor: DARK, borderRadius: 22,
    padding: 20, flexDirection: 'row', alignItems: 'center',
    shadowColor: DARK, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18, shadowRadius: 16, elevation: 6,
  },
  appBannerLeft: { flex: 1 },
  appCount: { fontSize: 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1.2 },
  appLabel: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  appArrow: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* Model cards */
  modelsScroll: { paddingHorizontal: 20, paddingBottom: 4, gap: 12 },
  modelCard: {
    width: 148, backgroundColor: colors.surface, borderRadius: 22,
    padding: 15, alignItems: 'center', gap: 5,
    shadowColor: '#0D0B1F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 14, elevation: 3,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primaryPale, alignItems: 'center', justifyContent: 'center',
  },
  modelName: {
    fontSize: 13, fontWeight: '800', color: colors.textPrimary,
    marginTop: 6, textAlign: 'center', letterSpacing: -0.2,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  modelCats: { fontSize: 11, color: colors.textLight, textAlign: 'center' },
  modelRate: { fontSize: 14, fontWeight: '900', color: colors.primary, letterSpacing: -0.3 },
  perDay: { fontSize: 11, fontWeight: '400', color: colors.textLight },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cityText: { fontSize: 11, color: colors.textLight },
  viewBtn: {
    marginTop: 4, paddingHorizontal: 18, paddingVertical: 7,
    backgroundColor: DARK, borderRadius: 10,
  },
  viewBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  /* Empty card */
  emptyCard: {
    marginHorizontal: 20, backgroundColor: colors.surface, borderRadius: 22,
    padding: 32, alignItems: 'center', gap: 10,
    shadowColor: '#0D0B1F', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  emptyIconWrap: {
    width: 56, height: 56, borderRadius: 18, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  emptySub: { fontSize: 13, color: colors.textLight, textAlign: 'center' },
});
