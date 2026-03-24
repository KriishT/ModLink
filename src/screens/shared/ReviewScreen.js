import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { colors } from '../../theme/colors';
import { supabase } from '../../utils/supabase';
import PrimaryButton from '../../components/PrimaryButton';

// ─── constants ───────────────────────────────────────────────────────────────

const WORK_AGAIN_OPTIONS = ['Yes', 'No', 'Maybe'];

const MODEL_RATING_BRAND_CATEGORIES = [
  'Professionalism',
  'Communication',
  'Punctuality',
  'Payment',
];

const BRAND_RATING_MODEL_CATEGORIES = [
  'Professionalism',
  'Photo Quality',
  'Punctuality',
  'Creativity',
];

// ─── StarPicker ──────────────────────────────────────────────────────────────

function StarPicker({ rating, onChange, size = 32 }) {
  return (
    <View style={styles.starPicker}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} onPress={() => onChange(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={size}
            color={i <= rating ? '#FFB347' : colors.border}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── SubRating ────────────────────────────────────────────────────────────────

function SubRating({ label, rating, onChange }) {
  return (
    <View style={styles.subRatingRow}>
      <Text style={styles.subRatingLabel}>{label}</Text>
      <StarPicker rating={rating} onChange={onChange} size={20} />
    </View>
  );
}

// ─── RadioGroup ───────────────────────────────────────────────────────────────

function RadioGroup({ options, selected, onSelect }) {
  return (
    <View style={styles.radioGroup}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.radioBtn, selected === opt && styles.radioBtnActive]}
          onPress={() => onSelect(opt)}
          activeOpacity={0.8}
        >
          <Text style={[styles.radioBtnText, selected === opt && styles.radioBtnTextActive]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── screen ─────────────────────────────────────────────────────────────────

export default function ReviewScreen({ route, navigation }) {
  const { bookingId, otherName } = route.params ?? {};
  const { user } = useAuth();
  const { profile } = useUser();
  const userType = profile?.user_type ?? 'model';

  const [overallRating, setOverallRating] = useState(0);
  const [workAgain, setWorkAgain] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [subRatings, setSubRatings] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const categories =
    userType === 'model' ? MODEL_RATING_BRAND_CATEGORIES : BRAND_RATING_MODEL_CATEGORIES;

  const initSubRatings = useCallback(() => {
    const initial = {};
    categories.forEach((c) => { initial[c] = 0; });
    setSubRatings(initial);
  }, [userType]);

  useEffect(() => {
    initSubRatings();
  }, [initSubRatings]);

  const handleSubRatingChange = (label, value) => {
    setSubRatings((prev) => ({ ...prev, [label]: value }));
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert('Rating Required', 'Please select an overall star rating.');
      return;
    }
    setSubmitting(true);
    try {
      // Fetch booking to get reviewee_id
      const { data: booking, error: bErr } = await supabase
        .from('bookings')
        .select('model_id, brand_id')
        .eq('id', bookingId)
        .single();

      if (bErr) throw bErr;

      const revieweeId =
        userType === 'model' ? booking.brand_id : booking.model_id;

      // Insert review
      const { error: rErr } = await supabase.from('reviews').insert({
        booking_id: bookingId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        reviewer_name: profile?.full_name ?? 'Anonymous',
        rating: overallRating,
        review_text: reviewText.trim() || null,
        work_again: workAgain,
        sub_ratings: subRatings,
      });

      if (rErr) throw rErr;

      // Recalculate and update average rating on profiles
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', revieweeId);

      if (allReviews && allReviews.length > 0) {
        const avg =
          allReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / allReviews.length;
        await supabase
          .from('profiles')
          .update({ average_rating: parseFloat(avg.toFixed(2)) })
          .eq('id', revieweeId);
      }

      Alert.alert('Review Submitted!', 'Thank you for your feedback.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert('Skip Review?', 'You can always review later from the booking details.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Skip', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar + prompt */}
          <View style={styles.promptSection}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={32} color={colors.primary} />
            </View>
            <Text style={styles.promptText}>
              How was working with{' '}
              <Text style={styles.promptName}>{otherName ?? 'them'}</Text>?
            </Text>
          </View>

          {/* Overall star rating */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Overall Rating</Text>
            <StarPicker rating={overallRating} onChange={setOverallRating} size={40} />
            <Text style={styles.ratingHint}>
              {overallRating === 0
                ? 'Tap a star to rate'
                : overallRating === 5
                ? 'Excellent!'
                : overallRating === 4
                ? 'Very Good'
                : overallRating === 3
                ? 'Average'
                : overallRating === 2
                ? 'Below Average'
                : 'Poor'}
            </Text>
          </View>

          {/* Work again */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Would you work with them again?</Text>
            <RadioGroup
              options={WORK_AGAIN_OPTIONS}
              selected={workAgain}
              onSelect={setWorkAgain}
            />
          </View>

          {/* Sub-ratings */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Category Ratings</Text>
            {categories.map((cat) => (
              <SubRating
                key={cat}
                label={cat}
                rating={subRatings[cat] ?? 0}
                onChange={(v) => handleSubRatingChange(cat, v)}
              />
            ))}
          </View>

          {/* Review text */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>
              Written Review{' '}
              <Text style={styles.cardLabelOptional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.textarea}
              placeholder="Share your experience…"
              placeholderTextColor={colors.textLight}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{reviewText.length}/500</Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsWrap}>
            <PrimaryButton
              title="Submit Review"
              onPress={handleSubmit}
              loading={submitting}
            />
            <TouchableOpacity style={styles.skipLink} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  promptSection: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptText: {
    fontSize: 17,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
  },
  promptName: {
    fontWeight: '700',
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardLabelOptional: {
    fontWeight: '400',
    color: colors.textLight,
    fontSize: 13,
  },
  starPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingHint: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: -4,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  radioBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  radioBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  radioBtnTextActive: {
    color: colors.primary,
  },
  subRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subRatingLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  textarea: {
    height: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  charCount: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: -6,
  },
  actionsWrap: {
    gap: 12,
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
