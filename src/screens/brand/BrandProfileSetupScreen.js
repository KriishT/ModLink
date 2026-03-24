import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  TextInput,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../utils/supabase';
import PrimaryButton from '../../components/PrimaryButton';
import InputField from '../../components/InputField';

const TOTAL_STEPS = 4;

// Display label → DB value (must match CHECK constraint in brand_profiles)
const BUSINESS_TYPES = [
  { label: 'D2C Fashion Brand', value: 'd2c' },
  { label: 'Boutique / Retail', value: 'boutique' },
  { label: 'Design Studio',     value: 'designer' },
  { label: 'Agency',            value: 'agency' },
  { label: 'Other',             value: 'other' },
];

const STYLE_CHIPS = [
  'Minimalist',
  'Streetwear',
  'Luxury',
  'Sustainable',
  'Bohemian',
  'Edgy',
  'Traditional',
  'Contemporary',
];

function StepIndicator({ currentStep }) {
  return (
    <View style={styles.stepContainer}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isDone = step < currentStep;
        return (
          <React.Fragment key={step}>
            <View
              style={[
                styles.stepCircle,
                isActive && styles.stepCircleActive,
                isDone && styles.stepCircleDone,
              ]}
            >
              {isDone ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    (isActive || isDone) && styles.stepNumberActive,
                  ]}
                >
                  {step}
                </Text>
              )}
            </View>
            {step < TOTAL_STEPS && (
              <View
                style={[styles.stepLine, isDone && styles.stepLineDone]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Step 1 ──────────────────────────────────────────────────────────────────
function StepBusinessInfo({ data, onChange, onNext }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!data.brandName.trim()) e.brandName = 'Brand name is required';
    if (!data.businessType) e.businessType = 'Please select a business type';
    if (!data.instagram.trim()) e.instagram = 'Instagram handle is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Map: formData key is 'instagram', matches the input below

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Business Info</Text>
      <Text style={styles.stepSubtitle}>Tell us about your brand</Text>

      <InputField
        label="Brand Name *"
        placeholder="e.g. ZARA India"
        value={data.brandName}
        onChangeText={(v) => onChange('brandName', v)}
        error={errors.brandName}
        autoCapitalize="words"
      />

      <Text style={styles.fieldLabel}>Business Type *</Text>
      <View style={styles.chipsWrap}>
        {BUSINESS_TYPES.map(({ label, value }) => (
          <Chip
            key={value}
            label={label}
            selected={data.businessType === value}
            onPress={() => onChange('businessType', value)}
          />
        ))}
      </View>
      {errors.businessType ? (
        <Text style={styles.fieldError}>{errors.businessType}</Text>
      ) : null}

      <InputField
        label="Website (optional)"
        placeholder="https://yourbrand.com"
        value={data.website}
        onChangeText={(v) => onChange('website', v)}
        keyboardType="url"
        autoCapitalize="none"
      />

      <InputField
        label="Instagram Handle *"
        placeholder="@yourbrand"
        value={data.instagram}
        onChangeText={(v) => onChange('instagram', v)}
        error={errors.instagram}
        autoCapitalize="none"
      />

      <PrimaryButton
        title="Next"
        onPress={() => { if (validate()) onNext(); }}
        style={styles.nextBtn}
      />
    </View>
  );
}

// ── Step 2 ──────────────────────────────────────────────────────────────────
function StepVerification({ data, onChange, onNext }) {
  const [documents, setDocuments] = useState([]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: false,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setDocuments((prev) => [...prev, result.assets[0]]);
      }
    } catch {
      Alert.alert('Error', 'Could not open document picker.');
    }
  };

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Verification</Text>
      <Text style={styles.stepSubtitle}>
        Verify your business to unlock full access
      </Text>

      <Text style={styles.sectionLabel}>Option A — Tax / Registration</Text>

      <InputField
        label="GST Number"
        placeholder="22AAAAA0000A1Z5"
        value={data.gstNumber}
        onChangeText={(v) => onChange('gstNumber', v)}
        autoCapitalize="characters"
      />

      <InputField
        label="Business Registration Number"
        placeholder="CIN / MSME / Udyam No."
        value={data.regNumber}
        onChangeText={(v) => onChange('regNumber', v)}
        autoCapitalize="characters"
      />

      <View style={styles.orDivider}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.orLine} />
      </View>

      <Text style={styles.sectionLabel}>Option B — Social / Website</Text>
      <Text style={styles.hintText}>
        We'll use your Instagram + Website for lighter verification.
      </Text>

      <TouchableOpacity style={styles.uploadBox} onPress={pickDocument}>
        <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
        <Text style={styles.uploadBoxTitle}>Upload Business Documents</Text>
        <Text style={styles.uploadBoxSub}>PDF, JPG, PNG • Max 10 MB</Text>
      </TouchableOpacity>

      {documents.map((doc, idx) => (
        <View key={idx} style={styles.docRow}>
          <Ionicons name="document-text-outline" size={16} color={colors.primary} />
          <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
        </View>
      ))}

      <PrimaryButton
        title="Next"
        onPress={onNext}
        style={styles.nextBtn}
      />
    </View>
  );
}

