import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = 80;

function AvatarCircle({ uri, name, size = AVATAR_SIZE }) {
  const initials = name
    ? name.trim().split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  const radius = size / 2;

  return (
    <View
      style={[
        styles.avatarCircle,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: radius }}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.avatarInitials, { fontSize: size * 0.3 }]}>
          {initials}
        </Text>
      )}
    </View>
  );
}

export default function MatchModal({
  visible,
  modelName,
  brandName,
  modelPhoto,
  brandLogo,
  onMessage,
  onContinue,
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const heartBounce = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.88);
      heartBounce.setValue(0.5);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(300),
          Animated.spring(heartBounce, {
            toValue: 1,
            friction: 4,
            tension: 120,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onContinue}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.heading}>It's a Match</Text>
            <Text style={styles.subHeading}>
              You and this {brandName ? 'brand' : 'model'} liked each other
            </Text>
          </View>

          {/* Avatars */}
          <View style={styles.avatarsRow}>
            <AvatarCircle uri={modelPhoto} name={modelName} />

            <Animated.View
              style={[
                styles.heartContainer,
                { transform: [{ scale: heartBounce }] },
              ]}
            >
              <Ionicons name="heart" size={22} color={colors.error} />
            </Animated.View>

            <AvatarCircle uri={brandLogo} name={brandName} />
          </View>

          {/* Names */}
          <Text style={styles.namesText} numberOfLines={2}>
            {modelName} & {brandName}
          </Text>

          {/* Expiry */}
          <View style={styles.expiryRow}>
            <Ionicons name="time-outline" size={13} color={colors.textLight} />
            <Text style={styles.expiryText}>  Match expires in 48 hours</Text>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={styles.messageButton}
            onPress={onMessage}
            activeOpacity={0.88}
          >
            <Ionicons name="chatbubble" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.messageButtonText}>Send a Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onContinue}
            activeOpacity={0.7}
            style={styles.continueButton}
          >
            <Text style={styles.continueText}>Back to Discover</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13,11,31,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 32,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  heading: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subHeading: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarInitials: {
    fontWeight: '800',
    color: colors.primary,
  },
  heartContainer: {
    zIndex: 10,
    marginHorizontal: -10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  namesText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  expiryText: {
    fontSize: 12,
    color: colors.textLight,
  },
  messageButton: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  continueButton: {
    paddingVertical: 8,
  },
  continueText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
