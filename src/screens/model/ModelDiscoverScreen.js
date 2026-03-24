import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-deck-swiper';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../utils/supabase';
import ProfileCard from '../../components/ProfileCard';
import MatchModal from '../../components/MatchModal';

const { width: W, height: H } = Dimensions.get('window');
const DARK = '#0D0B1F';
const PURPLE = '#7856FF';

const MOCK_BRANDS = [
  {
    id: 'mock-1',
    brandName: 'Zara India',
    city: 'Mumbai',
    rating: 4.7,
    reviewCount: 38,
    brandType: 'Fashion Retail',
    bio: 'Looking for fresh faces for our upcoming summer editorial. Clean, modern aesthetic preferred.',
    budgetMin: 8000,
    budgetMax: 20000,
    shootsPerMonth: 6,
    brandIdentity: ['Minimalist', 'Urban'],
    logoUrl: null,
  },
  {
    id: 'mock-2',
    brandName: 'Nykaa Fashion',
    city: 'Delhi',
    rating: 4.5,
    reviewCount: 62,
    brandType: 'Beauty & Lifestyle',
    bio: 'Beauty, skincare & fashion shoots. We love bold looks and expressive talent.',
    budgetMin: 5000,
    budgetMax: 15000,
    shootsPerMonth: 10,
    brandIdentity: ['Glamour', 'Bold'],
    logoUrl: null,
  },
  {
    id: 'mock-3',
    brandName: 'Bewakoof',
    city: 'Bangalore',
    rating: 4.2,
    reviewCount: 25,
    brandType: 'Streetwear',
    bio: 'Casual and streetwear shoots for our D2C brand. Vibrant, youth-oriented content.',
    budgetMin: 3000,
    budgetMax: 8000,
    shootsPerMonth: 12,
    brandIdentity: ['Casual', 'Street'],
    logoUrl: null,
  },
  {
    id: 'mock-4',
    brandName: 'FabIndia',
    city: 'Jaipur',
    rating: 4.8,
    reviewCount: 91,
    brandType: 'Ethnic Wear',
    bio: 'Celebrating Indian craftsmanship. We need models who can carry traditional wear with grace.',
    budgetMin: 10000,
    budgetMax: 25000,
    shootsPerMonth: 4,
    brandIdentity: ['Traditional', 'Artisan'],
    logoUrl: null,
  },
  {
    id: 'mock-5',
    brandName: 'Manyavar',
    city: 'Kolkata',
    rating: 4.6,
    reviewCount: 47,
    brandType: 'Festive Wear',
    bio: 'Premium ethnic wear brand for weddings and celebrations. Looking for elegant, expressive talent.',
    budgetMin: 12000,
    budgetMax: 30000,
    shootsPerMonth: 3,
    brandIdentity: ['Premium', 'Festive'],
    logoUrl: null,
  },
];

const BRAND_TYPES = ['Fashion Retail', 'Beauty & Lifestyle', 'Streetwear', 'Ethnic Wear', 'Festive Wear', 'Fitness', 'Commercial'];
const CITY_OPTIONS = ['Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Jaipur', 'Hyderabad', 'Chennai'];