// ── Step 3 ──────────────────────────────────────────────────────────────────
function StepBrandIdentity({ data, onChange, onNext }) {
  const MAX_STORY = 500;

  const toggleStyle = (style) => {
    const current = data.styles || [];
    if (current.includes(style)) {
      onChange('styles', current.filter((s) => s !== style));
    } else {
      onChange('styles', [...current, style]);
    }
  };

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Brand Identity</Text>
      <Text style={styles.stepSubtitle}>What best describes your aesthetic?</Text>

      <Text style={styles.fieldLabel}>Style Tags</Text>
      <View style={styles.chipsWrap}>
        {STYLE_CHIPS.map((s) => (
          <Chip
            key={s}
            label={s}
            selected={(data.styles || []).includes(s)}
            onPress={() => toggleStyle(s)}
          />
        ))}
      </View>

      <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Brand Story</Text>
      <View style={styles.textareaContainer}>
        <TextInput
          style={styles.textarea}
          placeholder="Tell models about your brand, your aesthetic, and what you look for in collaborations..."
          placeholderTextColor={colors.textLight}
          value={data.brandStory}
          onChangeText={(v) => {
            if (v.length <= MAX_STORY) onChange('brandStory', v);
          }}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.charCounter}>
          {(data.brandStory || '').length}/{MAX_STORY}
        </Text>
      </View>

      <PrimaryButton
        title="Next"
        onPress={onNext}
        style={styles.nextBtn}
      />
    </View>
  );
}

