import React, { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../theme/colors'
import { useUser } from '../../context/UserContext'
import InputField from '../../components/InputField'
import PrimaryButton from '../../components/PrimaryButton'

export default function EditProfileScreen({ navigation }) {
  const { profile, modelProfile, brandProfile, updateProfile, updateModelProfile, updateBrandProfile } = useUser()
  const isModel = profile?.user_type === 'model'
  const isBrand = profile?.user_type === 'brand'

  // Shared fields
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [state, setState] = useState(profile?.state ?? '')

  // Model fields
  const [bio, setBio] = useState(modelProfile?.bio ?? '')
  const [instagram, setInstagram] = useState(modelProfile?.instagram_handle ?? '')
  const [rateHalfDay, setRateHalfDay] = useState(modelProfile?.rate_half_day?.toString() ?? '')
  const [rateFullDay, setRateFullDay] = useState(modelProfile?.rate_full_day?.toString() ?? '')
  const [willingToTravel, setWillingToTravel] = useState(modelProfile?.willing_to_travel ?? false)
  const [openToOffers, setOpenToOffers] = useState(modelProfile?.open_to_offers ?? false)
  const [available, setAvailable] = useState(modelProfile?.available ?? true)

  // Brand fields
  const [brandName, setBrandName] = useState(brandProfile?.brand_name ?? '')
  const [website, setWebsite] = useState(brandProfile?.website ?? '')
  const [brandInstagram, setBrandInstagram] = useState(brandProfile?.instagram_handle ?? '')
  const [brandBio, setBrandBio] = useState(brandProfile?.bio ?? '')

  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Full name cannot be empty.')
      return
    }
    setLoading(true)
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
      })

      if (isModel) {
        await updateModelProfile({
          bio: bio.trim() || null,
          instagram_handle: instagram.trim() || null,
          rate_half_day: rateHalfDay ? parseInt(rateHalfDay, 10) : null,
          rate_full_day: rateFullDay ? parseInt(rateFullDay, 10) : null,
          willing_to_travel: willingToTravel,
          open_to_offers: openToOffers,
          available,
        })
      }

      if (isBrand) {
        await updateBrandProfile({
          brand_name: brandName.trim() || null,
          website: website.trim() || null,
          instagram_handle: brandInstagram.trim() || null,
          bio: brandBio.trim() || null,
        })
      }

      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch (err) {
      Alert.alert('Error', err.message ?? 'Could not save changes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Info */}
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <InputField label="Full Name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
          <InputField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <InputField label="City" value={city} onChangeText={setCity} autoCapitalize="words" />
          <InputField label="State" value={state} onChangeText={setState} autoCapitalize="words" />

          {/* Model-specific */}
          {isModel && (
            <>
              <Text style={styles.sectionTitle}>Model Details</Text>
              <Text style={styles.fieldLabel}>Bio</Text>
              <View style={styles.textareaWrap}>
                <InputField
                  value={bio}
                  onChangeText={(t) => setBio(t.slice(0, 500))}
                  placeholder="Tell brands about yourself..."
                  multiline
                  style={styles.textarea}
                />
              </View>
              <InputField label="Instagram Handle" value={instagram} onChangeText={setInstagram} autoCapitalize="none" placeholder="@yourhandle" />

              <Text style={styles.sectionTitle}>Rates</Text>
              <InputField label="Half Day Rate (₹)" value={rateHalfDay} onChangeText={setRateHalfDay} keyboardType="numeric" placeholder="e.g. 5000" />
              <InputField label="Full Day Rate (₹)" value={rateFullDay} onChangeText={setRateFullDay} keyboardType="numeric" placeholder="e.g. 9000" />

              <Text style={styles.sectionTitle}>Preferences</Text>
              <ToggleRow label="Available for Bookings" sub="Show up in brand searches" value={available} onValueChange={setAvailable} />
              <ToggleRow label="Willing to Travel" sub="Available outside your city" value={willingToTravel} onValueChange={setWillingToTravel} />
              <ToggleRow label="Open to Offers" sub="Let brands negotiate your rate" value={openToOffers} onValueChange={setOpenToOffers} />
            </>
          )}

          {/* Brand-specific */}
          {isBrand && (
            <>
              <Text style={styles.sectionTitle}>Brand Details</Text>
              <InputField label="Brand Name" value={brandName} onChangeText={setBrandName} autoCapitalize="words" />
              <InputField label="Website" value={website} onChangeText={setWebsite} keyboardType="url" autoCapitalize="none" placeholder="https://..." />
              <InputField label="Instagram Handle" value={brandInstagram} onChangeText={setBrandInstagram} autoCapitalize="none" placeholder="@yourbrand" />
              <InputField label="Brand Bio" value={brandBio} onChangeText={(t) => setBrandBio(t.slice(0, 500))} placeholder="Describe your brand..." multiline />
            </>
          )}

          <PrimaryButton title="Save Changes" onPress={handleSave} loading={loading} style={styles.saveBtn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function ToggleRow({ label, sub, value, onValueChange }) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sub ? <Text style={styles.toggleSub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primaryPale }}
        thumbColor={value ? colors.primary : colors.textLight}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 48,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 24,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  textareaWrap: { marginBottom: 16 },
  textarea: { minHeight: 100 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleInfo: { flex: 1, paddingRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  toggleSub: { fontSize: 12, color: colors.textSecondary },
  saveBtn: { marginTop: 32 },
})
