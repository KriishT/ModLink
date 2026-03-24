import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Dimensions, RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../utils/supabase';
import SafetyBanner from '../../components/SafetyBanner';
import { ModLinkWordmark } from '../../components/ModLinkLogo';

const DARK = '#0D0B1F';
const { width: W } = Dimensions.get('window');

const MOCK_OPPORTUNITIES = [
  { id: '1', brandName: 'Zara India',  shootType: 'Editorial',        payment: '₹12,000', city: 'Mumbai',    date: 'Apr 5' },
  { id: '2', brandName: 'Nykaa',       shootType: 'Beauty Campaign',  payment: '₹8,500',  city: 'Delhi',     date: 'Apr 8' },
  { id: '3', brandName: 'Bewakoof',    shootType: 'Streetwear',       payment: '₹6,000',  city: 'Bangalore', date: 'Apr 12' },
  { id: '4', brandName: 'Manyavar',    shootType: 'Festive Lookbook', payment: '₹15,000', city: 'Kolkata',   date: 'Apr 15' },
];
const MOCK_BRANDS = ['Zara India', 'Nykaa Fashion', 'H&M', 'Myntra', 'FabIndia'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'MORNING';
  if (h < 17) return 'AFTERNOON';
  return 'EVENING';
}

function OpportunityCard({ item }) {
  return (
    <View style={styles.oppCard}>
      <View style={styles.oppTop}>
        <View style={styles.oppInitial}>
          <Text style={styles.oppInitialText}>{item.brandName?.[0] ?? '?'}</Text>
        </View>
        <View style={styles.oppBadge}>
          <Text style={styles.oppBadgeText}>{item.shootType}</Text>
        </View>
      </View>
      <Text style={styles.oppBrand} numberOfLines={1}>{item.brandName}</Text>
      <View style={styles.oppMetaRow}>
        <Ionicons name="location-outline" size={11} color={colors.textLight} />
        <Text style={styles.oppMeta}>{item.city} · {item.date}</Text>
      </View>
      <Text style={styles.oppPayment}>{item.payment}</Text>
      <View style={styles.oppCta}>
        <Text style={styles.oppCtaText}>View</Text>
        <Ionicons name="arrow-forward" size={11} color="#fff" />
      </View>
    </View>
  );
}

