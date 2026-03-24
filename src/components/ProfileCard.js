import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: W, height: H } = Dimensions.get('window');
const CARD_W = W - 48;
const CARD_H = H * 0.66;

const DARK = '#0D0B1F';
const PURPLE = '#7856FF';

const CARD_PALETTES = [
  { bg: '#0D0B1F', accent: '#A689FF' },
  { bg: '#1A0A2E', accent: '#7856FF' },
  { bg: '#0B1A1A', accent: '#12C99F' },
  { bg: '#1A0B14', accent: '#E84B78' },
  { bg: '#0D1118', accent: '#F5A623' },
];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatCurrency(amount) {
  if (amount == null) return '—';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function hashId(id) {
  if (!id) return 0;
  let h = 0;
  const str = String(id);
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) % CARD_PALETTES.length;
  }
  return h;
}

export default function ProfileCard({ data, type, overlayLabel }) {
  if (!data) return null;

  const isModel = type === 'model';
  const displayName = isModel ? data.name : data.brandName;
  const hasImage = isModel ? !!data.profileImageUrl : !!data.logoUrl;
  const imageUri = isModel ? data.profileImageUrl : data.logoUrl;

  const palette = CARD_PALETTES[hashId(data.id)];

  const overlayIsLike = overlayLabel === 'LIKE';
  const overlayIsPass = overlayLabel === 'PASS';

  const chips = isModel ? (data.categories ?? []) : (data.brandIdentity ?? []);

  const rateText = isModel
    ? (data.rateHalfDay ? formatCurrency(data.rateHalfDay) + ' / day' : null)
    : (data.budgetMin ? formatCurrency(data.budgetMin) + ' – ' + formatCurrency(data.budgetMax) : null);

  return (
    <View style={styles.card}>
      {/* Image or Editorial Placeholder */}
      {hasImage ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: palette.bg }]}>
          <View style={[styles.gridLine, { left: '25%' }]} />
          <View style={[styles.gridLine, { left: '50%' }]} />
          <View style={[styles.gridLine, { left: '75%' }]} />
          <Text style={[styles.monogram, { color: palette.accent }]}>
            {getInitials(displayName)}
          </Text>
          {data.bio ? (
            <Text style={[styles.bioQuote, { color: palette.accent + 'BB' }]} numberOfLines={2}>
              "{data.bio}"
            </Text>
          ) : null}
        </View>
      )}

      {/* Gradient scrim layers */}
      <View style={styles.scrim1} pointerEvents="none" />
      <View style={styles.scrim2} pointerEvents="none" />
      <View style={styles.scrim3} pointerEvents="none" />

      {/* Verified badge */}
      <View style={styles.verifiedBadge}>
        <Ionicons name="checkmark-circle" size={16} color={PURPLE} />
      </View>

      {/* Info overlay */}
      <View style={styles.infoOverlay} pointerEvents="none">
        <View style={styles.nameRow}>
          <Text style={styles.nameText} numberOfLines={1}>
            {displayName}
            {isModel && data.age ? <Text style={styles.ageText}>  {data.age}</Text> : null}
          </Text>
          {rateText ? (
            <View style={styles.ratePill}>
              <Text style={styles.rateText}>{rateText}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location" size={11} color="rgba(255,255,255,0.55)" />
          <Text style={styles.locationText}>
            {data.city ?? '—'}
            {isModel && data.experience ? `  ·  ${data.experience} yrs` : ''}
            {!isModel && data.brandType ? `  ·  ${data.brandType}` : ''}
          </Text>
        </View>

        {chips.length > 0 ? (
          <View style={styles.chipsRow}>
            {chips.slice(0, 3).map((c, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>{c}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* Swipe overlays */}
      {overlayIsLike ? (
        <View style={[styles.overlayLabel, styles.overlayLike]}>
          <Text style={styles.overlayLikeText}>LIKE</Text>
        </View>
      ) : null}
      {overlayIsPass ? (
        <View style={[styles.overlayLabel, styles.overlayPass]}>
          <Text style={styles.overlayPassText}>PASS</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 24,
    overflow: 'hidden',
    alignSelf: 'center',
    backgroundColor: DARK,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  image: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%',
    height: '100%',
  },
  placeholder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  gridLine: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  monogram: {
    fontSize: 88,
    fontWeight: '900',
    letterSpacing: -4,
    marginBottom: 14,
    opacity: 0.9,
  },
  bioQuote: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '400',
  },

  scrim1: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: CARD_H * 0.55,
    backgroundColor: 'rgba(13,11,31,0.10)',
  },
  scrim2: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: CARD_H * 0.38,
    backgroundColor: 'rgba(13,11,31,0.45)',
  },
  scrim3: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: CARD_H * 0.22,
    backgroundColor: 'rgba(13,11,31,0.65)',
  },

  verifiedBadge: {
    position: 'absolute',
    top: 16, right: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    padding: 5,
  },

  infoOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    flex: 1,
  },
  ageText: {
    fontSize: 18,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.65)',
  },
  ratePill: {
    backgroundColor: PURPLE,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },

  overlayLabel: {
    position: 'absolute',
    top: 28,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 2.5,
  },
  overlayLike: {
    left: 20,
    borderColor: '#12C99F',
    backgroundColor: 'rgba(18,201,159,0.1)',
    transform: [{ rotate: '-12deg' }],
  },
  overlayPass: {
    right: 20,
    borderColor: '#E84B78',
    backgroundColor: 'rgba(232,75,120,0.1)',
    transform: [{ rotate: '12deg' }],
  },
  overlayLikeText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#12C99F',
    letterSpacing: 2,
  },
  overlayPassText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#E84B78',
    letterSpacing: 2,
  },
});
