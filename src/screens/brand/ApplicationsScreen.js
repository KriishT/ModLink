import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../utils/supabase';
import PrimaryButton from '../../components/PrimaryButton';

const SORT_OPTIONS = ['Best Match', 'Highest Rated', 'Newest'];

const MOCK_APPLICATIONS = [
  {
    id: 'a1',
    model: {
      id: 'm1',
      name: 'Aanya Sharma',
      profileImageUrl: null,
      rating: 4.8,
      city: 'Mumbai',
      rate: 8000,
    },
    message: 'I love your brand aesthetic and would be thrilled to be part of this campaign!',
    appliedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    matchScore: 95,
  },
  {
    id: 'a2',
    model: {
      id: 'm2',
      name: 'Priya Nair',
      profileImageUrl: null,
      rating: 4.6,
      city: 'Bangalore',
      rate: 6500,
    },
    message: 'I specialise in clean editorial work — perfect for your lookbook.',
    appliedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    matchScore: 88,
  },
  {
    id: 'a3',
    model: {
      id: 'm3',
      name: 'Rhea Kapoor',
      profileImageUrl: null,
      rating: 4.9,
      city: 'Delhi',
      rate: 12000,
    },
    message: 'My portfolio speaks for itself — let me bring this campaign to life.',
    appliedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    matchScore: 92,
  },
];

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function AvatarCircle({ uri, name, size = 52 }) {
  const initials = name
    ? name.trim().split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
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
      <Text style={{ fontSize: size * 0.3, fontWeight: '700', color: colors.primary }}>
        {initials}
      </Text>
    </View>
  );
}

