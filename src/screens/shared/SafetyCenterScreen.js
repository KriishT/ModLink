import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { supabase } from '../../utils/supabase';

// ─── accordion data ───────────────────────────────────────────────────────────

const RESOURCES = [
  {
    id: 'safety-guidelines',
    title: 'Safety Guidelines',
    icon: 'shield-outline',
    subsections: [
      {
        heading: 'Before the Shoot',
        points: [
          'Always verify the brand/model on ModLink before confirming',
          'Share shoot location and schedule with a trusted contact',
          'Review and sign the contract before the day',
          'Check the location on Google Maps beforehand',
          'Confirm payment terms are clear in writing',
        ],
      },
      {
        heading: 'During the Shoot',
        points: [
          'Stay within agreed shoot scope — no unplanned changes',
          'Avoid accepting drinks or food from unverified parties',
          'Keep your phone charged and accessible',
          'Trust your instincts — leave immediately if uncomfortable',
          'Use ModLink messaging, not personal numbers',
        ],
      },
      {
        heading: 'If Something Goes Wrong',
        points: [
          'Call emergency services (112) if in immediate danger',
          'Leave the location immediately if you feel unsafe',
          'Report the user through ModLink right away',
          'Contact your emergency contact',
          'Document everything — screenshots, dates, messages',
        ],
      },
    ],
  },
  {
    id: 'know-your-rights',
    title: 'Know Your Rights',
    icon: 'documents-outline',
    subsections: [
      {
        heading: 'Contract Basics',
        points: [
          'You are never obligated to work without a signed contract',
          'You can decline usage rights you are uncomfortable with',
          'Modifications to agreed deliverables require your consent',
          'You have the right to review any content before it is published',
        ],
      },
      {
        heading: 'Usage Rights Explained',
        points: [
          'Commercial use: brand can use images in paid advertising',
          'Editorial use: magazines, news — not direct promotion',
          'Social media: limited to the brand\'s own profiles',
          'Check the license duration — default on ModLink is 1 year',
        ],
      },
      {
        heading: 'Payment Protection',
        points: [
          'Payment should always be made through ModLink',
          'Never accept cash without a written record',
          'Raise a dispute within 7 days if unpaid after approval',
          'ModLink holds payments in escrow until content is approved',
        ],
      },
    ],
  },
  {
    id: 'account-security',
    title: 'Account Security',
    icon: 'lock-closed-outline',
    subsections: [
      {
        heading: 'Two-Factor Authentication',
        points: [
          'Enable 2FA in Settings > Account for extra protection',
          'Use an authenticator app rather than SMS when possible',
          'Never share your OTP with anyone, including ModLink support',
        ],
      },
      {
        heading: 'Trusted Devices',
        points: [
          'Review devices logged into your account regularly',
          'Log out of any device you no longer use',
          'Change your password if you suspect unauthorised access',
        ],
      },
    ],
  },
];

// ─── AccordionSection ─────────────────────────────────────────────────────────