// ── Step 4 ──────────────────────────────────────────────────────────────────
function StepPastWork({ data, onChange, onComplete, loading }) {
  const MAX_IMAGES = 6;
  const MIN_IMAGES = 3;

  const pickImages = async () => {
    if ((data.campaignImages || []).length >= MAX_IMAGES) {
      Alert.alert('Limit reached', `You can upload up to ${MAX_IMAGES} images.`);
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.85,
        selectionLimit: MAX_IMAGES - (data.campaignImages || []).length,
      });
      if (!result.canceled) {
        const uris = result.assets.map((a) => a.uri);
        onChange('campaignImages', [...(data.campaignImages || []), ...uris]);
      }
    } catch {
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const removeImage = (idx) => {
    const updated = (data.campaignImages || []).filter((_, i) => i !== idx);
    onChange('campaignImages', updated);
  };

  const canSubmit = (data.campaignImages || []).length >= MIN_IMAGES;

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Past Work</Text>
      <Text style={styles.stepSubtitle}>
        Upload 3–6 campaign images to showcase your brand
      </Text>

      <View style={styles.imageGrid}>
        {(data.campaignImages || []).map((uri, idx) => (
          <View key={idx} style={styles.imageCell}>
            <Image source={{ uri }} style={styles.gridImage} />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => removeImage(idx)}
            >
              <Ionicons name="close-circle" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}

        {(data.campaignImages || []).length < MAX_IMAGES && (
          <TouchableOpacity style={styles.addImageCell} onPress={pickImages}>
            <Ionicons name="add" size={32} color={colors.primary} />
            <Text style={styles.addImageText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.hintText}>
        {(data.campaignImages || []).length}/{MAX_IMAGES} images uploaded
        {(data.campaignImages || []).length < MIN_IMAGES
          ? ` — at least ${MIN_IMAGES} required`
          : ''}
      </Text>

      <PrimaryButton
        title="Complete Setup"
        onPress={onComplete}
        disabled={!canSubmit}
        loading={loading}
        style={styles.nextBtn}
      />
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function BrandProfileSetupScreen({ navigation }) {
  const { user } = useAuth();
  const { updateBrandProfile } = useUser();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    brandName: '',
    businessType: '',
    website: '',
    instagram: '',
    gstNumber: '',
    regNumber: '',
    styles: [],
    brandStory: '',
    campaignImages: [],
  });

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Upsert brand_profiles with correct DB column names
      await updateBrandProfile({
        brand_name: formData.brandName,
        business_type: formData.businessType,         // already a DB value ('d2c', 'boutique', etc.)
        website: formData.website || null,
        instagram_handle: formData.instagram || null, // DB col is instagram_handle, not instagram
        gst_number: formData.gstNumber || null,
        business_registration: formData.regNumber || null, // DB col is business_registration
        brand_identity: formData.styles.length > 0 ? formData.styles : null, // DB col is brand_identity
        bio: formData.brandStory || null,             // DB col is bio, not brand_story
      });

      // Insert campaign images into the campaign_images table (separate table)
      if (formData.campaignImages.length > 0) {
        const rows = formData.campaignImages.map((uri) => ({
          brand_id: user.id,
          image_url: uri,
        }));
        const { error: imgError } = await supabase.from('campaign_images').insert(rows);
        if (imgError) console.warn('Campaign images insert failed:', imgError.message);
      }

      navigation.replace('BrandTabs');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = ['Business Info', 'Verification', 'Brand Identity', 'Past Work'];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          {step > 1 ? (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setStep((s) => s - 1)}
            >
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}
          <Text style={styles.headerTitle}>Set Up Brand Profile</Text>
          <Text style={styles.stepBadge}>{step}/{TOTAL_STEPS}</Text>
        </View>

        <StepIndicator currentStep={step} />

        <Text style={styles.currentStepLabel}>{stepTitles[step - 1]}</Text>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
            <StepBusinessInfo data={formData} onChange={handleChange} onNext={nextStep} />
          )}
          {step === 2 && (
            <StepVerification data={formData} onChange={handleChange} onNext={nextStep} />
          )}
          {step === 3 && (
            <StepBrandIdentity data={formData} onChange={handleChange} onNext={nextStep} />
          )}
          {step === 4 && (
            <StepPastWork
              data={formData}
              onChange={handleChange}
              onComplete={handleComplete}
              loading={loading}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 36,
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepBadge: {
    width: 36,
    textAlign: 'right',
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '600',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: colors.surface,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  stepCircleDone: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
  },
  stepNumberActive: {
    color: colors.primary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
  },
  stepLineDone: {
    backgroundColor: colors.primary,
  },
  currentStepLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingBottom: 4,
    backgroundColor: colors.surface,
    paddingTop: 0,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },
  stepContent: {
    flex: 1,
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
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  fieldError: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
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
    color: colors.primary,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
  },
  hintText: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 12,
    lineHeight: 18,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: colors.primaryPale,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    gap: 6,
    marginBottom: 12,
  },
  uploadBoxTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  uploadBoxSub: {
    fontSize: 12,
    color: colors.textLight,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginBottom: 6,
  },
  docName: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
  },
  textareaContainer: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: 14,
    marginBottom: 8,
  },
  textarea: {
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 120,
    lineHeight: 22,
  },
  charCounter: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: 6,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  imageCell: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  addImageCell: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primaryPale,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addImageText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  nextBtn: {
    marginTop: 24,
  },
});