export default function ModelHomeScreen({ navigation }) {
  const { user } = useAuth();
  const { profile, modelProfile } = useUser();

  const [opportunities, setOpportunities] = useState(MOCK_OPPORTUNITIES);
  const [brands,        setBrands]        = useState(MOCK_BRANDS);
  const [refreshing,    setRefreshing]    = useState(false);

  const isVerified = modelProfile?.verification_status === 'approved';
  const firstName  = profile?.full_name?.split(' ')[0] ?? 'there';

  const fetchOpportunities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, brand_id, shoot_type, payment, city, date, profiles(full_name)')
        .eq('status', 'pending').limit(10);
      if (error) throw error;
      if (data?.length > 0) {
        setOpportunities(data.map((b) => ({
          id: b.id,
          brandName: b.profiles?.full_name ?? 'Unknown Brand',
          shootType: b.shoot_type ?? 'Shoot',
          payment: b.payment ? `₹${Number(b.payment).toLocaleString('en-IN')}` : 'Negotiable',
          city: b.city ?? '—', date: b.date ?? '—',
        })));
      }
    } catch { /* fall back to mock */ }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('brand_profiles').select('id, brand_name').limit(8);
      if (error) throw error;
      if (data?.length > 0) setBrands(data.map((b) => b.brand_name));
    } catch { /* fall back to mock */ }
  }, []);

  useEffect(() => { fetchOpportunities(); fetchBrands(); }, [fetchOpportunities, fetchBrands]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchOpportunities(), fetchBrands()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* ── Dark editorial hero ───────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.topBar}>
          <ModLinkWordmark size={19} variant="light" />
          <View style={styles.topRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={19} color="rgba(255,255,255,0.65)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="options-outline" size={19} color="rgba(255,255,255,0.65)" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.greetArea}>
          <Text style={styles.greetLabel}>GOOD {getGreeting()}</Text>
          <Text style={styles.greetName}>{firstName}</Text>
          {!isVerified && (
            <View style={styles.pendingBadge}>
              <View style={styles.pendingDot} />
              <Text style={styles.pendingText}>Verification pending</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          {[
            { value: brands.length, label: 'BRANDS' },
            { value: 0,             label: 'MATCHES' },
            { value: 0,             label: 'SHOOTS' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{s.value}</Text>
                <Text style={styles.statLbl}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ── Scrollable white content (arched) ────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {!isVerified && (
          <View style={styles.bannerWrap}>
            <SafetyBanner
              type="warning"
              message="Verification pending — browse freely, apply after verification."
              onAction={() => navigation.navigate('ModelVerification')}
              actionLabel="Verify Now"
            />
          </View>
        )}

        {/* Opportunities */}
        <View style={styles.sectionHeader}>
          <View style={styles.accent} />
          <Text style={styles.sectionTitle}>Opportunities</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {opportunities.map((item) => <OpportunityCard key={item.id} item={item} />)}
        </ScrollView>

        {/* Brands */}
        <View style={styles.sectionHeader}>
          <View style={styles.accent} />
          <Text style={styles.sectionTitle}>Brands Looking For You</Text>
        </View>

        <View style={styles.brandsCard}>
          <View style={styles.brandsTop}>
            <Text style={styles.brandsBigNum}>{brands.length}</Text>
            <Text style={styles.brandsSub}>brand{brands.length !== 1 ? 's' : ''} interested today</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {brands.map((name, i) => (
              <View key={i} style={styles.chip}><Text style={styles.chipText}>{name}</Text></View>
            ))}
          </ScrollView>
        </View>

        {/* Discover CTA */}
        <TouchableOpacity
          style={styles.discoverCard}
          onPress={() => navigation.navigate('Discover')}
          activeOpacity={0.9}
        >
          <View style={styles.discoverInner}>
            <Text style={styles.discoverEyebrow}>READY TO CONNECT?</Text>
            <Text style={styles.discoverTitle}>Start Discovering{'\n'}Brands</Text>
            <View style={styles.discoverBtn}>
              <Text style={styles.discoverBtnText}>Swipe Now</Text>
              <Ionicons name="arrow-forward" size={13} color={DARK} />
            </View>
          </View>
          <Ionicons name="heart" size={56} color="rgba(255,255,255,0.1)" />
        </TouchableOpacity>
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
  topRight: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  greetArea: { paddingHorizontal: 20, gap: 3, marginBottom: 24 },
  greetLabel: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2.8,
  },
  greetName: {
    fontSize: 40, fontWeight: '900', color: '#FFFFFF',
    letterSpacing: -1.2, lineHeight: 46,
  },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  pendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning },
  pendingText: { fontSize: 12, color: colors.warning, fontWeight: '500' },

  statsRow: {
    flexDirection: 'row', marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18, paddingVertical: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.8 },
  statLbl: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 4 },

  /* Scroll */
  scroll: {
    flex: 1, backgroundColor: colors.background,
    borderTopLeftRadius: 26, borderTopRightRadius: 26, marginTop: -26,
  },
  scrollContent: { paddingBottom: 40, paddingTop: 4 },
  bannerWrap: { paddingHorizontal: 20, paddingTop: 18 },

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

  /* Opportunity cards */
  hScroll: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  oppCard: {
    width: 158, backgroundColor: colors.surface, borderRadius: 22, padding: 15, gap: 8,
    shadowColor: '#0D0B1F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  oppTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  oppInitial: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.primaryPale, alignItems: 'center', justifyContent: 'center',
  },
  oppInitialText: { fontSize: 16, fontWeight: '900', color: colors.primary },
  oppBadge: {
    backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  oppBadgeText: { fontSize: 9, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.2 },
  oppBrand: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.2 },
  oppMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  oppMeta: { fontSize: 11, color: colors.textLight, flex: 1 },
  oppPayment: { fontSize: 21, fontWeight: '900', color: colors.primary, letterSpacing: -0.7 },
  oppCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: DARK, borderRadius: 10, paddingVertical: 8,
  },
  oppCtaText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  /* Brands card */
  brandsCard: {
    marginHorizontal: 20, backgroundColor: colors.surface, borderRadius: 22,
    padding: 20, gap: 16,
    shadowColor: '#0D0B1F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
  },
  brandsTop: { gap: 2 },
  brandsBigNum: { fontSize: 40, fontWeight: '900', color: colors.primary, letterSpacing: -1.2 },
  brandsSub: { fontSize: 13, color: colors.textSecondary },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { backgroundColor: DARK, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 12, fontWeight: '600', color: '#fff' },

  /* Discover card */
  discoverCard: {
    marginHorizontal: 20, marginTop: 28, backgroundColor: DARK,
    borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center',
    shadowColor: DARK, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22, shadowRadius: 24, elevation: 8,
  },
  discoverInner: { flex: 1, gap: 8 },
  discoverEyebrow: {
    fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5,
  },
  discoverTitle: {
    fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.6, lineHeight: 28,
  },
  discoverBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 9, alignSelf: 'flex-start', marginTop: 4,
  },
  discoverBtnText: { fontSize: 13, fontWeight: '700', color: DARK },
});