function AccordionSection({ section }) {
  const [open, setOpen] = useState(false);
  const animHeight = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  const toggle = () => {
    if (!open) {
      // Expand
      Animated.spring(animHeight, {
        toValue: contentHeight,
        useNativeDriver: false,
        friction: 8,
        tension: 60,
      }).start();
    } else {
      Animated.timing(animHeight, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }).start();
    }
    setOpen((v) => !v);
  };

  return (
    <View style={styles.accordionWrap}>
      <TouchableOpacity style={styles.accordionHeader} onPress={toggle} activeOpacity={0.8}>
        <View style={styles.accordionIconWrap}>
          <Ionicons name={section.icon} size={18} color={colors.primary} />
        </View>
        <Text style={styles.accordionTitle}>{section.title}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textLight}
        />
      </TouchableOpacity>

      <Animated.View style={[styles.accordionBody, { height: animHeight, overflow: 'hidden' }]}>
        {/* Hidden measurer */}
        <View
          style={styles.measureWrap}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && h !== contentHeight) {
              setContentHeight(h);
              if (open) animHeight.setValue(h);
            }
          }}
        >
          {section.subsections.map((sub, si) => (
            <View key={si} style={styles.subsection}>
              <Text style={styles.subsectionHeading}>{sub.heading}</Text>
              {sub.points.map((pt, pi) => (
                <View key={pi} style={styles.pointRow}>
                  <View style={styles.pointBullet} />
                  <Text style={styles.pointText}>{pt}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// ─── QuickActionChip ─────────────────────────────────────────────────────────

function QuickActionChip({ icon, label, color = colors.primary, onPress }) {
  return (
    <TouchableOpacity style={[styles.chip, { borderColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── ReportHistoryItem ───────────────────────────────────────────────────────

function ReportHistoryItem({ report }) {
  const date = new Date(report.created_at);
  const dateStr = isNaN(date)
    ? ''
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const statusColor =
    report.status === 'resolved'
      ? colors.success
      : report.status === 'under_review'
      ? colors.warning
      : colors.textLight;

  return (
    <View style={styles.reportItem}>
      <View style={styles.reportTop}>
        <Text style={styles.reportTarget} numberOfLines={1}>
          {report.reported_user_name ?? 'Unknown User'}
        </Text>
        <Text style={[styles.reportStatus, { color: statusColor }]}>
          {report.status ? report.status.replace('_', ' ') : 'Submitted'}
        </Text>
      </View>
      <Text style={styles.reportReason} numberOfLines={2}>
        {report.reason ?? '—'}
      </Text>
      <Text style={styles.reportDate}>{dateStr}</Text>
    </View>
  );
}

// ─── screen ─────────────────────────────────────────────────────────────────

export default function SafetyCenterScreen({ navigation }) {
  const { user } = useAuth();
  const [reportHistory, setReportHistory] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const loadReports = useCallback(async () => {
    if (!user) return;
    setLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          created_at,
          reason,
          status,
          reported_user_name:profiles!reports_reported_id_fkey(full_name)
        `)
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error) {
        const normalized = (data ?? []).map((r) => ({
          ...r,
          reported_user_name:
            typeof r.reported_user_name === 'object'
              ? r.reported_user_name?.full_name
              : r.reported_user_name,
        }));
        setReportHistory(normalized);
      }
    } catch (err) {
      console.error('SafetyCenterScreen loadReports error:', err.message);
    } finally {
      setLoadingReports(false);
    }
  }, [user]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleCall = () => {
    Linking.openURL('tel:112');
  };

  const handleShareLocation = () => {
    // In a real app integrate with expo-location + SMS
    Linking.openURL('sms:');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Center</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Emergency card */}
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyTextWrap}>
            <Text style={styles.emergencyIcon}>🚨</Text>
            <View>
              <Text style={styles.emergencyTitle}>In an Emergency</Text>
              <Text style={styles.emergencySubtitle}>
                Call national emergency services immediately
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.emergencyCallBtn} onPress={handleCall} activeOpacity={0.88}>
            <Ionicons name="call" size={20} color={colors.surface} />
            <Text style={styles.emergencyCallText}>Call 112</Text>
          </TouchableOpacity>
        </View>

        {/* Quick actions */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.chipsRow}>
            <QuickActionChip
              icon="flag-outline"
              label="Report User"
              color={colors.error}
              onPress={() => navigation.navigate('ReportIssueScreen')}
            />
            <QuickActionChip
              icon="ban-outline"
              label="Block User"
              color={colors.warning}
              onPress={() => navigation.navigate('BlockListScreen')}
            />
            <QuickActionChip
              icon="location-outline"
              label="Share Location"
              color={colors.success}
              onPress={handleShareLocation}
            />
          </View>
        </View>

        {/* Resources accordion */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <View style={styles.accordionContainer}>
            {RESOURCES.map((section, i) => (
              <React.Fragment key={section.id}>
                <AccordionSection section={section} />
                {i < RESOURCES.length - 1 && <View style={styles.accordionDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Report history */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Your Report History</Text>
          {!loadingReports && reportHistory.length === 0 ? (
            <View style={styles.emptyReports}>
              <Ionicons name="checkmark-circle-outline" size={32} color={colors.success} />
              <Text style={styles.emptyReportsText}>No reports submitted yet</Text>
            </View>
          ) : (
            <View style={styles.reportListCard}>
              {reportHistory.map((r, i) => (
                <React.Fragment key={r.id}>
                  <ReportHistoryItem report={r} />
                  {i < reportHistory.length - 1 && (
                    <View style={styles.reportDivider} />
                  )}
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  // Emergency card
  emergencyCard: {
    backgroundColor: '#FF3B30',
    borderRadius: 20,
    padding: 18,
    gap: 14,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  emergencyTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emergencyIcon: {
    fontSize: 30,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.surface,
  },
  emergencySubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  emergencyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  emergencyCallText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.surface,
    letterSpacing: 0.5,
  },
  // Quick actions
  sectionBlock: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Accordion
  accordionContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  accordionDivider: {
    height: 1,
    backgroundColor: colors.background,
  },
  accordionWrap: {},
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  accordionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  accordionBody: {},
  measureWrap: {
    position: 'absolute',
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  subsection: {
    marginBottom: 14,
  },
  subsectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  pointBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
    flexShrink: 0,
  },
  pointText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  // Report history
  emptyReports: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyReportsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  reportListCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reportItem: {
    padding: 14,
    gap: 4,
  },
  reportTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportTarget: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  reportStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  reportReason: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  reportDate: {
    fontSize: 11,
    color: colors.textLight,
  },
  reportDivider: {
    height: 1,
    backgroundColor: colors.background,
    marginHorizontal: 14,
  },
});
