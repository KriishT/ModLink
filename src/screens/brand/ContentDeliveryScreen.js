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
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../utils/supabase';
import PrimaryButton from '../../components/PrimaryButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMB_SIZE = (SCREEN_WIDTH - 40 - 16) / 3; // 3-column grid with padding

const MOCK_CONTENT = [
  { id: 'c1', url: null, type: 'photo' },
  { id: 'c2', url: null, type: 'photo' },
  { id: 'c3', url: null, type: 'photo' },
  { id: 'c4', url: null, type: 'video' },
  { id: 'c5', url: null, type: 'photo' },
];

function ContentThumb({ item, index }) {
  return (
    <View style={styles.thumbContainer}>
      {item.url ? (
        <Image source={{ uri: item.url }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]}>
          <Ionicons
            name={item.type === 'video' ? 'videocam-outline' : 'image-outline'}
            size={24}
            color={colors.textLight}
          />
        </View>
      )}
      {item.type === 'video' && (
        <View style={styles.videoBadge}>
          <Ionicons name="play" size={10} color="#fff" />
        </View>
      )}
      <Text style={styles.thumbIndex}>{index + 1}</Text>
    </View>
  );
}

function DeliverableRow({ icon, label, delivered, agreed, met }) {
  return (
    <View style={styles.deliverableRow}>
      <View
        style={[
          styles.deliverableIcon,
          { backgroundColor: met ? 'rgba(0,212,170,0.12)' : 'rgba(255,179,71,0.12)' },
        ]}
      >
        <Ionicons name={icon} size={16} color={met ? colors.success : colors.warning} />
      </View>
      <View style={styles.deliverableInfo}>
        <Text style={styles.deliverableLabel}>{label}</Text>
        <Text style={styles.deliverableCount}>
          {delivered}/{agreed} delivered
        </Text>
      </View>
      {met ? (
        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
      ) : (
        <Ionicons name="time-outline" size={20} color={colors.warning} />
      )}
    </View>
  );
}

