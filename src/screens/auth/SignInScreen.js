import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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

export default function SignInScreen({ navigation }) {
  const { signIn, resetPassword } = useAuth()

  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [showPassword,   setShowPassword]   = useState(false)
  const [loading,        setLoading]        = useState(false)
  const [focusedField,   setFocusedField]   = useState(null)

  const handleSignIn = async () => {
    if (!email.trim()) { Alert.alert('Missing Info', 'Please enter your email address.'); return }
    if (!password)     { Alert.alert('Missing Info', 'Please enter your password.');      return }
    setLoading(true)
    try {
      await signIn({ email: email.trim(), password })
    } catch (error) {
      Alert.alert('Sign In Failed', error?.message || 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Enter Your Email', 'Please enter your email above, then tap "Forgot password?" again.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(email.trim())
      Alert.alert('Check Your Inbox', `A password reset link has been sent to ${email.trim()}.`)
    } catch (error) {
      Alert.alert('Request Failed', error?.message || 'Could not send reset email. Please try again.')
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
      {/* ── Dark hero section ─────────────────────────────────── */}
      <View style={styles.hero}>
        <ModLinkMark size={44} variant="light" />
        <Text style={styles.heroHeadline}>Welcome{'\n'}Back</Text>
        <Text style={styles.heroSub}>Sign in to your account</Text>
      </View>

      {/* ── White form card (arch top) ────────────────────────── */}
      <ScrollView
        style={styles.formSheet}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Email */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={inputStyle('email')}>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </View>

        {/* Password */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <View style={inputStyle('password')}>
            <TextInput
              style={styles.input}
              placeholder="Your password"
              placeholderTextColor={colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              style={styles.eyeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textLight}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSignIn}
          activeOpacity={0.88}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.submitText}>Sign In</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Footer */}
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.footerLink}>
          <Text style={styles.footerText}>
            Don't have an account?{'  '}
            <Text style={styles.footerBold}>Create one</Text>
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
    paddingTop: 68,
    paddingBottom: 36,
    paddingHorizontal: 28,
    gap: 16,
  },
  heroHeadline: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.2,
    lineHeight: 48,
    marginTop: 8,
  },
  heroSub: {
    fontSize: 15,
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
    paddingTop: 32,
    paddingBottom: 48,
  },

  /* ── Fields ───────────────────────────────────────────────── */
  fieldGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
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
  forgotText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
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
    marginTop: 4,
    marginBottom: 24,
    shadowColor: DARK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
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

  /* ── Divider ─────────────────────────────────────────────── */
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '500',
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
