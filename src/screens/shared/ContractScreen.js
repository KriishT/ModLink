import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(d) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// ─── ContractText — builds the template from booking data ────────────────────

function buildContractHtml(booking, modelName, brandName) {
  const payment = booking.payment_amount
    ? `₹${Number(booking.payment_amount).toLocaleString('en-IN')}`
    : '—';
  const deliverables = Array.isArray(booking.deliverables)
    ? booking.deliverables.join(', ')
    : booking.deliverables ?? '—';

  return `
<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; color: #1A1A1A; line-height: 1.7; padding: 0 20px; }
  h1 { text-align: center; font-size: 20px; letter-spacing: 2px; color: #1A1A1A; margin-bottom: 4px; }
  h2 { font-size: 14px; text-align: center; color: #6B6B6B; font-weight: normal; margin-top: 0; }
  hr { border: none; border-top: 1px solid #E5E5E5; margin: 20px 0; }
  .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .label { color: #6B6B6B; font-size: 13px; }
  .value { font-weight: bold; font-size: 13px; }
  .highlight { color: #9B7FE8; font-weight: bold; }
  .section { margin: 20px 0; }
  .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #9B7FE8; margin-bottom: 8px; }
  p { font-size: 13px; margin: 6px 0; }
</style></head><body>
<h1>MODELING SERVICES AGREEMENT</h1>
<h2>This agreement is entered into between the parties below.</h2>
<hr/>
<div class="section">
  <div class="row"><span class="label">Date of Agreement</span><span class="value">${formatDate(new Date().toISOString())}</span></div>
  <div class="row"><span class="label">Model</span><span class="value highlight">${modelName}</span></div>
  <div class="row"><span class="label">Brand</span><span class="value highlight">${brandName}</span></div>
  <div class="row"><span class="label">Shoot Date</span><span class="value highlight">${formatDate(booking.shoot_date)}</span></div>
  <div class="row"><span class="label">Duration</span><span class="value highlight">${booking.duration ?? '—'}</span></div>
  <div class="row"><span class="label">Payment</span><span class="value highlight">${payment}</span></div>
</div>
<hr/>
<div class="section">
  <div class="section-title">Usage Rights</div>
  <p><span class="highlight">${booking.shoot_type ?? 'Commercial'} use only</span>, limited to a <span class="highlight">1-year license</span> from the shoot date. No resale or redistribution without written consent.</p>
</div>
<div class="section">
  <div class="section-title">Deliverables</div>
  <p><span class="highlight">${deliverables}</span></p>
</div>
<div class="section">
  <div class="section-title">Cancellation Policy</div>
  <p><span class="highlight">48-hour notice required</span> for cancellation. <span class="highlight">Full payment due if cancelled less than 24 hours</span> before the shoot.</p>
</div>
<hr/>
<div class="section">
  <div class="section-title">Model Obligations</div>
  <p>The model agrees to be on time, camera-ready, and professional for the duration of the shoot.</p>
</div>
<div class="section">
  <div class="section-title">Brand Obligations</div>
  <p>The brand agrees to pay in full within <span class="highlight">24 hours of content approval</span>.</p>
</div>
</body></html>`;
}

// ─── HighlightedTerm ──────────────────────────────────────────────────────────

function Term({ label, value }) {
  return (
    <View style={styles.termRow}>
      <Text style={styles.termLabel}>{label}</Text>
      <Text style={styles.termValue}>{value}</Text>
    </View>
  );
}

// ─── screen ─────────────────────────────────────────────────────────────────