function ApplicantCard({ application, onViewProfile, onAccept }) {
  const { model, message, appliedAt, matchScore } = application;

  return (
    <View style={styles.applicantCard}>
      {/* Top row */}
      <View style={styles.cardTopRow}>
        <AvatarCircle uri={model.profileImageUrl} name={model.name} />

        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.modelName}>{model.name}</Text>
            {matchScore != null && (
              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>{matchScore}% match</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={styles.metaText}>{model.rating?.toFixed(1)}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Ionicons name="location-outline" size={12} color={colors.textLight} />
            <Text style={styles.metaText}>{model.city}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaRate}>
              ₹{Number(model.rate || 0).toLocaleString('en-IN')}/day
            </Text>
          </View>
        </View>
      </View>

      {/* Message */}
      {message ? (
        <View style={styles.messageBox}>
          <Text style={styles.messageText} numberOfLines={2}>
            "{message}"
          </Text>
        </View>
      ) : null}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.appliedTimeRow}>
          <Ionicons name="time-outline" size={12} color={colors.textLight} />
          <Text style={styles.appliedTime}>Applied {timeAgo(appliedAt)}</Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.viewProfileBtn}
            onPress={() => onViewProfile(model)}
            activeOpacity={0.8}
          >
            <Text style={styles.viewProfileBtnText}>View Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => onAccept(application)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={14} color="#fff" />
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function ApplicationsScreen({ navigation, route }) {
  const { jobId, shootTitle } = route?.params ?? {};
  const { user } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('Best Match');

  // Confirmation modal
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const fetchApplications = async () => {
    if (!jobId) {
      setApplications(MOCK_APPLICATIONS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('swipes')
        .select(`
          id,
          swiper_id,
          created_at,
          model_profile:profiles!swipes_swiper_id_fkey(
            full_name, profile_image_url, city, average_rating,
            model_profiles(rate_half_day, rate_full_day)
          )
        `)
        .eq('swiped_id', jobId)
        .eq('swipe_type', 'like')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setApplications(MOCK_APPLICATIONS);
      } else {
        const mapped = data.map((row) => ({
          id: row.id,
          model: {
            id: row.swiper_id,
            name: row.model_profile?.full_name ?? 'Model',
            profileImageUrl: row.model_profile?.profile_image_url ?? null,
            rating: row.model_profile?.average_rating ?? 0,
            city: row.model_profile?.city ?? '—',
            rate: row.model_profile?.model_profiles?.rate_half_day
               || row.model_profile?.model_profiles?.rate_full_day
               || 0,
          },
          message: '',
          appliedAt: row.created_at,
        }));
        setApplications(mapped);
      }
    } catch {
      setApplications(MOCK_APPLICATIONS);
    } finally {
      setLoading(false);
    }
  };

  const sortedApplications = [...applications].sort((a, b) => {
    if (sortBy === 'Best Match') {
      return (b.matchScore ?? 0) - (a.matchScore ?? 0);
    }
    if (sortBy === 'Highest Rated') {
      return (b.model.rating ?? 0) - (a.model.rating ?? 0);
    }
    // Newest
    return new Date(b.appliedAt) - new Date(a.appliedAt);
  });

  const handleAccept = (application) => {
    setSelectedApplication(application);
    setConfirmVisible(true);
  };

  const confirmAccept = async () => {
    if (!selectedApplication) return;
    setAccepting(true);
    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          brand_id: user.id,
          model_id: selectedApplication.model.id,
          job_id: jobId || null,
          status: 'accepted',
          payment_amount: selectedApplication.model.rate,
        })
        .select()
        .single();

      if (error) throw error;

      setConfirmVisible(false);
      Alert.alert(
        'Application Accepted!',
        `You've accepted ${selectedApplication.model.name}. A booking has been created.`,
        [
          {
            text: 'View Booking',
            onPress: () => navigation.navigate('BookingDetail', { bookingId: booking.id }),
          },
          { text: 'Stay Here', style: 'cancel' },
        ]
      );

      setApplications((prev) =>
        prev.filter((a) => a.id !== selectedApplication.id)
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to accept application.');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Applications</Text>
          {shootTitle ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {shootTitle}
            </Text>
          ) : null}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Sort bar */}
      <View style={styles.sortBar}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.sortChip, sortBy === opt && styles.sortChipActive]}
            onPress={() => setSortBy(opt)}
          >
            <Text
              style={[styles.sortChipText, sortBy === opt && styles.sortChipTextActive]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : sortedApplications.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="people-outline" size={48} color={colors.primaryPale} />
          <Text style={styles.emptyTitle}>No applications yet</Text>
          <Text style={styles.emptySubtitle}>
            Models will appear here when they apply to your casting.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedApplications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.countText}>
              {sortedApplications.length} applicant
              {sortedApplications.length !== 1 ? 's' : ''}
            </Text>
          }
          renderItem={({ item }) => (
            <ApplicantCard
              application={item}
              onViewProfile={(model) =>
                navigation.navigate('ModelProfile', { modelId: model.id })
              }
              onAccept={handleAccept}
            />
          )}
        />
      )}

      {/* Confirmation modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="checkmark-circle" size={36} color={colors.success} />
            </View>
            <Text style={styles.modalTitle}>Accept Application?</Text>
            <Text style={styles.modalBody}>
              You're about to accept{' '}
              <Text style={{ fontWeight: '700' }}>
                {selectedApplication?.model?.name}
              </Text>
              . A booking will be created and they will be notified.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmAccept}
                disabled={accepting}
              >
                {accepting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 1,
    maxWidth: 200,
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  sortLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginRight: 4,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  sortChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sortChipTextActive: {
    color: colors.primary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 48,
  },
  countText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 12,
  },
  applicantCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  matchBadge: {
    backgroundColor: 'rgba(0,212,170,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  metaDot: {
    fontSize: 12,
    color: colors.textLight,
  },
  metaRate: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  messageBox: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryPale,
  },
  messageText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appliedTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appliedTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewProfileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primaryPale,
    backgroundColor: colors.primary,
  },
  viewProfileBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,212,170,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalConfirmBtn: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
