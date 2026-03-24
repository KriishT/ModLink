import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    bg: 'rgba(245,166,35,0.1)',
    text: colors.warning,
    icon: 'time-outline',
  },
  accepted: {
    label: 'Accepted',
    bg: 'rgba(18,201,159,0.1)',
    text: colors.success,
    icon: 'checkmark-circle-outline',
  },
  confirmed: {
    label: 'Confirmed',
    bg: 'rgba(18,201,159,0.1)',
    text: colors.success,
    icon: 'checkmark-done-circle-outline',
  },
  completed: {
    label: 'Completed',
    bg: 'rgba(90,90,120,0.08)',
    text: colors.textSecondary,
    icon: 'archive-outline',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'rgba(232,75,120,0.1)',
    text: colors.error,
    icon: 'close-circle-outline',
  },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatCurrency(amount) {
  if (amount == null) return '—';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function Avatar({ uri, name, size = 48 }) {
  const initials = name
    ? name.trim().split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
        resizeMode="cover"
      />
    );
  }
  return (
    <View
      style={[
        styles.avatarPlaceholder,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarInitials, { fontSize: size * 0.33 }]}>{initials}</Text>
    </View>
  );
}

export default function BookingCard({ booking, userType, onPress }) {
  if (!booking) return null;

  const { shootType, shootDate, shootTime, duration, paymentAmount, status, model, brand } = booking;

  const statusKey = (status ?? 'pending').toLowerCase();
  const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending;

  const isModelViewing = userType === 'model';
  const displayName = isModelViewing
    ? brand?.brandName ?? 'Unknown Brand'
    : model?.name ?? 'Unknown Model';
  const avatarUri = isModelViewing ? brand?.logoUrl : model?.profileImageUrl;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.topRow}>
        <Avatar uri={avatarUri} name={displayName} size={50} />

        <View style={styles.mainInfo}>
          <Text style={styles.displayName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.shootType} numberOfLines={1}>
            {shootType ?? 'Photo Shoot'}
          </Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.textLight} />
            <Text style={styles.dateText}>
              {'  '}{formatDate(shootDate)}
              {shootTime ? `  ·  ${formatTime(shootTime)}` : ''}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.border} />
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.paymentBlock}>
          <Text style={styles.paymentAmount}>{formatCurrency(paymentAmount)}</Text>
          <Text style={styles.paymentLabel}>Payment</Text>
        </View>

        {duration ? (
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={11} color={colors.textSecondary} />
            <Text style={styles.durationText}> {duration}</Text>
          </View>
        ) : null}

        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Ionicons name={statusCfg.icon} size={12} color={statusCfg.text} />
          <Text style={[styles.statusText, { color: statusCfg.text }]}>{'  '}{statusCfg.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#7856FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    backgroundColor: colors.primaryPale,
  },
  avatarPlaceholder: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontWeight: '700',
    color: colors.primary,
  },
  mainInfo: {
    flex: 1,
    gap: 2,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  shootType: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: colors.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentBlock: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  paymentLabel: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