export default function ContractScreen({ route, navigation }) {
  const { bookingId } = route.params ?? {};
  const { user } = useAuth();
  const { profile } = useUser();
  const userType = profile?.user_type ?? 'model';

  const [booking, setBooking] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  const loadData = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const { data: bData, error: bErr } = await supabase
        .from('bookings')
        .select(`
          *,
          model_profile:profiles!bookings_model_id_fkey(id, full_name),
          brand_profile:profiles!bookings_brand_id_fkey(id, full_name, brand_name)
        `)
        .eq('id', bookingId)
        .single();
      if (bErr) throw bErr;
      setBooking(bData);

      const { data: cData } = await supabase
        .from('contracts')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();
      setContract(cData);
    } catch (err) {
      console.error('ContractScreen load error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── download PDF ──────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!booking) return;
    try {
      const modelName = booking.model_profile?.full_name ?? 'Model';
      const brandName =
        booking.brand_profile?.brand_name ??
        booking.brand_profile?.full_name ??
        'Brand';
      const html = buildContractHtml(booking, modelName, brandName);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Download Contract',
        });
      } else {
        Alert.alert('PDF Saved', `Saved to: ${uri}`);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // ── sign contract ─────────────────────────────────────────────────────────
  const handleSign = () => {
    Alert.alert(
      'Sign Contract',
      'By confirming, you agree to be legally bound by the terms of this Modeling Services Agreement.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Sign',
          onPress: async () => {
            setSigning(true);
            try {
              const signedAt = new Date().toISOString();
              const signedField =
                userType === 'model' ? 'signed_by_model' : 'signed_by_brand';

              if (contract?.id) {
                await supabase
                  .from('contracts')
                  .update({ [signedField]: true, signed_at: signedAt })
                  .eq('id', contract.id);
              } else {
                await supabase.from('contracts').insert({
                  booking_id: bookingId,
                  [signedField]: true,
                  signed_at: signedAt,
                });
              }
              await loadData();
              Alert.alert('Signed!', 'Your signature has been recorded.');
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setSigning(false);
            }
          },
        },
      ]
    );
  };

  const isSigned =
    contract?.signed_at &&
    (userType === 'model' ? contract.signed_by_model : contract.signed_by_brand);

  if (loading || !booking) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading contract…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const modelName = booking.model_profile?.full_name ?? 'Model';
  const brandName =
    booking.brand_profile?.brand_name ??
    booking.brand_profile?.full_name ??
    'Brand';
  const payment = booking.payment_amount
    ? `₹${Number(booking.payment_amount).toLocaleString('en-IN')}`
    : '—';
  const deliverables = Array.isArray(booking.deliverables)
    ? booking.deliverables.join(', ')
    : booking.deliverables ?? '—';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contract</Text>
        <TouchableOpacity onPress={handleDownload} style={styles.headerBtn}>
          <Ionicons name="download-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.contractTitle}>MODELING SERVICES{'\n'}AGREEMENT</Text>
        <View style={styles.divider} />

        {/* Highlighted key terms */}
        <View style={styles.section}>
          <Term label="Date" value={formatDate(new Date().toISOString())} />
          <Term label="Model" value={modelName} />
          <Term label="Brand" value={brandName} />
          <Term label="Shoot Date" value={formatDate(booking.shoot_date)} />
          <Term label="Duration" value={booking.duration ?? '—'} />
          <Term label="Payment" value={payment} />
        </View>

        <View style={styles.divider} />

        {/* Usage rights */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Usage Rights</Text>
          <Text style={styles.bodyText}>
            <Text style={styles.highlight}>{booking.shoot_type ?? 'Commercial'} use only</Text>
            , limited to a{' '}
            <Text style={styles.highlight}>1-year license</Text>
            {' '}from the shoot date. No resale or redistribution without written consent.
          </Text>
        </View>

        {/* Deliverables */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Deliverables</Text>
          <Text style={styles.bodyText}>
            <Text style={styles.highlight}>{deliverables}</Text>
          </Text>
        </View>

        {/* Cancellation */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Cancellation Policy</Text>
          <Text style={styles.bodyText}>
            <Text style={styles.highlight}>48-hour notice required</Text>
            {' '}for cancellation.{' '}
            <Text style={styles.highlight}>Full payment due if cancelled less than 24 hours</Text>
            {' '}before the shoot.
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Obligations */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Model Obligations</Text>
          <Text style={styles.bodyText}>
            The model agrees to be on time, camera-ready, and professional for the duration of the shoot.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Brand Obligations</Text>
          <Text style={styles.bodyText}>
            The brand agrees to pay in full within{' '}
            <Text style={styles.highlight}>24 hours of content approval</Text>.
          </Text>
        </View>

        {/* Signed banner */}
        {isSigned && (
          <View style={styles.signedBanner}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={styles.signedText}>
              Signed at {formatDateTime(contract.signed_at)}
            </Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom actions */}
      {!isSigned ? (
        <View style={styles.actions}>
          <PrimaryButton
            title="Disagree"
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={styles.actionBtn}
          />
          <View style={{ width: 12 }} />
          <PrimaryButton
            title="Sign Contract"
            onPress={handleSign}
            loading={signing}
            style={styles.actionBtn}
          />
        </View>
      ) : (
        <View style={styles.actions}>
          <PrimaryButton
            title="Close"
            variant="secondary"
            onPress={() => navigation.goBack()}
          />
        </View>
      )}
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
    fontSize: 17,
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
    padding: 20,
  },
  contractTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 1.5,
    lineHeight: 28,
    marginVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  termLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  termValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
    textAlign: 'right',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  highlight: {
    color: colors.primary,
    fontWeight: '700',
  },
  signedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,212,170,0.1)',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  signedText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionBtn: {
    flex: 1,
  },
});
