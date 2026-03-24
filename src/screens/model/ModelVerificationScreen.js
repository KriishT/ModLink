import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../utils/supabase';
import PrimaryButton from '../../components/PrimaryButton';

function UploadCard({ title, description, icon, file, onPress, disabled }) {
  const uploaded = !!file;
  return (
    <TouchableOpacity
      style={[styles.uploadCard, uploaded && styles.uploadCardDone]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <View style={[styles.uploadIconCircle, uploaded && styles.uploadIconCircleDone]}>
        <Ionicons
          name={uploaded ? 'checkmark' : icon}
          size={26}
          color={uploaded ? '#FFFFFF' : colors.primary}
        />
      </View>
      <View style={styles.uploadCardContent}>
        <Text style={styles.uploadCardTitle}>{title}</Text>
        {uploaded ? (
          <Text style={styles.uploadCardFileName} numberOfLines={1}>
            {file.name ?? 'File selected'}
          </Text>
        ) : (
          <Text style={styles.uploadCardDesc}>{description}</Text>
        )}
      </View>
      <Ionicons
        name={uploaded ? 'checkmark-circle' : 'chevron-forward'}
        size={22}
        color={uploaded ? colors.success : colors.textLight}
      />
    </TouchableOpacity>
  );
}

export default function ModelVerificationScreen({ navigation }) {
  const { user } = useAuth();
  const { profile } = useUser();

  const [govId, setGovId] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const pickGovId = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setGovId({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
      }
    } catch (err) {
      Alert.alert('Error', 'Could not pick document. Please try again.');
    }
  };

  const pickSelfie = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.9,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const fileName = asset.uri.split('/').pop();
      setSelfie({ uri: asset.uri, name: fileName, mimeType: asset.type ?? 'image/jpeg' });
    }
  };

  const uploadFile = async (file, folder) => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${folder}/${user.id}_${Date.now()}.${fileExt}`;

    const response = await fetch(file.uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('verification-docs')
      .upload(filePath, blob, {
        contentType: file.mimeType ?? 'application/octet-stream',
        upsert: true,
      });

    if (error) throw error;
    return filePath;
  };

  const handleSubmit = async () => {
    if (!govId || !selfie) return;

    setLoading(true);
    try {
      const [govIdPath, selfiePath] = await Promise.all([
        uploadFile(govId, 'gov-id'),
        uploadFile(selfie, 'selfie'),
      ]);

      const { error: dbError } = await supabase
        .from('verification_documents')
        .upsert({
          user_id: user.id,
          gov_id_path: govIdPath,
          selfie_path: selfiePath,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      setSubmitted(true);
    } catch (err) {
      Alert.alert('Upload failed', err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Submitted!</Text>
          <Text style={styles.successSub}>
            Your documents are under review. We'll notify you by email within 24–48 hours once verification is complete.
          </Text>
          <View style={styles.successInfo}>
            <Ionicons name="mail-outline" size={16} color={colors.primary} />
            <Text style={styles.successInfoText}>Check your inbox for updates</Text>
          </View>
          <PrimaryButton
            title="Go to Home"
            onPress={() => navigation.navigate('ModelTabs')}
            style={styles.successBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.titleBlock}>
          <View style={styles.shieldIcon}>
            <Ionicons name="shield-checkmark-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Verify Your Identity</Text>
          <Text style={styles.subtitle}>
            To keep ModLink safe for everyone, we need to verify who you are. Your documents are encrypted and reviewed by our team only.
          </Text>
        </View>

        <View style={styles.reviewBadge}>
          <Ionicons name="time-outline" size={16} color={colors.warning} />
          <Text style={styles.reviewBadgeText}>Review takes 24–48 hours</Text>
        </View>

        {/* Upload sections */}
        <Text style={styles.sectionLabel}>Documents Required</Text>

        <UploadCard
          title="Government ID"
          description="Aadhaar, Passport, PAN Card, or Driver's License"
          icon="card-outline"
          file={govId}
          onPress={pickGovId}
          disabled={loading}
        />

        <UploadCard
          title="Selfie Verification"
          description="A clear photo or short video of yourself"
          icon="camera-outline"
          file={selfie}
          onPress={pickSelfie}
          disabled={loading}
        />

        {/* Privacy note */}
        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.textLight} />
          <Text style={styles.privacyNoteText}>
            Your documents are encrypted and never shared with brands. Used only for identity verification.
          </Text>
        </View>

        {/* Submit button */}
        <PrimaryButton
          title={loading ? 'Uploading...' : 'Submit for Review'}
          onPress={handleSubmit}
          loading={loading}
          disabled={!govId || !selfie}
          style={styles.submitBtn}
        />

        {/* Skip link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('ModelTabs')}
          style={styles.skipLink}
          activeOpacity={0.7}
        >
          <Text style={styles.skipLinkText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  header: {
    paddingTop: 12,
    marginBottom: 8,
  },
  titleBlock: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 24,
  },
  shieldIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,179,71,0.12)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,179,71,0.3)',
  },
  reviewBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A06000',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  uploadCardDone: {
    borderColor: colors.success,
    backgroundColor: 'rgba(0,212,170,0.05)',
  },
  uploadIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  uploadIconCircleDone: {
    backgroundColor: colors.success,
  },
  uploadCardContent: {
    flex: 1,
    paddingRight: 8,
  },
  uploadCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  uploadCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  uploadCardFileName: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  privacyNoteText: {
    flex: 1,
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 18,
  },
  submitBtn: {
    marginBottom: 16,
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipLinkText: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },

  // Success state
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successIconCircle: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  successSub: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  successInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 36,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  successInfoText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  successBtn: {
    width: '100%',
  },
});
