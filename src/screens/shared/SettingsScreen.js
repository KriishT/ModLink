import React from 'react';
import {
  Alert, Linking, SafeAreaView, ScrollView,
  StyleSheet, Text, TouchableOpacity, View, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

const DARK = '#0D0B1F';

const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline',           label: 'Personal Information',  screen: 'PersonalInfoScreen' },
      { icon: 'shield-checkmark-outline', label: 'Verification Status',   screen: 'VerificationScreen' },
      { icon: 'card-outline',             label: 'Payment Details',       screen: 'PaymentDetailsScreen' },
      { icon: 'lock-closed-outline',      label: 'Change Password',       screen: 'ChangePasswordScreen' },
    ],
  },
  {
    title: 'Privacy & Safety',
    items: [
      { icon: 'ban-outline',  label: 'Block List',               screen: 'BlockListScreen' },
      { icon: 'eye-outline',  label: 'Who Can See My Profile',   screen: 'ProfileVisibilityScreen' },
      { icon: 'call-outline', label: 'Emergency Contact',        screen: 'EmergencyContactScreen' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: 'notifications-outline', label: 'Notification Settings', screen: 'NotificationSettingsScreen' },
      { icon: 'calendar-outline',      label: 'Availability',          screen: 'AvailabilityScreen' },
      { icon: 'briefcase-outline',     label: 'Work Preferences',      screen: 'WorkPreferencesScreen' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help Center',       screen: 'HelpCenterScreen' },
      { icon: 'flag-outline',        label: 'Report Issue',      screen: 'ReportIssueScreen' },
      { icon: 'heart-outline',       label: 'Safety Resources',  screen: 'SafetyCenterScreen' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { icon: 'document-text-outline', label: 'Terms of Service',    url: 'https://modlink.app/terms' },
      { icon: 'lock-open-outline',     label: 'Privacy Policy',      url: 'https://modlink.app/privacy' },
      { icon: 'contract-outline',      label: 'Contract Templates',  screen: 'ContractTemplatesScreen' },
    ],
  },
];

function SettingsRow({ item, navigation, isLast }) {
  const handlePress = () => {
    if (item.url) { Linking.openURL(item.url); }
    else if (item.screen) { navigation.navigate(item.screen); }
  };

  return (
    <>
      <TouchableOpacity style={styles.row} onPress={handlePress} activeOpacity={0.65}>
        <View style={styles.rowIconWrap}>
          <Ionicons name={item.icon} size={18} color={colors.primary} />
        </View>
        <Text style={styles.rowLabel}>{item.label}</Text>
        <Ionicons name="chevron-forward" size={15} color={colors.textLight} />
      </TouchableOpacity>
      {!isLast && <View style={styles.rowDivider} />}
    </>
  );
}

export default function SettingsScreen({ navigation }) {
  const { signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          try { await signOut(); }
          catch (err) { Alert.alert('Error', err.message); }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This is permanent and cannot be undone. All your data will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account', style: 'destructive',
          onPress: () => {
            Alert.alert('Request Sent', 'Your account deletion request has been submitted. You will receive a confirmation email within 24 hours.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* Dark header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Safety Center card */}
        <TouchableOpacity
          style={styles.safetyCard}
          onPress={() => navigation.navigate('SafetyCenterScreen')}
          activeOpacity={0.88}
        >
          <View style={styles.safetyIconWrap}>
            <Ionicons name="shield" size={26} color="#FFFFFF" />
          </View>
          <View style={styles.safetyTextWrap}>
            <Text style={styles.safetyTitle}>Safety Center</Text>
            <Text style={styles.safetySubtitle}>Emergency contacts &amp; resources</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        {/* Sections */}
        {SETTINGS_SECTIONS.map((section) => (
          <View key={section.title} style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <SettingsRow
                  key={item.label}
                  item={item}
                  navigation={navigation}
                  isLast={idx === section.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        {/* Log out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={17} color={DARK} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Delete account */}
        <TouchableOpacity style={styles.deleteLink} onPress={handleDeleteAccount}>
          <Text style={styles.deleteLinkText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK },

  /* Header */
  header: {
    backgroundColor: DARK, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 8,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 17, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.2,
  },

  /* Scroll */
  scroll: {
    flex: 1, backgroundColor: colors.background,
    borderTopLeftRadius: 26, borderTopRightRadius: 26, marginTop: -26,
  },
  scrollContent: { padding: 16, gap: 14, paddingTop: 20 },

  /* Safety card */
  safetyCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: DARK,
    borderRadius: 20, padding: 18, gap: 14,
    shadowColor: DARK, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 6,
  },
  safetyIconWrap: {
    width: 48, height: 48, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  safetyTextWrap: { flex: 1 },
  safetyTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  safetySubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  /* Sections */
  sectionBlock: { gap: 8 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: colors.surface, borderRadius: 18,
    shadowColor: '#0D0B1F', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  rowIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: colors.primaryPale,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  rowDivider: { height: 1, backgroundColor: colors.background, marginLeft: 62 },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 15,
    borderWidth: 1.5, borderColor: colors.border,
    shadowColor: '#0D0B1F', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: DARK },
  deleteLink: { alignItems: 'center', paddingVertical: 4 },
  deleteLinkText: { fontSize: 14, color: colors.error, fontWeight: '500', textDecorationLine: 'underline' },
});
