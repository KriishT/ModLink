import React, { useState } from 'react'
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../theme/colors'
import { useAuth } from '../../context/AuthContext'
import { ModLinkMark } from '../../components/ModLinkLogo'

const DARK = '#0D0B1F'

export default function SignUpScreen({ navigation }) {
  const { signUp } = useAuth()

  const [userType,            setUserType]            = useState(null)
  const [fullName,            setFullName]            = useState('')
  const [email,               setEmail]               = useState('')
  const [phone,               setPhone]               = useState('')
  const [password,            setPassword]            = useState('')
  const [confirmPassword,     setConfirmPassword]     = useState('')
  const [agreedToTerms,       setAgreedToTerms]       = useState(false)
  const [showPassword,        setShowPassword]        = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading,             setLoading]             = useState(false)
  const [focusedField,        setFocusedField]        = useState(null)

  const handleSignUp = async () => {
    if (!userType)                         { Alert.alert('Missing Info', 'Please select whether you are a Model or a Brand.'); return }
    if (!fullName.trim())                  { Alert.alert('Missing Info', 'Please enter your full name.');               return }
    if (!email.trim())                     { Alert.alert('Missing Info', 'Please enter your email address.');           return }
    if (!phone.trim())                     { Alert.alert('Missing Info', 'Please enter your phone number.');            return }
    if (!password)                         { Alert.alert('Missing Info', 'Please enter a password.');                   return }
    if (password !== confirmPassword)      { Alert.alert('Password Mismatch', 'Passwords do not match.');               return }
    if (!agreedToTerms)                    { Alert.alert('Terms Required', 'Please agree to the Terms & Privacy Policy.'); return }

    setLoading(true)
    try {
      const { needsEmailConfirmation } = await signUp({
        email: email.trim(), password, userType,
        fullName: fullName.trim(), phone: phone.trim(),
      })
      if (needsEmailConfirmation) {
        Alert.alert(
          'Check Your Email',
          `We sent a confirmation link to ${email.trim()}. Tap it to activate your account, then sign in.`,
          [{ text: 'OK', onPress: () => navigation.navigate('SignIn') }],
        )
      }
    } catch (error) {
      Alert.alert('Sign Up Failed', error?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field) => [
    styles.inputContainer,
    focusedField === field && styles.inputContainerFocused,
  ]

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* ── Dark hero ─────────────────────────────────────────── */}
      <View style={styles.hero}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.65)" />
        </TouchableOpacity>

        <ModLinkMark size={36} variant="light" />
        <Text style={styles.heroHeadline}>Create{'\n'}Account</Text>
        <Text style={styles.heroSub}>Join the ModLink community</Text>
      </View>

      {/* ── White form sheet ──────────────────────────────────── */}
      <ScrollView
        style={styles.formSheet}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* User type selector */}
        <Text style={styles.sectionLabel}>I am a…</Text>
        <View style={styles.typeRow}>
          {[
            { key: 'model', icon: 'camera',    label: 'Model' },
            { key: 'brand', icon: 'briefcase', label: 'Brand' },
          ].map(({ key, icon, label }) => {
            const selected = userType === key
            return (
              <TouchableOpacity
                key={key}
                style={[styles.typeCard, selected && styles.typeCardSelected]}
                onPress={() => setUserType(key)}
                activeOpacity={0.8}
              >
                <View style={[styles.typeIconBox, selected && styles.typeIconBoxSelected]}>
                  <Ionicons name={icon} size={22} color={selected ? colors.primary : colors.textLight} />
                </View>
                <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>{label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Text fields */}
        {[
          { key: 'name',  label: 'Full Name',     value: fullName, setter: setFullName, placeholder: 'Your full name',     keyboard: 'default',       capitalize: 'words' },
          { key: 'email', label: 'Email',          value: email,    setter: setEmail,    placeholder: 'you@example.com',    keyboard: 'email-address', capitalize: 'none'  },
          { key: 'phone', label: 'Phone Number',   value: phone,    setter: setPhone,    placeholder: '+91 98765 43210',   keyboard: 'phone-pad',     capitalize: 'none'  },
        ].map(({ key, label, value, setter, placeholder, keyboard, capitalize }) => (
          <View key={key} style={styles.fieldGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={inputStyle(key)}>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={colors.textLight}
                value={value}
                onChangeText={setter}
                keyboardType={keyboard}
                autoCapitalize={capitalize}
                autoCorrect={false}
                returnKeyType="next"
                onFocus={() => setFocusedField(key)}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>
        ))}

        {/* Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={inputStyle('password')}>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              placeholderTextColor={colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={inputStyle('confirm')}>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.textLight}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} style={styles.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Terms */}
        <TouchableOpacity style={styles.checkRow} onPress={() => setAgreedToTerms((v) => !v)} activeOpacity={0.7}>
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
          </View>
          <Text style={styles.checkLabel}>
            I agree to{' '}
            <Text style={styles.checkLink}>Terms &amp; Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSignUp}
          activeOpacity={0.88}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.submitText}>Create Account</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={styles.footerLink}>
          <Text style={styles.footerText}>
            Already have an account?{'  '}
            <Text style={styles.footerBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: DARK,
  },

  /* ── Hero ─────────────────────────────────────────────────── */
  hero: {
    backgroundColor: DARK,
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 28,
    gap: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroHeadline: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 44,
    marginTop: 4,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '400',
  },

  /* ── Form sheet ───────────────────────────────────────────── */
  formSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
  },
  formContent: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 48,
  },

  /* ── Type selector ────────────────────────────────────────── */
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 10,
  },
  typeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryPale,
  },
  typeIconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeIconBoxSelected: {
    borderColor: colors.primaryLight,
    backgroundColor: '#FFFFFF',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  typeLabelSelected: {
    color: colors.primary,
  },

  /* ── Fields ───────────────────────────────────────────────── */
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  eyeBtn: {
    paddingLeft: 8,
  },

  /* ── Terms ────────────────────────────────────────────────── */
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: colors.background,
  },
  checkboxChecked: {
    backgroundColor: DARK,
    borderColor: DARK,
  },
  checkLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  checkLink: {
    color: colors.primary,
    fontWeight: '700',
  },

  /* ── Submit ───────────────────────────────────────────────── */
  submitBtn: {
    height: 56,
    backgroundColor: DARK,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    shadowColor: DARK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* ── Footer ──────────────────────────────────────────────── */
  footerLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerBold: {
    color: colors.primary,
    fontWeight: '700',
  },
})
