import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList, Image, Linking, SafeAreaView, ScrollView,
  StyleSheet, Text, TouchableOpacity, View, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { colors } from '../../theme/colors';
import { supabase } from '../../utils/supabase';
import PrimaryButton from '../../components/PrimaryButton';
import PortfolioGrid from '../../components/PortfolioGrid';

const DARK = '#0D0B1F';

function getInitials(name = '') {
  return name.trim().split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function StarRow({ rating = 0 }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= Math.round(rating) ? 'star' : 'star-outline'} size={13} color={colors.warning} />
      ))}
      {rating > 0 && <Text style={styles.ratingNum}>{rating}</Text>}
    </View>
  );
}

function SectionCard({ title, children, action, onAction }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
        {action && (
          <TouchableOpacity onPress={onAction}>
            <Text style={styles.sectionAction}>{action}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

function PastCampaignsGrid({ images }) {
  if (!images || images.length === 0) {
    return (
      <View style={styles.noImgWrap}>
        <Ionicons name="images-outline" size={28} color={colors.textLight} />
        <Text style={styles.noImgText}>No past campaigns yet</Text>
      </View>
    );
  }
  return (
    <View style={styles.campaignGrid}>
      {images.map((img, i) => (
        <Image key={i} source={{ uri: img }} style={styles.campaignImg} resizeMode="cover" />
      ))}
    </View>
  );
}

function ReviewItem({ review }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewTop}>
        <Text style={styles.reviewerName}>{review.reviewer_name ?? 'Anonymous'}</Text>
        <View style={{ flexDirection: 'row', gap: 2 }}>
          {[1,2,3,4,5].map((i) => (
            <Ionicons key={i} name={i <= Math.round(review.rating) ? 'star' : 'star-outline'} size={11} color={colors.warning} />
          ))}
        </View>
      </View>
      {review.review_text ? <Text style={styles.reviewText}>{review.review_text}</Text> : null}
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const { profile, modelProfile, brandProfile } = useUser();

  const [portfolioImages, setPortfolioImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ shoots: 0, earnings: 0, rating: 0 });
  const [loading, setLoading] = useState(true);

  const userType = profile?.user_type ?? 'model';

  const loadExtras = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (userType === 'model') {
        const { data: imgs } = await supabase
          .from('portfolio_images').select('id, image_url, category')
          .eq('model_id', user.id).order('created_at', { ascending: false });
        setPortfolioImages(imgs ?? []);
      }
      const { data: rvws } = await supabase
        .from('reviews').select('id, rating, review_text, reviewer_name, created_at')
        .eq('reviewee_id', user.id).order('created_at', { ascending: false }).limit(10);
      setReviews(rvws ?? []);

      const col = userType === 'model' ? 'model_id' : 'brand_id';
      const { data: bkgs } = await supabase.from('bookings').select('id, payment_amount, status').eq(col, user.id);
      const completed = (bkgs ?? []).filter((b) => b.status === 'completed');
      const total = completed.reduce((s, b) => s + (b.payment_amount ?? 0), 0);
      const avgRating = (rvws ?? []).length > 0
        ? parseFloat((rvws.reduce((s, r) => s + (r.rating ?? 0), 0) / rvws.length).toFixed(1))
        : 0;
      setStats({ shoots: completed.length, earnings: total, rating: avgRating });
    } catch (err) {
      console.error('ProfileScreen loadExtras error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user, userType]);

  useEffect(() => { loadExtras(); }, [loadExtras]);

  const displayName = profile?.full_name ?? 'Your Name';
  const bio = userType === 'model' ? modelProfile?.bio ?? '' : brandProfile?.bio ?? '';
  const location = profile?.location ?? '';
  const isVerified = profile?.verified ?? false;
  const instagramHandle = userType === 'model' ? modelProfile?.instagram : brandProfile?.instagram;
  const categories = userType === 'model' ? modelProfile?.categories ?? [] : brandProfile?.categories ?? [];
  const rates = userType === 'model' ? modelProfile?.rates ?? '' : null;
  const earningsLabel = userType === 'model' ? 'Earned' : 'Spent';
  const formattedEarnings = stats.earnings >= 1000
    ? `₹${(stats.earnings / 1000).toFixed(1)}k`
    : `₹${stats.earnings}`;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Dark editorial hero ─────────────────────────── */}
        <View style={styles.hero}>
          {/* Settings button */}
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('SettingsScreen')}
          >
            <Ionicons name="settings-outline" size={19} color="rgba(255,255,255,0.65)" />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {profile?.profile_image_url ? (
              <Image source={{ uri: profile.profile_image_url }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editOverlay}
              onPress={() => navigation.navigate('EditProfileScreen')}
              activeOpacity={0.85}
            >
              <Ionicons name="camera" size={13} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Name + verified */}
          <View style={styles.heroNameRow}>
            <Text style={styles.heroName}>{displayName}</Text>
            {isVerified && (
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            )}
          </View>
          <StarRow rating={stats.rating} />
          {location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.4)" />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          ) : null}

          {/* Stats strip */}
          <View style={styles.statsRow}>
            {[
              { value: stats.shoots,          label: 'SHOOTS' },
              { value: formattedEarnings,      label: earningsLabel.toUpperCase() },
              { value: stats.rating > 0 ? stats.rating : '—', label: 'RATING' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={styles.statDivider} />}
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── White content sections ────────────────────── */}
        <View style={styles.contentArea}>
          {/* Portfolio (model) */}
          {userType === 'model' && (
            <SectionCard title="Portfolio" action="Add Photos" onAction={() => navigation.navigate('AddPhotosScreen')}>
              <PortfolioGrid images={portfolioImages} editable={false} />
            </SectionCard>
          )}

          {/* Past campaigns (brand) */}
          {userType === 'brand' && (
            <SectionCard title="Past Campaigns">
              <PastCampaignsGrid images={brandProfile?.campaign_images ?? []} />
            </SectionCard>
          )}

          {/* About */}
          <SectionCard title="About">
            {bio ? <Text style={styles.bioText}>{bio}</Text> : (
              <Text style={styles.emptyBio}>No bio added yet</Text>
            )}
            {categories.length > 0 && (
              <View style={styles.chipsWrap}>
                {categories.map((c, i) => (
                  <View key={i} style={styles.chip}><Text style={styles.chipText}>{c}</Text></View>
                ))}
              </View>
            )}
            {instagramHandle ? (
              <TouchableOpacity
                style={styles.igRow}
                onPress={() => Linking.openURL(`https://instagram.com/${instagramHandle}`)}
              >
                <Ionicons name="logo-instagram" size={15} color="#E1306C" />
                <Text style={styles.igText}>@{instagramHandle}</Text>
              </TouchableOpacity>
            ) : null}
          </SectionCard>

          {/* Rates (model) */}
          {userType === 'model' && rates ? (
            <SectionCard title="Rates">
              <Text style={styles.ratesText}>{rates}</Text>
            </SectionCard>
          ) : null}

          {/* Brand info */}
          {userType === 'brand' && brandProfile ? (
            <SectionCard title="Brand Info">
              {brandProfile.brand_name ? <Text style={styles.ratesText}>Brand: {brandProfile.brand_name}</Text> : null}
              {brandProfile.industry ? <Text style={styles.ratesText}>Industry: {brandProfile.industry}</Text> : null}
              {brandProfile.website ? (
                <TouchableOpacity onPress={() => Linking.openURL(brandProfile.website)}>
                  <Text style={[styles.ratesText, { color: colors.primary }]}>{brandProfile.website}</Text>
                </TouchableOpacity>
              ) : null}
            </SectionCard>
          ) : null}

          {/* Reviews */}
          {reviews.length > 0 && (
            <SectionCard title="Reviews">
              {reviews.map((r) => <ReviewItem key={r.id} review={r} />)}
            </SectionCard>
          )}

          {/* Actions */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfileScreen')}
            activeOpacity={0.88}
          >
            <Ionicons name="pencil-outline" size={17} color={DARK} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={17} color={colors.error} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK },
  scrollContent: { paddingBottom: 48 },

  /* Hero */
  hero: {
    backgroundColor: DARK, alignItems: 'center',
    paddingTop: 14, paddingBottom: 28, paddingHorizontal: 20, gap: 10,
  },
  settingsBtn: {
    alignSelf: 'flex-end', width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  avatarWrap: { position: 'relative', marginBottom: 6 },
  avatar: {
    width: 110, height: 110, borderRadius: 34,
    backgroundColor: colors.primaryPale,
  },
  avatarFallback: {
    width: 110, height: 110, borderRadius: 34,
    backgroundColor: 'rgba(120,86,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(120,86,255,0.3)',
  },
  avatarInitials: { fontSize: 40, fontWeight: '800', color: '#FFFFFF' },
  editOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: DARK,
  },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  heroName: {
    fontSize: 26, fontWeight: '900', color: '#FFFFFF',
    textAlign: 'center', letterSpacing: -0.6,
  },
  starRow: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  ratingNum: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginLeft: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },

  statsRow: {
    flexDirection: 'row', width: '100%', marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18, paddingVertical: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.6 },
  statLabel: {
    fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.8,
  },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 4 },

  /* Content area */
  contentArea: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 26, borderTopRightRadius: 26, marginTop: -26,
    paddingTop: 8, paddingBottom: 20, gap: 12,
  },

  /* Section card */
  sectionCard: {
    backgroundColor: colors.surface, marginHorizontal: 16,
    borderRadius: 22, padding: 20, gap: 14,
    shadowColor: '#0D0B1F', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionAccent: { width: 3, height: 14, borderRadius: 2, backgroundColor: colors.primary },
  sectionTitle: {
    flex: 1, fontSize: 11, fontWeight: '800', color: colors.textPrimary,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  sectionAction: { fontSize: 13, fontWeight: '600', color: colors.primary },

  bioText: { fontSize: 14, color: colors.textPrimary, lineHeight: 22 },
  emptyBio: { fontSize: 14, color: colors.textLight, fontStyle: 'italic' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: colors.primaryPale, borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  igRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  igText: { fontSize: 13, color: '#E1306C', fontWeight: '600' },
  ratesText: { fontSize: 14, color: colors.textPrimary, lineHeight: 21 },

  noImgWrap: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  noImgText: { fontSize: 13, color: colors.textLight },
  campaignGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  campaignImg: { width: '31%', aspectRatio: 1, borderRadius: 10, backgroundColor: colors.border },

  reviewCard: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.background, gap: 4 },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  reviewText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },

  /* Buttons */
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingVertical: 15, borderWidth: 1.5, borderColor: colors.border,
    shadowColor: '#0D0B1F', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  editBtnText: { fontSize: 15, fontWeight: '700', color: DARK },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, paddingVertical: 15, borderRadius: 16,
    borderWidth: 1.5, borderColor: 'rgba(232,75,120,0.25)',
    backgroundColor: 'rgba(232,75,120,0.04)',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.error },
});