function FilterModal({ visible, filters, onApply, onClose }) {
  const [local, setLocal] = useState(filters);

  useEffect(() => {
    if (visible) setLocal(filters);
  }, [visible, filters]);

  const toggleBrandType = (t) => {
    setLocal((prev) => {
      const arr = prev.brandTypes ?? [];
      return { ...prev, brandTypes: arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t] };
    });
  };

  const toggleCity = (c) => {
    setLocal((prev) => {
      const arr = prev.cities ?? [];
      return { ...prev, cities: arr.includes(c) ? arr.filter((x) => x !== c) : [...arr, c] };
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={fStyles.overlay}>
        <View style={fStyles.sheet}>
          <View style={fStyles.handle} />
          <View style={fStyles.header}>
            <Text style={fStyles.title}>Filter Brands</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={DARK} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={fStyles.sectionLabel}>Min Budget (₹)</Text>
            <View style={fStyles.rangeRow}>
              {[0, 3000, 5000, 10000, 20000].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[fStyles.chip, local.minBudget === v && fStyles.chipSelected]}
                  onPress={() => setLocal((p) => ({ ...p, minBudget: v }))}
                >
                  <Text style={[fStyles.chipText, local.minBudget === v && fStyles.chipTextSelected]}>
                    {v === 0 ? 'Any' : `₹${(v / 1000).toFixed(0)}k`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={fStyles.sectionLabel}>Brand Type</Text>
            <View style={fStyles.chipsWrap}>
              {BRAND_TYPES.map((t) => {
                const sel = (local.brandTypes ?? []).includes(t);
                return (
                  <TouchableOpacity key={t} style={[fStyles.chip, sel && fStyles.chipSelected]} onPress={() => toggleBrandType(t)}>
                    <Text style={[fStyles.chipText, sel && fStyles.chipTextSelected]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={fStyles.sectionLabel}>City</Text>
            <View style={fStyles.chipsWrap}>
              {CITY_OPTIONS.map((c) => {
                const sel = (local.cities ?? []).includes(c);
                return (
                  <TouchableOpacity key={c} style={[fStyles.chip, sel && fStyles.chipSelected]} onPress={() => toggleCity(c)}>
                    <Text style={[fStyles.chipText, sel && fStyles.chipTextSelected]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={fStyles.toggleRow}>
              <Text style={fStyles.toggleLabel}>Verified Brands Only</Text>
              <Switch
                value={local.verifiedOnly ?? false}
                onValueChange={(v) => setLocal((p) => ({ ...p, verifiedOnly: v }))}
                trackColor={{ false: colors.border, true: PURPLE + '60' }}
                thumbColor={local.verifiedOnly ? PURPLE : '#ccc'}
              />
            </View>
          </ScrollView>

          <View style={fStyles.footer}>
            <TouchableOpacity
              style={fStyles.resetBtn}
              onPress={() => setLocal({ brandTypes: [], cities: [], minBudget: 0, verifiedOnly: false })}
            >
              <Text style={fStyles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={fStyles.applyBtn} onPress={() => onApply(local)}>
              <Text style={fStyles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ModelDiscoverScreen({ navigation }) {
  const { user } = useAuth();
  const { profile, modelProfile } = useUser();

  const swiperRef = useRef(null);

  const [brands, setBrands] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [overlayLabel, setOverlayLabel] = useState(null);

  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchedBrand, setMatchedBrand] = useState(null);

  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({ brandTypes: [], cities: [], minBudget: 0, verifiedOnly: false });

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('brand_profiles')
        .select('id, brand_name, business_type, bio, brand_identity, profiles(city, average_rating, total_reviews, profile_image_url)')
        .limit(30);

      if (filters.brandTypes.length > 0) {
        query = query.in('business_type', filters.brandTypes);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        const mapped = data.map((b) => ({
          id: b.id,
          brandName: b.brand_name,
          city: b.profiles?.city ?? '—',
          rating: b.profiles?.average_rating ?? 0,
          reviewCount: b.profiles?.total_reviews ?? 0,
          brandType: b.business_type,
          bio: b.bio,
          brandIdentity: b.brand_identity ?? [],
          logoUrl: b.profiles?.profile_image_url ?? null,
        }));
        setBrands(mapped);
      } else {
        setBrands(MOCK_BRANDS);
      }
    } catch {
      setBrands(MOCK_BRANDS);
    } finally {
      setLoading(false);
      setCardIndex(0);
    }
  }, [filters]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const checkForMatch = async (brandId) => {
    try {
      const { data } = await supabase
        .from('swipes').select('id')
        .eq('swiper_id', brandId).eq('swiped_id', user.id).eq('swipe_type', 'like')
        .maybeSingle();
      return !!data;
    } catch { return false; }
  };

  const createMatch = async (brandId) => {
    try {
      await supabase.from('matches').insert({
        model_id: user.id, brand_id: brandId,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });
    } catch {}
  };

  const handleLike = async (index) => {
    const brand = brands[index];
    if (!brand) return;
    try {
      await supabase.from('swipes').insert({ swiper_id: user.id, swiped_id: brand.id, swipe_type: 'like', created_at: new Date().toISOString() });
      const isMatch = await checkForMatch(brand.id);
      if (isMatch) { await createMatch(brand.id); setMatchedBrand(brand); setMatchModalVisible(true); }
    } catch {}
    setOverlayLabel(null);
  };

  const handlePass = async (index) => {
    const brand = brands[index];
    if (!brand) return;
    try {
      await supabase.from('swipes').insert({ swiper_id: user.id, swiped_id: brand.id, swipe_type: 'pass', created_at: new Date().toISOString() });
    } catch {}
    setOverlayLabel(null);
  };

  const handleSwiped = (index) => {
    setCardIndex(index + 1);
    setOverlayLabel(null);
  };

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setFilterVisible(false);
  };

  const hasActiveFilters = filters.brandTypes.length > 0 || filters.cities.length > 0 || filters.minBudget > 0 || filters.verifiedOnly;
  const remaining = Math.max(0, brands.length - cardIndex);
  const isEmpty = !loading && cardIndex >= brands.length;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeHeader}>
        {/* Dark editorial header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Discover</Text>
            {!loading && brands.length > 0 && !isEmpty && (
              <Text style={styles.headerSub}>{remaining} brand{remaining !== 1 ? 's' : ''} nearby</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
            onPress={() => setFilterVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={18} color={hasActiveFilters ? '#FFFFFF' : 'rgba(255,255,255,0.6)'} />
            {hasActiveFilters && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* White arched content */}
      <View style={styles.content}>
        {/* Swiper area */}
        <View style={styles.swiperArea}>
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={PURPLE} />
              <Text style={styles.loadingText}>Finding brands for you...</Text>
            </View>
          ) : isEmpty ? (
            <View style={styles.centerState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="heart-dislike-outline" size={36} color="rgba(120,86,255,0.5)" />
              </View>
              <Text style={styles.emptyTitle}>You've seen everyone!</Text>
              <Text style={styles.emptySub}>Check back later or adjust your filters.</Text>
              <TouchableOpacity style={styles.refreshBtn} onPress={fetchBrands} activeOpacity={0.8}>
                <Ionicons name="refresh-outline" size={16} color={PURPLE} />
                <Text style={styles.refreshBtnText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Swiper
              ref={swiperRef}
              cards={brands}
              cardIndex={cardIndex}
              renderCard={(brand) => (
                <ProfileCard data={brand} type="brand" overlayLabel={overlayLabel} />
              )}
              onSwipedRight={(index) => { setOverlayLabel('LIKE'); handleLike(index); }}
              onSwipedLeft={(index) => { setOverlayLabel('PASS'); handlePass(index); }}
              onSwiped={handleSwiped}
              onSwipedAll={() => setCardIndex(brands.length)}
              backgroundColor="transparent"
              stackSize={3}
              stackSeparation={12}
              stackScale={4}
              cardVerticalMargin={0}
              cardHorizontalMargin={0}
              useViewOverflow={false}
              animateCardOpacity
              swipeBackCard
              containerStyle={styles.swiperInner}
              cardStyle={styles.cardStyle}
              overlayLabels={{
                left: {
                  title: 'PASS',
                  style: {
                    label: { backgroundColor: 'transparent', borderColor: '#E84B78', color: '#E84B78', borderWidth: 2.5, fontSize: 20, fontWeight: '900', padding: 8, borderRadius: 8 },
                    wrapper: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', marginTop: 30, marginLeft: -30 },
                  },
                },
                right: {
                  title: 'LIKE',
                  style: {
                    label: { backgroundColor: 'transparent', borderColor: '#12C99F', color: '#12C99F', borderWidth: 2.5, fontSize: 20, fontWeight: '900', padding: 8, borderRadius: 8 },
                    wrapper: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', marginTop: 30, marginLeft: 30 },
                  },
                },
              }}
            />
          )}
        </View>

        {/* Action buttons */}
        {!loading && !isEmpty && (
          <View style={styles.actionBar}>
            {/* Pass */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.passBtn]}
              onPress={() => swiperRef.current?.swipeLeft()}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={26} color="#E84B78" />
            </TouchableOpacity>

            {/* Super Like */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.superBtn]}
              onPress={() => {}}
              activeOpacity={0.85}
            >
              <Ionicons name="star" size={20} color="#F5A623" />
            </TouchableOpacity>

            {/* Like */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.likeBtn]}
              onPress={() => swiperRef.current?.swipeRight()}
              activeOpacity={0.85}
            >
              <Ionicons name="heart" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FilterModal visible={filterVisible} filters={filters} onApply={applyFilters} onClose={() => setFilterVisible(false)} />

      <MatchModal
        visible={matchModalVisible}
        modelName={profile?.full_name ?? 'You'}
        brandName={matchedBrand?.brandName ?? ''}
        modelPhoto={modelProfile?.profile_image_url ?? null}
        brandLogo={matchedBrand?.logoUrl ?? null}
        onMessage={() => { setMatchModalVisible(false); navigation.navigate('Messages'); }}
        onContinue={() => setMatchModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK,
  },
  safeHeader: {
    backgroundColor: DARK,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.38)',
    fontWeight: '500',
    marginTop: 2,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  filterBtnActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  filterDot: {
    position: 'absolute',
    top: 8, right: 8,
    width: 7, height: 7,
    borderRadius: 4,
    backgroundColor: '#E84B78',
  },

  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
  },
  swiperArea: {
    flex: 1,
    paddingTop: 16,
  },
  swiperInner: {
    flex: 1,
  },
  cardStyle: {
    top: 0, left: 0, right: 0, bottom: 0,
  },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EDE8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: PURPLE,
    marginTop: 4,
  },
  refreshBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PURPLE,
  },

  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  passBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(232,75,120,0.3)',
  },
  superBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: DARK,
  },
  likeBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: DARK,
  },
});

const fStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: H * 0.82,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 10, marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '800', color: DARK },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    marginBottom: 10, marginTop: 4,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  rangeRow: {
    flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap',
  },
  chipsWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 13, paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1.5, borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: DARK, borderColor: DARK,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextSelected: { color: '#FFFFFF' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border, marginBottom: 8,
  },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: DARK },
  footer: {
    flexDirection: 'row', gap: 12,
    paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border,
  },
  resetBtn: {
    flex: 1, height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1.5, borderColor: colors.border,
  },
  resetBtnText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  applyBtn: {
    flex: 2, height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: DARK,
  },
  applyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