export default function ContentDeliveryScreen({ navigation, route }) {
  const { bookingId } = route?.params ?? {};
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  // Revisions modal
  const [revisionVisible, setRevisionVisible] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);

  // Approve modal
  const [approveVisible, setApproveVisible] = useState(false);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    fetchBookingAndContent();
  }, [bookingId]);

  const fetchBookingAndContent = async () => {
    if (!bookingId) {
      // Use mock data
      setBooking({
        id: 'mock',
        modelName: 'Aanya Sharma',
        shootType: 'Lookbook/Catalog',
        paymentAmount: 8000,
        numPhotos: 5,
        numVideos: 1,
        uploadedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        status: 'content_uploaded',
      });
      setContent(MOCK_CONTENT);
      setLoading(false);
      return;
    }

    try {
      const { data: bk, error } = await supabase
        .from('bookings')
        .select(`
          id, shoot_type, payment_amount, num_photos, num_videos, status,
          content_uploaded_at,
          model_profiles!model_id(
            profiles(full_name)
          ),
          content_items(id, file_url, file_type)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      setBooking({
        id: bk.id,
        modelName: bk.model_profiles?.profiles?.full_name ?? 'Model',
        shootType: bk.shoot_type,
        paymentAmount: bk.payment_amount,
        numPhotos: bk.num_photos || 0,
        numVideos: bk.num_videos || 0,
        uploadedAt: bk.content_uploaded_at,
        status: bk.status,
      });

      const items = (bk.content_items || []).map((ci) => ({
        id: ci.id,
        url: ci.file_url,
        type: ci.file_type || 'photo',
      }));
      setContent(items.length > 0 ? items : MOCK_CONTENT);
    } catch {
      setBooking({
        id: bookingId,
        modelName: 'Model',
        shootType: 'Photo Shoot',
        paymentAmount: 0,
        numPhotos: 5,
        numVideos: 1,
        uploadedAt: new Date().toISOString(),
        status: 'content_uploaded',
      });
      setContent(MOCK_CONTENT);
    } finally {
      setLoading(false);
    }
  };

  const hoursAgo = () => {
    if (!booking?.uploadedAt) return '';
    const diff = Date.now() - new Date(booking.uploadedAt).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'less than an hour';
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  const deliveredPhotos = content.filter((c) => c.type === 'photo').length;
  const deliveredVideos = content.filter((c) => c.type === 'video').length;
  const photosMet = deliveredPhotos >= (booking?.numPhotos || 0);
  const videosMet = deliveredVideos >= (booking?.numVideos || 0);
  const allMet = photosMet && videosMet;

  const handleRequestRevisions = async () => {
    if (!revisionNote.trim()) {
      Alert.alert('Required', 'Please describe what needs to be revised.');
      return;
    }
    setSubmittingRevision(true);
    try {
      if (bookingId) {
        await supabase.from('revision_requests').insert({
          booking_id: bookingId,
          requested_by: user.id,
          note: revisionNote,
        });
        await supabase
          .from('bookings')
          .update({ status: 'revision_requested' })
          .eq('id', bookingId);
      }
      setRevisionVisible(false);
      setRevisionNote('');
      Alert.alert('Revision Requested', 'The model has been notified of your feedback.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send revision request.');
    } finally {
      setSubmittingRevision(false);
    }
  };

  const handleApproveAndRelease = async () => {
    setReleasing(true);
    try {
      if (bookingId) {
        await supabase
          .from('bookings')
          .update({ status: 'completed', payment_status: 'released' })
          .eq('id', bookingId);
      }
      setApproveVisible(false);
      Alert.alert(
        'Payment Released!',
        `₹${Number(booking?.paymentAmount || 0).toLocaleString('en-IN')} has been released to ${booking?.modelName}.`,
        [
          {
            text: 'Leave a Review',
            onPress: () =>
              navigation.replace('ReviewScreen', { bookingId, modelName: booking?.modelName }),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to release payment.');
    } finally {
      setReleasing(false);
    }
  };

  const handleDispute = () => {
    Alert.alert(
      'Raise a Dispute',
      'If you believe there is an issue with the delivered content, our support team will review the case.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contact Support',
          onPress: () => navigation.navigate('Support', { bookingId }),
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle} numberOfLines={1}>
            Shoot with {booking?.modelName}
          </Text>
          <Text style={styles.headerSubtitle}>{booking?.shootType}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status banner */}
        <View style={styles.statusBanner}>
          <View style={styles.statusBannerIcon}>
            <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusBannerTitle}>Content Uploaded</Text>
            <Text style={styles.statusBannerSub}>
              {booking?.modelName} uploaded content {hoursAgo()} ago
            </Text>
          </View>
          {allMet ? (
            <View style={styles.allMetBadge}>
              <Ionicons name="checkmark" size={14} color={colors.success} />
              <Text style={styles.allMetText}>All done</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
          )}
        </View>

        {/* Content grid */}
        <Text style={styles.sectionTitle}>Delivered Content</Text>
        <FlatList
          data={content}
          keyExtractor={(item) => item.id}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={styles.contentGrid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item, index }) => (
            <ContentThumb item={item} index={index} />
          )}
        />

        {/* Deliverables checklist */}
        <Text style={styles.sectionTitle}>Deliverables Checklist</Text>
        <View style={styles.checklistCard}>
          <DeliverableRow
            icon="image-outline"
            label="Photos"
            delivered={deliveredPhotos}
            agreed={booking?.numPhotos || 0}
            met={photosMet}
          />
          <View style={styles.checklistDivider} />
          <DeliverableRow
            icon="videocam-outline"
            label="Videos"
            delivered={deliveredVideos}
            agreed={booking?.numVideos || 0}
            met={videosMet}
          />
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.revisionsBtn}
          onPress={() => setRevisionVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={18} color={colors.primary} />
          <Text style={styles.revisionsBtnText}>Request Revisions</Text>
        </TouchableOpacity>

        <PrimaryButton
          title={`Approve & Release ₹${Number(booking?.paymentAmount || 0).toLocaleString('en-IN')}`}
          onPress={() => setApproveVisible(true)}
          style={styles.approveBtn}
        />

        <TouchableOpacity
          style={styles.disputeBtn}
          onPress={handleDispute}
          activeOpacity={0.7}
        >
          <Ionicons name="warning-outline" size={14} color={colors.error} />
          <Text style={styles.disputeText}>Raise a Dispute</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Revisions modal */}
      <Modal
        visible={revisionVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRevisionVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.sheetDismissArea}
            onPress={() => setRevisionVisible(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Request Revisions</Text>
              <TouchableOpacity onPress={() => setRevisionVisible(false)}>
                <Ionicons name="close-circle" size={26} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetBody}>
              <Text style={styles.sheetBodyLabel}>
                Describe what needs to be revised:
              </Text>
              <View style={styles.textareaContainer}>
                <TextInput
                  style={styles.textarea}
                  placeholder="e.g. Photos 2 and 4 need better lighting. Please reshoot with the moodboard reference..."
                  placeholderTextColor={colors.textLight}
                  value={revisionNote}
                  onChangeText={setRevisionNote}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.sheetActions}>
                <TouchableOpacity
                  style={styles.sheetCancelBtn}
                  onPress={() => setRevisionVisible(false)}
                >
                  <Text style={styles.sheetCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sheetSubmitBtn}
                  onPress={handleRequestRevisions}
                  disabled={submittingRevision}
                >
                  {submittingRevision ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.sheetSubmitText}>Send Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Approve modal */}
      <Modal
        visible={approveVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setApproveVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="cash-outline" size={34} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Release Payment?</Text>
            <Text style={styles.modalBody}>
              This will release{' '}
              <Text style={styles.modalAmount}>
                ₹{Number(booking?.paymentAmount || 0).toLocaleString('en-IN')}
              </Text>{' '}
              to <Text style={{ fontWeight: '700' }}>{booking?.modelName}</Text>.{'\n'}
              Are you sure?
            </Text>

            <View style={styles.modalWarning}>
              <Ionicons name="information-circle-outline" size={14} color={colors.warning} />
              <Text style={styles.modalWarningText}>
                This action cannot be undone once confirmed.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setApproveVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleApproveAndRelease}
                disabled={releasing}
              >
                {releasing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm Release</Text>
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
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: colors.primaryPale,
  },
  statusBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(155,127,232,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  statusBannerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  allMetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,212,170,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  allMetText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  pendingBadge: {
    backgroundColor: 'rgba(255,179,71,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 14,
    marginTop: 4,
  },
  contentGrid: {
    marginBottom: 24,
  },
  gridRow: {
    gap: 8,
    marginBottom: 8,
  },
  thumbContainer: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  thumbEmpty: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primaryPale,
    borderStyle: 'dashed',
  },
  videoBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIndex: {
    position: 'absolute',
    bottom: 5,
    left: 6,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  checklistCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  deliverableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  deliverableIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliverableInfo: {
    flex: 1,
  },
  deliverableLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  deliverableCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  checklistDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  revisionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primaryPale,
    backgroundColor: colors.primary,
    marginBottom: 14,
  },
  revisionsBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  approveBtn: {
    marginBottom: 20,
  },
  disputeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  disputeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    textDecorationLine: 'underline',
  },
  // Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetDismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sheetBody: {
    padding: 20,
  },
  sheetBodyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  textareaContainer: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    padding: 14,
    marginBottom: 20,
  },
  textarea: {
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 100,
    lineHeight: 21,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
  },
  sheetCancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sheetSubmitBtn: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSubmitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
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
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
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
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 14,
  },
  modalAmount: {
    fontWeight: '900',
    color: colors.primary,
    fontSize: 16,
  },
  modalWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,179,71,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 24,
  },
  modalWarningText: {
    fontSize: 12,
    color: '#A06000',
    flex: 1,
    lineHeight: 17,
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
