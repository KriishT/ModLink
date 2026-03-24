import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../utils/supabase';
import PrimaryButton from '../../components/PrimaryButton';
import InputField from '../../components/InputField';

const SHOOT_TYPES = [
  'E-commerce Product',
  'Social Media Content',
  'Lookbook/Catalog',
  'Brand Campaign',
  'Other',
];

const DURATION_OPTIONS = ['Half-day', 'Full-day'];

const CATEGORY_CHIPS = [
  'Fashion',
  'Lifestyle',
  'E-commerce',
  'Beauty',
  'Streetwear',
  'Campaign',
  'Lookbook',
  'Sustainable',
  'Traditional',
  'Contemporary',
];

const EXPERIENCE_OPTIONS = ['Any', 'Beginner', 'Intermediate', 'Experienced'];

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

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function FieldLabel({ title, required }) {
  return (
    <Text style={styles.fieldLabel}>
      {title}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
  );
}

export default function PostJobScreen({ navigation }) {
  const { user } = useAuth();
  const { brandProfile } = useUser();

  const [loading, setLoading] = useState(false);

  // Form state
  const [shootType, setShootType] = useState('');
  const [shootDate, setShootDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [shootTime, setShootTime] = useState('');
  const [duration, setDuration] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [specificAddress, setSpecificAddress] = useState('');
  const [paymentOffer, setPaymentOffer] = useState('');
  const [openToNegotiation, setOpenToNegotiation] = useState(false);
  const [numPhotos, setNumPhotos] = useState('');
  const [numVideos, setNumVideos] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [lookingForCategories, setLookingForCategories] = useState([]);
  const [experience, setExperience] = useState('Any');

  const [errors, setErrors] = useState({});

  const toggleCategory = (cat) => {
    setLookingForCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const validate = () => {
    const e = {};
    if (!shootType) e.shootType = 'Please select a shoot type';
    if (!duration) e.duration = 'Please select a duration';
    if (!locationCity.trim()) e.locationCity = 'City is required';
    if (!paymentOffer.trim()) e.paymentOffer = 'Payment offer is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePublish = async () => {
    if (!validate()) {
      Alert.alert('Missing Info', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('bookings').insert({
        brand_id: user.id,
        shoot_type: shootType,
        shoot_date: shootDate.toISOString().split('T')[0],
        shoot_time: shootTime || null,
        duration,
        location_city: locationCity,
        specific_address: specificAddress || null,
        payment_amount: parseFloat(paymentOffer.replace(/[^0-9.]/g, '')) || 0,
        open_to_negotiation: openToNegotiation,
        num_photos: parseInt(numPhotos) || 0,
        num_videos: parseInt(numVideos) || 0,
        additional_requirements: additionalRequirements || null,
        looking_for_categories: lookingForCategories,
        required_experience: experience,
        status: 'pending',
      });

      if (error) throw error;

      Alert.alert(
        'Casting Published!',
        'Your casting call is now live. Models can start applying.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to publish casting call.');
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = shootDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Casting Call</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Shoot Type */}
          <SectionHeader title="Shoot Type" />
          <View style={styles.chipsWrap}>
            {SHOOT_TYPES.map((t) => (
              <Chip
                key={t}
                label={t}
                selected={shootType === t}
                onPress={() => setShootType(t)}
              />
            ))}
          </View>
          {errors.shootType ? (
            <Text style={styles.fieldError}>{errors.shootType}</Text>
          ) : null}

          {/* Shoot Date */}
          <SectionHeader title="Shoot Date" />
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.datePickerText}>{formattedDate}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textLight} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={shootDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setShootDate(date);
              }}
            />
          )}

          {/* Shoot Time */}
          <SectionHeader title="Shoot Time" />
          <InputField
            placeholder="e.g. 10:00 AM"
            value={shootTime}
            onChangeText={setShootTime}
            autoCapitalize="none"
          />

          {/* Duration */}
          <SectionHeader title="Duration" />
          <View style={styles.radioRow}>
            {DURATION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.radioOption}
                onPress={() => setDuration(opt)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.radioOuter,
                    duration === opt && styles.radioOuterSelected,
                  ]}
                >
                  {duration === opt && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.duration ? (
            <Text style={styles.fieldError}>{errors.duration}</Text>
          ) : null}

          {/* Location */}
          <SectionHeader title="Location" />
          <InputField
            label="City *"
            placeholder="e.g. Mumbai"
            value={locationCity}
            onChangeText={setLocationCity}
            error={errors.locationCity}
            autoCapitalize="words"
          />
          <View style={styles.addressWrapper}>
            <InputField
              label="Specific Address"
              placeholder="Studio name, street, area..."
              value={specificAddress}
              onChangeText={setSpecificAddress}
              autoCapitalize="words"
            />
            <View style={styles.addressNote}>
              <Ionicons name="lock-closed-outline" size={12} color={colors.textLight} />
              <Text style={styles.addressNoteText}>
                Shown only after booking is confirmed
              </Text>
            </View>
          </View>

          {/* Payment */}
          <SectionHeader title="Payment" />
          <View style={styles.paymentRow}>
            <View style={styles.rupeePrefixBox}>
              <Text style={styles.rupeePrefix}>₹</Text>
            </View>
            <TextInput
              style={styles.paymentInput}
              placeholder="Amount offered"
              placeholderTextColor={colors.textLight}
              value={paymentOffer}
              onChangeText={setPaymentOffer}
              keyboardType="numeric"
            />
          </View>
          {errors.paymentOffer ? (
            <Text style={styles.fieldError}>{errors.paymentOffer}</Text>
          ) : null}

          <View style={styles.negotiationRow}>
            <Text style={styles.negotiationLabel}>Open to negotiation</Text>
            <Switch
              value={openToNegotiation}
              onValueChange={setOpenToNegotiation}
              trackColor={{ false: colors.border, true: colors.primaryPale }}
              thumbColor={openToNegotiation ? colors.primary : colors.textLight}
            />
          </View>

          {/* Deliverables */}
          <SectionHeader title="Deliverables" />
          <View style={styles.deliverablesRow}>
            <View style={styles.deliverableInput}>
              <FieldLabel title="Photos" />
              <TextInput
                style={styles.smallNumInput}
                placeholder="0"
                placeholderTextColor={colors.textLight}
                value={numPhotos}
                onChangeText={setNumPhotos}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.deliverableInput}>
              <FieldLabel title="Videos" />
              <TextInput
                style={styles.smallNumInput}
                placeholder="0"
                placeholderTextColor={colors.textLight}
                value={numVideos}
                onChangeText={setNumVideos}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Additional Requirements</Text>
          <View style={styles.textareaContainer}>
            <TextInput
              style={styles.textarea}
              placeholder="Any specific requirements, mood board details, clothing instructions..."
              placeholderTextColor={colors.textLight}
              value={additionalRequirements}
              onChangeText={setAdditionalRequirements}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Looking For */}
          <SectionHeader title="Looking For" />
          <View style={styles.chipsWrap}>
            {CATEGORY_CHIPS.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                selected={lookingForCategories.includes(cat)}
                onPress={() => toggleCategory(cat)}
              />
            ))}
          </View>

          {/* Experience Level */}
          <SectionHeader title="Experience Level" />
          <View style={styles.chipsWrap}>
            {EXPERIENCE_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                selected={experience === opt}
                onPress={() => setExperience(opt)}
              />
            ))}
          </View>

          <PrimaryButton
            title="Publish Casting Call"
            onPress={handlePublish}
            loading={loading}
            style={styles.publishBtn}
          />
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
    marginTop: 20,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
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
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  fieldError: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    marginBottom: 6,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  datePickerText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  radioRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
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
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  addressWrapper: {
    marginBottom: 4,
  },
  addressNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -10,
    marginBottom: 10,
  },
  addressNoteText: {
    fontSize: 11,
    color: colors.textLight,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    height: 52,
    marginBottom: 8,
  },
  rupeePrefixBox: {
    paddingHorizontal: 14,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  rupeePrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  paymentInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  negotiationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 8,
  },
  negotiationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  deliverablesRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  deliverableInput: {
    flex: 1,
  },
  smallNumInput: {
    height: 52,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.textPrimary,
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
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 90,
    lineHeight: 21,
  },
  publishBtn: {
    marginTop: 28,
  },
});
