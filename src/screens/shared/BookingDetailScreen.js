import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { colors } from '../../theme/colors';
import { supabase } from '../../utils/supabase';
import PrimaryButton from '../../components/PrimaryButton';

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(t) {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

const STATUS_COLOR = {
  pending: colors.warning,
  accepted: colors.success,
  confirmed: colors.success,
  completed: colors.textSecondary,
  rejected: colors.error,
  cancelled: colors.error,
};

const STATUS_BG = {
  pending: 'rgba(255,179,71,0.15)',
  accepted: 'rgba(0,212,170,0.12)',
  confirmed: 'rgba(0,212,170,0.12)',
  completed: 'rgba(107,107,107,0.1)',
  rejected: 'rgba(255,107,157,0.12)',
  cancelled: 'rgba(255,107,157,0.12)',
};

const SAFETY_ITEMS = [
  'Share your location with a trusted contact',
  'Verify the shooting location in advance',
  'Have the brand\'s contact details saved',
  'Know the nearest hospital/police station',
  'Trust your instincts – leave if uncomfortable',
];

// ─── small presentational components ─────────────────────────────────────────

function SectionCard({ title, children }) {
  return (
    <View style={styles.sectionCard}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

function DetailRow({ icon, label, value, hidden }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={16} color={colors.primary} style={styles.detailIcon} />
      <View style={styles.detailBody}>
        <Text style={styles.detailLabel}>{label}</Text>
        {hidden ? (
          <View style={styles.hiddenWrap}>
            <Ionicons name="lock-closed" size={12} color={colors.textLight} />
            <Text style={styles.hiddenText}> Revealed after confirmation</Text>
          </View>
        ) : (
          <Text style={styles.detailValue}>{value ?? '—'}</Text>
        )}
      </View>
    </View>
  );
}

function StatusBadge({ status }) {
  const s = (status ?? 'pending').toLowerCase();
  return (
    <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[s] ?? STATUS_BG.pending }]}>
      <Text style={[styles.statusText, { color: STATUS_COLOR[s] ?? colors.warning }]}>
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </Text>
    </View>
  );
}

// ─── SafetyChecklist ─────────────────────────────────────────────────────────

function SafetyChecklist() {
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState(SAFETY_ITEMS.map(() => false));

  const toggle = (i) =>
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.safetyHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
        <Text style={styles.safetyTitle}>Safety Checklist</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textLight}
          style={{ marginLeft: 'auto' }}
        />
      </TouchableOpacity>
      {expanded &&
        SAFETY_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.checkRow}
            onPress={() => toggle(i)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={checked[i] ? 'checkbox' : 'square-outline'}
              size={20}
              color={checked[i] ? colors.success : colors.border}
            />
            <Text style={[styles.checkText, checked[i] && styles.checkTextDone]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
    </View>
  );
}

// ─── DeclineModal ─────────────────────────────────────────────────────────────

