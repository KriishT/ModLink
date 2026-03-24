import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Modal, ScrollView, FlatList, Dimensions,
  Alert, ActivityIndicator, SafeAreaView, TextInput, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-deck-swiper';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../utils/supabase';
import MatchModal from '../../components/MatchModal';

const { width: W, height: H } = Dimensions.get('window');
const CARD_W = W - 32;
const CARD_H = H * 0.70;
const DARK    = '#0D0B1F';

const MOCK_MODELS = [
  { id: 'm1', name: 'Aanya Sharma', city: 'Mumbai',    experience: 'Experienced',  height: "5'7\"", categories: ['Fashion', 'Lifestyle', 'Luxury'],           rating: 4.8, rate: 8000,  bio: 'High-fashion model with 4+ years in editorial and campaign work.', profileImageUrl: null, portfolioImages: [] },
  { id: 'm2', name: 'Priya Nair',   city: 'Bangalore', experience: 'Intermediate', height: "5'5\"", categories: ['E-commerce', 'Beauty', 'Minimalist'],         rating: 4.6, rate: 6500,  bio: 'Clean, editorial aesthetic. Specialise in beauty and product photography.', profileImageUrl: null, portfolioImages: [] },
  { id: 'm3', name: 'Rhea Kapoor',  city: 'Delhi',     experience: 'Experienced',  height: "5'9\"", categories: ['Streetwear', 'Campaign', 'Edgy'],              rating: 4.9, rate: 12000, bio: 'Bold, confident model known for streetwear campaigns and brand storytelling.', profileImageUrl: null, portfolioImages: [] },
  { id: 'm4', name: 'Meera Joshi',  city: 'Pune',      experience: 'Beginner',     height: "5'4\"", categories: ['Lookbook', 'Catalog', 'Traditional'],          rating: 4.5, rate: 5000,  bio: 'Fresh talent with a warm aesthetic perfect for ethnic wear and catalog shoots.', profileImageUrl: null, portfolioImages: [] },
  { id: 'm5', name: 'Zara Khan',    city: 'Hyderabad', experience: 'Experienced',  height: "5'8\"", categories: ['Sustainable', 'Contemporary', 'Fashion'],      rating: 4.7, rate: 9000,  bio: 'Advocate for sustainable fashion. Works with eco-conscious brands.', profileImageUrl: null, portfolioImages: [] },
];

const EXPERIENCE_LEVELS = ['Any', 'Beginner', 'Intermediate', 'Experienced'];
const CATEGORY_OPTIONS  = ['Fashion', 'Lifestyle', 'E-commerce', 'Beauty', 'Streetwear', 'Campaign', 'Lookbook', 'Catalog', 'Sustainable', 'Traditional', 'Contemporary'];

// Palette for the editorial placeholder cards when there's no photo
const CARD_PALETTES = [
  { bg: '#0D0B1F', text: '#A689FF' },
  { bg: '#1A0A2E', text: '#7856FF' },
  { bg: '#0B1A1A', text: '#12C99F' },
  { bg: '#1A0B14', text: '#E84B78' },
  { bg: '#0D1118', text: '#F5A623' },
];

