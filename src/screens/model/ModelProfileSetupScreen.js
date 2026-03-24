import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Switch,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../utils/supabase';
import PrimaryButton from '../../components/PrimaryButton';
import InputField from '../../components/InputField';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMB_SIZE = (SCREEN_WIDTH - 48 - 16) / 3;

const HAIR_OPTIONS = ['Black', 'Brown', 'Blonde', 'Red', 'Grey', 'Other'];
const EYE_OPTIONS = ['Brown', 'Black', 'Blue', 'Green', 'Hazel'];
const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Experienced'];
const CATEGORY_OPTIONS = [
  'Streetwear', 'Editorial', 'Fitness', 'Commercial',
  'E-commerce', 'Runway', 'Lifestyle', 'Beauty',
];

function ProgressDots({ total, current }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < current ? styles.dotFilled : styles.dotEmpty,
          ]}
        />
      ))}
    </View>
  );
}

function ChipSelector({ options, selected, onToggle, multi = false }) {
  return (
    <View style={styles.chipsWrap}>
      {options.map((opt) => {
        const isSelected = multi
          ? selected.includes(opt)
          : selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onToggle(opt)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function ModelProfileSetupScreen({ navigation }) {
  const { user } = useAuth();
  const { profile, updateProfile, updateModelProfile } = useUser();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 – Basic Info
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [city, setCity] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [dob, setDob] = useState('');

  // Step 2 – Measurements
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [hairColor, setHairColor] = useState('');
  const [eyeColor, setEyeColor] = useState('');

  // Step 3 – Experience
  const [experience, setExperience] = useState('');
  const [categories, setCategories] = useState([]);
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');

  // Step 4 – Portfolio
  const [portfolioImages, setPortfolioImages] = useState([]);

  // Step 5 – Rates
  const [halfDayRate, setHalfDayRate] = useState('');
  const [fullDayRate, setFullDayRate] = useState('');
  const [openToOffers, setOpenToOffers] = useState(false);
  const [willingToTravel, setWillingToTravel] = useState(false);

  const TOTAL_STEPS = 5;

  const handleNextStep = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleCategory = (cat) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const pickPortfolioImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      setPortfolioImages((prev) => {
        const all = [...prev, ...result.assets];
        return all.slice(0, 20);
      });
    }
  };

  const removePortfolioImage = (index) => {
    setPortfolioImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    if (portfolioImages.length < 4) {
      Alert.alert('Portfolio required', 'Please upload at least 4 photos to complete your profile.');
      setStep(4);
      return;
    }

    setLoading(true);
    try {
      // full_name and city live on the profiles table, not model_profiles
      await updateProfile({
        full_name: fullName || profile?.full_name || '',
        city: city || null,
      });

      // All model-specific fields go to model_profiles
      // Column names match the DB schema exactly (no _cm suffix, no setup_complete)
      await updateModelProfile({
        height: heightCm ? parseInt(heightCm, 10) : null,
        date_of_birth: dob || null,
        bust: bust ? parseInt(bust, 10) : null,
        waist: waist ? parseInt(waist, 10) : null,
        hips: hips ? parseInt(hips, 10) : null,
        shoe_size: shoeSize ? parseInt(shoeSize, 10) : null,
        hair_color: hairColor || null,
        eye_color: eyeColor || null,
        experience_level: experience ? experience.toLowerCase() : null,
        categories: categories.length > 0 ? categories : null,
        bio: bio || null,
        instagram_handle: instagram || null,
        rate_half_day: halfDayRate ? parseInt(halfDayRate, 10) : null,
        rate_full_day: fullDayRate ? parseInt(fullDayRate, 10) : null,
        open_to_offers: openToOffers,
        willing_to_travel: willingToTravel,
        portfolio_complete: portfolioImages.length >= 4,
        available: true,
      });

      // Upload portfolio image URIs as records (without actual Supabase Storage for now)
      // In production these would be uploaded to Storage first
      const imageRows = portfolioImages.map((img, idx) => ({
        model_id: user.id,
        image_url: img.uri,
        is_primary: idx === 0,
      }));
      await supabase.from('portfolio_images').insert(imageRows);

      // Let RootNavigator handle the redirect — just go to verification
      navigation.navigate('ModelVerification');
    } catch (err) {
      Alert.alert('Error', err.message ?? 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = (title, subtitle) => (
    <View style={styles.stepHeader}>
      <TouchableOpacity
        onPress={handlePrevStep}
        style={styles.backBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {step > 1 ? (
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        ) : (
          <View style={{ width: 24 }} />
        )}
      </TouchableOpacity>
      <View style={styles.stepHeaderText}>
        <Text style={styles.stepLabel}>Step {step} of {TOTAL_STEPS}</Text>
        <Text style={styles.stepTitle}>{title}</Text>
        {subtitle ? <Text style={styles.stepSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );

  const renderStep1 = () => (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
      {renderHeader('Tell us about yourself', 'Let brands know who you are')}
      <InputField
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
        placeholder="Your full name"
        autoCapitalize="words"
      />
      <InputField
        label="City"
        value={city}
        onChangeText={setCity}
        placeholder="e.g. Mumbai, Delhi, Bangalore"
        autoCapitalize="words"
      />
      <InputField
        label="Height (cm)"
        value={heightCm}
        onChangeText={setHeightCm}
        placeholder="e.g. 170"
        keyboardType="numeric"
      />
      <InputField
        label="Date of Birth"
        value={dob}
        onChangeText={(text) => {
          // Strip everything except digits
          const digits = text.replace(/\D/g, '').slice(0, 8)
          let formatted = digits
          if (digits.length > 4) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
          } else if (digits.length > 2) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`
          }
          setDob(formatted)
        }}
        placeholder="DD/MM/YYYY"
        keyboardType="numeric"
        maxLength={10}
      />
      <View style={styles.navButtons}>
        <PrimaryButton title="Next" onPress={handleNextStep} />
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
      {renderHeader('Your measurements', 'Help brands find the right fit')}
      <View style={styles.rowInputs}>
        <InputField
          label="Bust (cm)"
          value={bust}
          onChangeText={setBust}
          placeholder="e.g. 86"
          keyboardType="numeric"
          style={styles.halfInput}
        />
        <InputField
          label="Waist (cm)"
          value={waist}
          onChangeText={setWaist}
          placeholder="e.g. 68"
          keyboardType="numeric"
          style={styles.halfInput}
        />
      </View>
      <View style={styles.rowInputs}>
        <InputField
          label="Hips (cm)"
          value={hips}
          onChangeText={setHips}
          placeholder="e.g. 92"
          keyboardType="numeric"
          style={styles.halfInput}
        />
        <InputField
          label="Shoe Size"
          value={shoeSize}
          onChangeText={setShoeSize}
          placeholder="e.g. 7"
          keyboardType="numeric"
          style={styles.halfInput}
        />
      </View>

      <Text style={styles.pickerLabel}>Hair Color</Text>
      <ChipSelector
        options={HAIR_OPTIONS}
        selected={hairColor}
        onToggle={(v) => setHairColor(v === hairColor ? '' : v)}
      />

      <Text style={styles.pickerLabel}>Eye Color</Text>
      <ChipSelector
        options={EYE_OPTIONS}
        selected={eyeColor}
        onToggle={(v) => setEyeColor(v === eyeColor ? '' : v)}
      />

      <View style={styles.navButtons}>
        <PrimaryButton title="Skip" onPress={handleNextStep} variant="secondary" style={styles.skipBtn} />
        <PrimaryButton title="Next" onPress={handleNextStep} style={styles.nextBtn} />
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
      {renderHeader('Your modeling journey', 'Share your background and interests')}

      <Text style={styles.pickerLabel}>Experience Level</Text>
      <View style={styles.radioGroup}>
        {EXPERIENCE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={styles.radioRow}
            onPress={() => setExperience(opt)}
            activeOpacity={0.7}
          >
            <View style={[styles.radioOuter, experience === opt && styles.radioOuterSelected]}>
              {experience === opt && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.pickerLabel}>Categories</Text>
      <ChipSelector
        options={CATEGORY_OPTIONS}
        selected={categories}
        onToggle={toggleCategory}
        multi
      />

      <Text style={styles.pickerLabel}>Bio</Text>
      <View style={styles.bioContainer}>
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={(t) => setBio(t.slice(0, 500))}
          placeholder="Tell brands a little about yourself, your style, and what makes you unique..."
          placeholderTextColor={colors.textLight}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{bio.length}/500</Text>
      </View>

      <InputField
        label="Instagram Handle (optional)"
        value={instagram}
        onChangeText={setInstagram}
        placeholder="@yourhandle"
        autoCapitalize="none"
      />

      <View style={styles.navButtons}>
        <PrimaryButton title="Next" onPress={handleNextStep} />
      </View>
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView contentContainerStyle={styles.stepContent}>
      {renderHeader('Build your portfolio', 'Showcase your best work (min. 4 photos)')}

      {portfolioImages.length > 0 ? (
        <View style={styles.thumbGrid}>
          {portfolioImages.map((img, idx) => (
            <View key={idx} style={styles.thumbWrapper}>
              <Image source={{ uri: img.uri }} style={styles.thumb} resizeMode="cover" />
              <TouchableOpacity
                style={styles.thumbRemove}
                onPress={() => removePortfolioImage(idx)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="close-circle" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyPortfolio}>
          <Ionicons name="images-outline" size={48} color={colors.textLight} />
          <Text style={styles.emptyPortfolioText}>No photos yet</Text>
          <Text style={styles.emptyPortfolioSub}>Upload at least 4 photos to get started</Text>
        </View>
      )}

      <TouchableOpacity style={styles.uploadBtn} onPress={pickPortfolioImages} activeOpacity={0.8}>
        <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
        <Text style={styles.uploadBtnText}>Upload Photos</Text>
      </TouchableOpacity>

      {portfolioImages.length < 4 && portfolioImages.length > 0 && (
        <Text style={styles.portfolioHint}>
          Add {4 - portfolioImages.length} more photo{4 - portfolioImages.length !== 1 ? 's' : ''} to continue
        </Text>
      )}

      <View style={styles.navButtons}>
        <PrimaryButton
          title="Next"
          onPress={handleNextStep}
          disabled={portfolioImages.length < 4}
        />
      </View>
    </ScrollView>
  );

  const renderStep5 = () => (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
      {renderHeader('Set your rates', 'You can always update these later')}

      <Text style={styles.pickerLabel}>Half Day Rate</Text>
      <View style={styles.currencyInputRow}>
        <View style={styles.currencyPrefix}>
          <Text style={styles.currencySymbol}>₹</Text>
        </View>
        <TextInput
          style={styles.currencyInput}
          value={halfDayRate}
          onChangeText={setHalfDayRate}
          placeholder="e.g. 5000"
          keyboardType="numeric"
          placeholderTextColor={colors.textLight}
        />
      </View>

      <Text style={[styles.pickerLabel, { marginTop: 16 }]}>Full Day Rate</Text>
      <View style={styles.currencyInputRow}>
        <View style={styles.currencyPrefix}>
          <Text style={styles.currencySymbol}>₹</Text>
        </View>
        <TextInput
          style={styles.currencyInput}
          value={fullDayRate}
          onChangeText={setFullDayRate}
          placeholder="e.g. 9000"
          keyboardType="numeric"
          placeholderTextColor={colors.textLight}
        />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleLabel}>Open to Offers</Text>
          <Text style={styles.toggleSub}>Let brands negotiate your rate</Text>
        </View>
        <Switch
          value={openToOffers}
          onValueChange={setOpenToOffers}
          trackColor={{ false: colors.border, true: colors.primaryPale }}
          thumbColor={openToOffers ? colors.primary : colors.textLight}
        />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleLabel}>Willing to Travel</Text>
          <Text style={styles.toggleSub}>Available for shoots outside your city</Text>
        </View>
        <Switch
          value={willingToTravel}
          onValueChange={setWillingToTravel}
          trackColor={{ false: colors.border, true: colors.primaryPale }}
          thumbColor={willingToTravel ? colors.primary : colors.textLight}
        />
      </View>

      <View style={[styles.navButtons, { marginTop: 32 }]}>
        <PrimaryButton
          title="Complete Setup"
          onPress={handleComplete}
          loading={loading}
        />
      </View>
    </ScrollView>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.progressBar}>
          <ProgressDots total={TOTAL_STEPS} current={step} />
        </View>
        {renderCurrentStep()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  progressBar: {
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotFilled: {
    backgroundColor: colors.primary,
  },
  dotEmpty: {
    backgroundColor: colors.border,
  },

  stepContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 28,
    gap: 12,
  },
  backBtn: {
    marginTop: 2,
  },
  stepHeaderText: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },

  pickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
    marginTop: 4,
  },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },

  radioGroup: {
    marginBottom: 20,
    gap: 12,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },

  bioContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    minHeight: 120,
  },
  bioInput: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    minHeight: 90,
  },
  charCount: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: 4,
  },

  emptyPortfolio: {
    alignItems: 'center',
    paddingVertical: 36,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  emptyPortfolioText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyPortfolioSub: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  thumbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  thumbWrapper: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    overflow: 'visible',
    position: 'relative',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.surface,
    borderRadius: 10,
  },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.primary,
    marginBottom: 8,
  },
  uploadBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  portfolioHint: {
    fontSize: 12,
    color: colors.warning,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },

  currencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  currencyPrefix: {
    paddingHorizontal: 16,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRightWidth: 1.5,
    borderRightColor: colors.border,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  currencyInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 8,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  toggleSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  navButtons: {
    marginTop: 24,
    gap: 12,
    flexDirection: 'column',
  },
  skipBtn: {
    flex: 1,
  },
  nextBtn: {
    flex: 1,
  },
});
