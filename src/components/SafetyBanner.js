import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const TYPE_CONFIG = {
  warning: {
    bg: 'rgba(245,166,35,0.08)',
    iconName: 'alert-circle-outline',
    iconColor: colors.warning,
    textColor: '#96700A',
    borderColor: 'rgba(245,166,35,0.3)',
    actionColor: colors.warning,
  },
  info: {
    bg: colors.primaryPale,
    iconName: 'information-circle-outline',
    iconColor: colors.primary,
    textColor: colors.primary,
    borderColor: 'rgba(120,86,255,0.2)',
    actionColor: colors.primary,
  },
  success: {
    bg: 'rgba(18,201,159,0.08)',
    iconName: 'checkmark-circle-outline',
    iconColor: colors.success,
    textColor: '#0A7A5E',
    borderColor: 'rgba(18,201,159,0.25)',
    actionColor: colors.success,
  },
  error: {
    bg: 'rgba(232,75,120,0.08)',
    iconName: 'warning-outline',
    iconColor: colors.error,
    textColor: '#A01044',
    borderColor: 'rgba(232,75,120,0.25)',
    actionColor: colors.error,
  },
};

export default function SafetyBanner({
  type = 'info',
  message,
  onDismiss,
  onAction,
  actionLabel,
}) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.info;

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: cfg.bg, borderColor: cfg.borderColor },
      ]}
    >
      <Ionicons name={cfg.iconName} size={17} color={cfg.iconColor} style={styles.leadIcon} />

      <Text style={[styles.messageText, { color: cfg.textColor }]} numberOfLines={3}>
        {message}
      </Text>

      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.actionButton, { borderColor: cfg.actionColor }]}
        >
          <Text style={[styles.actionText, { color: cfg.actionColor }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}

      {onDismiss ? (
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.dismissButton}
        >
          <Ionicons name="close" size={15} color={cfg.textColor} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  leadIcon: {
    flexShrink: 0,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  actionButton: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dismissButton: {
    flexShrink: 0,
    padding: 2,
  },
});