function getInitials(name = '') {
  return name.trim().split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function getPalette(id) {
  const idx = id ? id.charCodeAt(id.length - 1) % CARD_PALETTES.length : 0;
  return CARD_PALETTES[idx];
}

// ── Swipe card ────────────────────────────────────────────────────────────────

function ModelSwipeCard({ model, onLongPress }) {
  const palette = getPalette(model.id);
  const shownCats = model.categories?.slice(0, 3) ?? [];
  const extraCats = (model.categories?.length ?? 0) - 3;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={1}
      onLongPress={onLongPress}
      delayLongPress={350}
    >
      {/* ── Background: photo or editorial placeholder ── */}
      {model.profileImageUrl ? (
        <Image source={{ uri: model.profileImageUrl }} style={styles.cardBg} resizeMode="cover" />
      ) : (
        <View style={[styles.cardBg, { backgroundColor: palette.bg }]}>
          {/* Decorative grid lines */}
          <View style={styles.gridH} />
          <View style={[styles.gridH, { top: '65%' }]} />
          <View style={styles.gridV} />
          <View style={[styles.gridV, { left: '65%' }]} />
          {/* Monogram */}
          <View style={styles.monogramWrap}>
            <Text style={[styles.monogram, { color: palette.text }]}>{getInitials(model.name)}</Text>
          </View>
          {/* Subtle bio text */}
          <View style={styles.bioQuoteWrap}>
            <Text style={styles.bioQuote} numberOfLines={2}>"{model.bio}"</Text>
          </View>
        </View>
      )}

      {/* ── Top badges ── */}
      <View style={styles.cardTopRow}>
        <View style={styles.expBadge}>
          <Text style={styles.expBadgeText}>{model.experience}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={10} color={colors.warning} />
          <Text style={styles.ratingBadgeText}>{model.rating?.toFixed(1)}</Text>
        </View>
      </View>

      {/* ── Bottom scrim layers (gradient simulation) ── */}
      <View style={styles.scrim1} pointerEvents="none" />
      <View style={styles.scrim2} pointerEvents="none" />
      <View style={styles.scrim3} pointerEvents="none" />

      {/* ── Bottom info overlay ── */}
      <View style={styles.cardInfo}>
        {/* Name + rate */}
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName} numberOfLines={1}>{model.name}</Text>
          <View style={styles.rateTag}>
            <Text style={styles.rateTagText}>
              ₹{Number(model.rate || 0).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.rateTagSub}>/day</Text>
          </View>
        </View>

        {/* Location + height */}
        <View style={styles.cardMetaRow}>
          <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.55)" />
          <Text style={styles.cardMetaText}>{model.city} · {model.height}</Text>
        </View>

        {/* Category chips */}
        <View style={styles.cardChips}>
          {shownCats.map((cat) => (
            <View key={cat} style={styles.cardChip}>
              <Text style={styles.cardChipText}>{cat}</Text>
            </View>
          ))}
          {extraCats > 0 && (
            <View style={[styles.cardChip, styles.cardChipMore]}>
              <Text style={styles.cardChipText}>+{extraCats}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Portfolio hint */}
      <View style={styles.holdHint}>
        <Ionicons name="images-outline" size={11} color="rgba(255,255,255,0.4)" />
        <Text style={styles.holdHintText}>Hold to view portfolio</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function BrandDiscoverScreen({ navigation }) {
  const { user }         = useAuth();
  const { brandProfile } = useUser();

  const swiperRef = useRef(null);

  const [models,           setModels]           = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [cardIndex,        setCardIndex]        = useState(0);
  const [portfolioVisible, setPortfolioVisible] = useState(false);
  const [portfolioModel,   setPortfolioModel]   = useState(null);
  const [matchVisible,     setMatchVisible]     = useState(false);
  const [matchedModel,     setMatchedModel]     = useState(null);
  const [filterVisible,    setFilterVisible]    = useState(false);
  const [filters, setFilters] = useState({
    budgetMin: '', budgetMax: '', location: '',
    experience: 'Any', categories: [], heightMin: '', heightMax: '',
  });

  useEffect(() => { fetchModels(); }, []);

  const fetchModels = async () => {
    setLoading(true);
    setCardIndex(0);
    try {
      const { data, error } = await supabase
        .from('model_profiles')
        .select(`id, categories, rate_half_day, rate_full_day, bio, height, experience_level,
          profiles(full_name, profile_image_url, city, average_rating, total_reviews),
          portfolio_images(image_url)`)
        .limit(30);

      if (error || !data?.length) { setModels(MOCK_MODELS); return; }
      setModels(data.map((mp) => ({
        id:              mp.id,
        name:            mp.profiles?.full_name ?? 'Model',
        profileImageUrl: mp.profiles?.profile_image_url ?? null,
        categories:      mp.categories || [],
        rate:            mp.rate_half_day || mp.rate_full_day || 0,
        city:            mp.profiles?.city || '—',
        rating:          mp.profiles?.average_rating || 0,
        bio:             mp.bio || '',
        height:          mp.height || '—',
        experience:      mp.experience_level || 'Any',
        portfolioImages: (mp.portfolio_images || []).map((p) => p.image_url),
      })));
    } catch { setModels(MOCK_MODELS); }
    finally { setLoading(false); }
  };

  const handleLike = async (index) => {
    const model = models[index];
    if (!model || !user) return;
    try {
      await supabase.from('swipes').insert({ swiper_id: user.id, target_id: model.id, direction: 'right', swiper_type: 'brand' });
      const { data: existing } = await supabase.from('swipes').select('id').eq('swiper_id', model.id).eq('target_id', user.id).eq('direction', 'right').single();
      if (existing) { setMatchedModel(model); setMatchVisible(true); }
    } catch {}
  };

  const handlePass = async (index) => {
    const model = models[index];
    if (!model || !user) return;
    try {
      await supabase.from('swipes').insert({ swiper_id: user.id, target_id: model.id, direction: 'left', swiper_type: 'brand' });
    } catch {}
  };

  const openPortfolio = (model) => { setPortfolioModel(model); setPortfolioVisible(true); };

  const currentModel = models[cardIndex];
  const isDepleted   = cardIndex >= models.length;

  const toggleFilterCategory = (cat) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* ── Dark editorial header ──────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Discover</Text>
          {!isDepleted && models.length > 0 && !loading && (
            <Text style={styles.headerCount}>{models.length - cardIndex} left</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons name="options-outline" size={17} color="rgba(255,255,255,0.7)" />
          <Text style={styles.filterBtnText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* ── Swiper area ───────────────────────────────── */}
      <View style={styles.swiperWrap}>
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.centerText}>Finding models…</Text>
          </View>
        ) : isDepleted || models.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="sparkles-outline" size={34} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>You've seen everyone!</Text>
            <Text style={styles.emptySubtitle}>Check back later or adjust your filters.</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchModels}>
              <Ionicons name="refresh" size={14} color="#fff" />
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Swiper
            ref={swiperRef}
            cards={models}
            cardIndex={cardIndex}
            renderCard={(model) =>
              model ? <ModelSwipeCard model={model} onLongPress={() => openPortfolio(model)} /> : null
            }
            onSwipedRight={(i) => { handleLike(i); setCardIndex(i + 1); }}
            onSwipedLeft={(i)  => { handlePass(i); setCardIndex(i + 1); }}
            onSwipedAll={() => setCardIndex(models.length)}
            backgroundColor="transparent"
            stackSize={3}
            stackScale={6}
            stackSeparation={14}
            cardVerticalMargin={0}
            cardHorizontalMargin={0}
            overlayLabels={{
              left: {
                title: 'PASS',
                style: {
                  label: { backgroundColor: colors.error, color: '#fff', fontSize: 20, fontWeight: '900', borderRadius: 10, padding: 10 },
                  wrapper: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', marginTop: 24, marginLeft: -24 },
                },
              },
              right: {
                title: 'LIKE',
                style: {
                  label: { backgroundColor: colors.success, color: '#fff', fontSize: 20, fontWeight: '900', borderRadius: 10, padding: 10 },
                  wrapper: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', marginTop: 24, marginLeft: 24 },
                },
              },
            }}
            animateCardOpacity
            disableTopSwipe
            disableBottomSwipe
          />
        )}
      </View>

      {/* ── Action buttons ────────────────────────────── */}
      {!loading && !isDepleted && models.length > 0 && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.passBtn]}
            onPress={() => swiperRef.current?.swipeLeft()}
            activeOpacity={0.85}
          >
            <Ionicons name="close" size={24} color={colors.error} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.viewBtn]}
            onPress={() => currentModel && openPortfolio(currentModel)}
            activeOpacity={0.85}
          >
            <Ionicons name="eye-outline" size={19} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.likeBtn]}
            onPress={() => swiperRef.current?.swipeRight()}
            activeOpacity={0.85}
          >
            <Ionicons name="heart" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Portfolio sheet ───────────────────────────── */}
      <Modal visible={portfolioVisible} animationType="slide" transparent onRequestClose={() => setPortfolioVisible(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayDismiss} onPress={() => setPortfolioVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>{portfolioModel?.name}</Text>
                <Text style={styles.sheetSub}>{(portfolioModel?.portfolioImages || []).length} portfolio images</Text>
              </View>
              <TouchableOpacity onPress={() => setPortfolioVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={17} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {(portfolioModel?.portfolioImages || []).length === 0 ? (
              <View style={styles.portfolioEmpty}>
                <Ionicons name="images-outline" size={32} color={colors.textLight} />
                <Text style={styles.portfolioEmptyText}>No portfolio images yet</Text>
              </View>
            ) : (
              <FlatList
                data={portfolioModel?.portfolioImages || []}
                keyExtractor={(_, idx) => idx.toString()}
                numColumns={3}
                contentContainerStyle={styles.portfolioGrid}
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={styles.portfolioThumb} resizeMode="cover" />
                )}
              />
            )}

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.sheetPassBtn} onPress={() => { setPortfolioVisible(false); swiperRef.current?.swipeLeft(); }}>
                <Ionicons name="close" size={16} color={colors.error} />
                <Text style={styles.sheetPassText}>Pass</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetLikeBtn} onPress={() => { setPortfolioVisible(false); swiperRef.current?.swipeRight(); }}>
                <Ionicons name="heart" size={16} color="#fff" />
                <Text style={styles.sheetLikeText}>Like Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Filter sheet ──────────────────────────────── */}
      <Modal visible={filterVisible} animationType="slide" transparent onRequestClose={() => setFilterVisible(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayDismiss} onPress={() => setFilterVisible(false)} />
          <View style={[styles.sheet, { maxHeight: H * 0.85 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={17} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.filterLabel}>Budget Range (₹/day)</Text>
              <View style={styles.filterRow}>
                <TextInput style={styles.filterInput} placeholder="Min" placeholderTextColor={colors.textLight} value={filters.budgetMin} onChangeText={(v) => setFilters((f) => ({ ...f, budgetMin: v }))} keyboardType="numeric" />
                <Text style={styles.filterSep}>—</Text>
                <TextInput style={styles.filterInput} placeholder="Max" placeholderTextColor={colors.textLight} value={filters.budgetMax} onChangeText={(v) => setFilters((f) => ({ ...f, budgetMax: v }))} keyboardType="numeric" />
              </View>

              <Text style={styles.filterLabel}>Location</Text>
              <View style={[styles.filterRow, { paddingHorizontal: 20 }]}>
                <TextInput style={[styles.filterInput, { flex: 1 }]} placeholder="City name" placeholderTextColor={colors.textLight} value={filters.location} onChangeText={(v) => setFilters((f) => ({ ...f, location: v }))} />
              </View>

              <Text style={styles.filterLabel}>Experience Level</Text>
              <View style={styles.chipsWrap}>
                {EXPERIENCE_LEVELS.map((lvl) => {
                  const sel = filters.experience === lvl;
                  return (
                    <TouchableOpacity key={lvl} style={[styles.filterChip, sel && styles.filterChipSel]} onPress={() => setFilters((f) => ({ ...f, experience: lvl }))}>
                      <Text style={[styles.filterChipText, sel && styles.filterChipTextSel]}>{lvl}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.filterLabel}>Categories</Text>
              <View style={styles.chipsWrap}>
                {CATEGORY_OPTIONS.map((cat) => {
                  const sel = filters.categories.includes(cat);
                  return (
                    <TouchableOpacity key={cat} style={[styles.filterChip, sel && styles.filterChipSel]} onPress={() => toggleFilterCategory(cat)}>
                      <Text style={[styles.filterChipText, sel && styles.filterChipTextSel]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.filterLabel}>Height Range (cm)</Text>
              <View style={styles.filterRow}>
                <TextInput style={styles.filterInput} placeholder="Min" placeholderTextColor={colors.textLight} value={filters.heightMin} onChangeText={(v) => setFilters((f) => ({ ...f, heightMin: v }))} keyboardType="numeric" />
                <Text style={styles.filterSep}>—</Text>
                <TextInput style={styles.filterInput} placeholder="Max" placeholderTextColor={colors.textLight} value={filters.heightMax} onChangeText={(v) => setFilters((f) => ({ ...f, heightMax: v }))} keyboardType="numeric" />
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.sheetPassBtn} onPress={() => setFilters({ budgetMin: '', budgetMax: '', location: '', experience: 'Any', categories: [], heightMin: '', heightMax: '' })}>
                <Text style={styles.sheetPassText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetLikeBtn} onPress={() => { setFilterVisible(false); fetchModels(); }}>
                <Text style={styles.sheetLikeText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Match modal */}
      <MatchModal
        visible={matchVisible}
        modelName={matchedModel?.name}
        brandName={brandProfile?.brand_name || 'Your Brand'}
        modelPhoto={matchedModel?.profileImageUrl}
        brandLogo={null}
        onMessage={() => { setMatchVisible(false); navigation.navigate('Chat', { modelId: matchedModel?.id }); }}
        onContinue={() => setMatchVisible(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
    backgroundColor: DARK,
  },
  headerLeft: { gap: 3 },
  headerTitle: {
    fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.8,
  },
  headerCount: {
    fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: 1,
  },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },

  /* Swiper */
  swiperWrap: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    marginTop: -20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
  },

  /* Card */
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 24,
    overflow: 'hidden',
    alignSelf: 'center',
    shadowColor: DARK,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 12,
  },
  cardBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },

  /* Placeholder card elements */
  gridH: {
    position: 'absolute', left: 0, right: 0, top: '35%',
    height: 1, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  gridV: {
    position: 'absolute', top: 0, bottom: 0, left: '35%',
    width: 1, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  monogramWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 80,
    alignItems: 'center', justifyContent: 'center',
  },
  monogram: {
    fontSize: 88, fontWeight: '900', letterSpacing: -4, opacity: 0.9,
  },
  bioQuoteWrap: {
    position: 'absolute', bottom: 100, left: 20, right: 20,
  },
  bioQuote: {
    fontSize: 13, color: 'rgba(255,255,255,0.25)',
    fontStyle: 'italic', lineHeight: 20, textAlign: 'center',
  },

  /* Top badges */
  cardTopRow: {
    position: 'absolute', top: 16, left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  expBadge: {
    backgroundColor: 'rgba(120,86,255,0.8)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  expBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.4 },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  ratingBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  /* Gradient scrim — three layered views from transparent to solid */
  scrim1: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: CARD_H * 0.55,
    backgroundColor: 'rgba(13,11,31,0.15)',
  },
  scrim2: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: CARD_H * 0.38,
    backgroundColor: 'rgba(13,11,31,0.45)',
  },
  scrim3: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: CARD_H * 0.22,
    backgroundColor: 'rgba(13,11,31,0.7)',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },

  /* Card info overlay */
  cardInfo: {
    position: 'absolute', bottom: 44, left: 0, right: 0,
    paddingHorizontal: 20, gap: 8,
  },
  cardNameRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  cardName: {
    fontSize: 26, fontWeight: '900', color: '#FFFFFF',
    letterSpacing: -0.6, flex: 1, marginRight: 12,
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  rateTag: {
    backgroundColor: 'rgba(120,86,255,0.9)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    alignItems: 'center',
  },
  rateTagText: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: -0.4 },
  rateTagSub:  { fontSize: 9,  fontWeight: '500', color: 'rgba(255,255,255,0.7)' },

  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetaText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  cardChips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  cardChip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  cardChipMore: { backgroundColor: 'rgba(120,86,255,0.3)', borderColor: 'rgba(120,86,255,0.4)' },
  cardChipText: { fontSize: 11, fontWeight: '600', color: '#fff' },

  holdHint: {
    position: 'absolute', bottom: 16, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  holdHintText: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },

  /* Action buttons */
  actionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 16, paddingVertical: 18, paddingBottom: 28,
    backgroundColor: colors.background,
  },
  actionBtn: { alignItems: 'center', justifyContent: 'center' },
  passBtn: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: 'rgba(232,75,120,0.25)',
    shadowColor: colors.error, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },
  viewBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: DARK,
    shadowColor: DARK, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  likeBtn: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: DARK,
    shadowColor: DARK, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },

  /* Center states */
  centerState: {
    alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32,
  },
  centerText: { fontSize: 15, color: colors.textSecondary, marginTop: 8 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 26,
    backgroundColor: colors.primaryPale, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: colors.textPrimary, letterSpacing: -0.5 },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: DARK, borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 4,
  },
  refreshBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  /* Bottom sheet */
  overlay: { flex: 1, backgroundColor: 'rgba(13,11,31,0.6)', justifyContent: 'flex-end' },
  overlayDismiss: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: 32, maxHeight: H * 0.75,
  },
  sheetHandle: {
    width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2,
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3 },
  sheetSub:   { fontSize: 12, color: colors.textLight, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },

  portfolioEmpty: {
    alignItems: 'center', justifyContent: 'center', padding: 48, gap: 10,
  },
  portfolioEmptyText: { fontSize: 14, color: colors.textLight },
  portfolioGrid: { padding: 4 },
  portfolioThumb: {
    width: (W - 8) / 3, height: (W - 8) / 3,
    margin: 2, borderRadius: 8,
  },

  sheetActions: {
    flexDirection: 'row', padding: 20, gap: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  sheetPassBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.border,
  },
  sheetPassText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  sheetLikeBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 14, borderRadius: 14, backgroundColor: DARK,
  },
  sheetLikeText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  /* Filters */
  filterLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 10, marginTop: 20, paddingHorizontal: 20,
  },
  filterRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, gap: 10,
  },
  filterInput: {
    flex: 1, height: 46, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, fontSize: 14,
    color: colors.textPrimary, backgroundColor: colors.background,
  },
  filterSep: { fontSize: 16, color: colors.textLight },
  chipsWrap: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 20, gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border,
  },
  filterChipSel: { backgroundColor: DARK, borderColor: DARK },
  filterChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterChipTextSel: { color: '#FFFFFF' },
});