function DeclineModal({ visible, onConfirm, onCancel }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Decline Booking?</Text>
          <Text style={styles.modalBody}>
            Are you sure you want to decline this booking? This action cannot be undone.
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancel} onPress={onCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalDecline} onPress={onConfirm}>
              <Text style={styles.modalDeclineText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── screen ─────────────────────────────────────────────────────────────────

export default function BookingDetailScreen({ route, navigation }) {
  const { bookingId } = route.params ?? {};
  const { user } = useAuth();
  const { profile } = useUser();
  const userType = profile?.user_type ?? 'model';

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  const loadBooking = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          model_profile:profiles!bookings_model_id_fkey(id, full_name, profile_image_url),
          brand_profile:profiles!bookings_brand_id_fkey(id, full_name, profile_image_url, brand_name),
          contract:contracts(id, signed_at, signed_by_model, signed_by_brand)
        `)
        .eq('id', bookingId)
        .single();
      if (error) throw error;
      setBooking(data);
    } catch (err) {
      console.error('loadBooking error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const updateStatus = async (status) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);
      if (error) throw error;
      await loadBooking();
      Alert.alert('Success', `Booking ${status === 'accepted' ? 'accepted' : 'declined'}.`);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = () => updateStatus('accepted');
  const handleDeclineConfirm = () => {
    setShowDeclineModal(false);
    updateStatus('rejected');
  };

  const handleCheckin = async () => {
    setActionLoading(true);
    try {
      await supabase
        .from('bookings')
        .update({ checked_in: true, checked_in_at: new Date().toISOString() })
        .eq('id', bookingId);
      Alert.alert('Checked In!', 'Your check-in has been recorded. Have a great shoot!');
      await loadBooking();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !booking) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading booking…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = (booking.status ?? 'pending').toLowerCase();
  const shootToday = isToday(booking.shoot_date);
  const locationRevealed = status === 'accepted' || status === 'confirmed' || status === 'completed';

  const otherName =
    userType === 'model'
      ? booking.brand_profile?.brand_name ?? booking.brand_profile?.full_name ?? 'Brand'
      : booking.model_profile?.full_name ?? 'Model';

  const contract = Array.isArray(booking.contract)
    ? booking.contract[0]
    : booking.contract ?? null;

  const deliverables = booking.deliverables
    ? typeof booking.deliverables === 'string'
      ? booking.deliverables.split(',').map((d) => d.trim())
      : booking.deliverables
    : [];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Booking with {otherName}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status badge */}
        <View style={styles.statusRow}>
          <StatusBadge status={status} />
          {shootToday && (
            <View style={styles.shootTodayBadge}>
              <Ionicons name="camera" size={13} color={colors.surface} />
              <Text style={styles.shootTodayText}> Shoot Day!</Text>
            </View>
          )}
        </View>

        {/* Shoot details */}
        <SectionCard title="Shoot Details">
          <DetailRow icon="calendar-outline" label="Date" value={formatDate(booking.shoot_date)} />
          <DetailRow icon="time-outline" label="Time" value={formatTime(booking.shoot_time)} />
          <DetailRow icon="hourglass-outline" label="Duration" value={booking.duration ?? '—'} />
          <DetailRow
            icon="location-outline"
            label="Location"
            value={booking.location}
            hidden={!locationRevealed}
          />
          <DetailRow
            icon="cash-outline"
            label="Payment"
            value={booking.payment_amount ? `₹${Number(booking.payment_amount).toLocaleString('en-IN')}` : '—'}
          />
          <DetailRow icon="color-palette-outline" label="Shoot Type" value={booking.shoot_type ?? '—'} />
        </SectionCard>

        {/* Deliverables */}
        {deliverables.length > 0 && (
          <SectionCard title="Deliverables">
            {deliverables.map((d, i) => (
              <View key={i} style={styles.deliverableRow}>
                <View style={styles.bullet} />
                <Text style={styles.deliverableText}>{d}</Text>
              </View>
            ))}
          </SectionCard>
        )}

        {/* Contract */}
        <SectionCard title="Contract">
          <View style={styles.contractRow}>
            <View style={styles.contractStatus}>
              <Ionicons
                name={contract?.signed_at ? 'checkmark-circle' : 'document-outline'}
                size={20}
                color={contract?.signed_at ? colors.success : colors.warning}
              />
              <Text style={[
                styles.contractStatusText,
                { color: contract?.signed_at ? colors.success : colors.warning },
              ]}>
                {contract?.signed_at ? 'Contract Signed' : 'Unsigned'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.reviewContractBtn}
              onPress={() =>
                navigation.navigate('ContractScreen', { bookingId: booking.id })
              }
            >
              <Text style={styles.reviewContractText}>Review Contract</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </SectionCard>

        {/* Safety checklist (pre-shoot) */}
        {(status === 'pending' || status === 'accepted' || status === 'confirmed') && (
          <SafetyChecklist />
        )}

        {/* Actions */}
        <View style={styles.actionsWrap}>
          {/* Pending — model viewing */}
          {status === 'pending' && userType === 'model' && (
            <>
              <PrimaryButton
                title="Accept Booking"
                onPress={handleAccept}
                loading={actionLoading}
              />
              <View style={{ height: 10 }} />
              <PrimaryButton
                title="Decline"
                variant="secondary"
                onPress={() => setShowDeclineModal(true)}
                disabled={actionLoading}
              />
            </>
          )}

          {/* Pending — brand viewing */}
          {status === 'pending' && userType === 'brand' && (
            <View style={styles.awaitingWrap}>
              <Ionicons name="time-outline" size={20} color={colors.warning} />
              <Text style={styles.awaitingText}>Awaiting model response…</Text>
            </View>
          )}

          {/* Accepted / confirmed */}
          {(status === 'accepted' || status === 'confirmed') && !shootToday && (
            <>
              <PrimaryButton
                title="Message Other Party"
                onPress={() =>
                  navigation.navigate('ChatScreen', {
                    matchId: booking.match_id,
                    otherName,
                  })
                }
              />
              {locationRevealed && (
                <>
                  <View style={{ height: 10 }} />
                  <PrimaryButton
                    title="View Location"
                    variant="secondary"
                    onPress={() => Alert.alert('Location', booking.location ?? 'Not set')}
                  />
                </>
              )}
            </>
          )}

          {/* Shoot day */}
          {(status === 'accepted' || status === 'confirmed') && shootToday && (
            <TouchableOpacity
              style={[styles.checkinBtn, actionLoading && { opacity: 0.6 }]}
              onPress={handleCheckin}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              <Ionicons name="location" size={20} color={colors.surface} />
              <Text style={styles.checkinText}>Check In</Text>
            </TouchableOpacity>
          )}

          {/* Completed */}
          {status === 'completed' && (
            <PrimaryButton
              title="Leave Review"
              onPress={() =>
                navigation.navigate('ReviewScreen', {
                  bookingId: booking.id,
                  otherName,
                })
              }
            />
          )}
        </View>
      </ScrollView>

      <DeclineModal
        visible={showDeclineModal}
        onConfirm={handleDeclineConfirm}
        onCancel={() => setShowDeclineModal(false)}
      />
    </SafeAreaView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  shootTodayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shootTodayText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.surface,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailIcon: {
    marginTop: 2,
  },
  detailBody: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginTop: 1,
  },
  hiddenWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  hiddenText: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  deliverableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  deliverableText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  contractRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contractStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contractStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewContractBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewContractText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  checkText: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },
  checkTextDone: {
    textDecorationLine: 'line-through',
    color: colors.textLight,
  },
  actionsWrap: {
    marginTop: 4,
  },
  awaitingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,179,71,0.1)',
    borderRadius: 14,
    padding: 16,
  },
  awaitingText: {
    fontSize: 15,
    color: colors.warning,
    fontWeight: '600',
  },
  checkinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success,
    borderRadius: 16,
    height: 54,
  },
  checkinText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
  // Decline modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalDecline: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  modalDeclineText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
});
