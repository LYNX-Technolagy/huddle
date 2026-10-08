// src/screens/PrivacyScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { colors, spacing, typography } from '../design';
import type { RootStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Privacy'>;

// -----------------------------------------------------------------------------
// Config — hosted legal pages + support contact
// -----------------------------------------------------------------------------

const URLS = {
  privacyPolicy: 'https://joinhuddleup.netlify.app/privacy',
  termsOfService: 'https://joinhuddleup.netlify.app/terms',
  communityGuidelines: 'https://joinhuddleup.netlify.app/guidelines',
  agePolicy: 'https://joinhuddleup.netlify.app/age-policy',
  support:
    'mailto:lynxtechza@gmail.com?subject=Huddle%20Support',
  reportProblem:
    'mailto:lynxtechza@gmail.com?subject=Huddle%20Bug%20Report',
};

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const BUILD_NUMBER =
  Constants.expoConfig?.ios?.buildNumber ??
  Constants.expoConfig?.android?.versionCode?.toString() ??
  'dev';

// -----------------------------------------------------------------------------
// Cross-platform alert helper
// -----------------------------------------------------------------------------

function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    window.alert(`${title}${message ? `\n\n${message}` : ''}`);
  } else {
    Alert.alert(title, message);
  }
}

// -----------------------------------------------------------------------------
// Screen
// -----------------------------------------------------------------------------

export default function PrivacyScreen() {
  const navigation = useNavigation<NavProp>();

  const openUrl = async (url: string, label: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        showAlert('Cannot open link', `We couldn't open ${label}.`);
        return;
      }
      await Linking.openURL(url);
    } catch {
      showAlert('Cannot open link', `We couldn't open ${label}.`);
    }
  };

  const handleDownloadData = () => {
    navigation.navigate('DownloadData');
  };

  const handleDeleteAccount = () => {
    navigation.navigate('DeleteAccount');
  };

  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PRIVACY & LEGAL</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.introBlock}>
          <Text style={styles.introEyebrow}>YOUR RIGHTS</Text>
          <Text style={styles.introTitle}>WE KEEP IT SIMPLE</Text>
          <Text style={styles.introText}>
            Read our policies, control your data, and reach out if you need
            help. We never sell your information to third parties.
          </Text>
        </View>

        {/* LEGAL */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>LEGAL</Text>
            <View style={styles.sectionLine} />
          </View>

          <MenuRow
            icon="document-text-outline"
            label="Privacy Policy"
            onPress={() => openUrl(URLS.privacyPolicy, 'Privacy Policy')}
          />
          <MenuRow
            icon="reader-outline"
            label="Terms of Service"
            onPress={() => openUrl(URLS.termsOfService, 'Terms of Service')}
          />
          <MenuRow
            icon="people-outline"
            label="Community Guidelines"
            onPress={() =>
              openUrl(URLS.communityGuidelines, 'Community Guidelines')
            }
          />
          <MenuRow
            icon="shield-checkmark-outline"
            label="Age & Content Policy"
            onPress={() => openUrl(URLS.agePolicy, 'Age Policy')}
          />
        </View>

        {/* YOUR DATA */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>YOUR DATA</Text>
            <View style={styles.sectionLine} />
          </View>

          <MenuRow
            icon="download-outline"
            label="Download My Data"
            onPress={handleDownloadData}
          />
          <MenuRow
            icon="trash-outline"
            label="Delete My Account"
            onPress={handleDeleteAccount}
            destructive
          />
        </View>

        {/* ABOUT */}
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ABOUT</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.textMuted}
            />
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>
              {APP_VERSION} ({BUILD_NUMBER})
            </Text>
          </View>

          <MenuRow
            icon="bug-outline"
            label="Report a Problem"
            onPress={() => openUrl(URLS.reportProblem, 'Report')}
          />
          <MenuRow
            icon="mail-outline"
            label="Contact Support"
            onPress={() => openUrl(URLS.support, 'Support')}
          />
        </View>

        {/* Manga footer */}
        <View style={styles.mangaFooter}>
          <View style={styles.mangaFooterBorder} />
          <Text style={styles.mangaFooterText}>HUDDLE</Text>
          <View style={styles.mangaFooterBorder} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------------
// MenuRow component
// -----------------------------------------------------------------------------

interface MenuRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

const MenuRow: React.FC<MenuRowProps> = ({
  icon,
  label,
  onPress,
  destructive = false,
}) => {
  const tint = destructive ? colors.error : colors.ink;
  return (
    <TouchableOpacity
      style={styles.menuRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color={tint} />
      <Text
        style={[
          styles.menuLabel,
          destructive && styles.menuLabelDestructive,
        ]}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.sporty,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
  },

  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },

  introBlock: {
    marginBottom: spacing.xl,
  },
  introEyebrow: {
    ...typography.caption,
    fontSize: 10,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  introTitle: {
    ...typography.heading,
    fontSize: 22,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  introText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  section: {
    marginBottom: spacing.xl,
  },
  lastSection: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.sporty,
    fontSize: 11,
    color: colors.ink,
    letterSpacing: 1.5,
  },
  sectionLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.ink,
  },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  menuLabel: {
    ...typography.body,
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  menuLabelDestructive: {
    color: colors.error,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  infoLabel: {
    ...typography.body,
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  infoValue: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },

  mangaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  mangaFooterBorder: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  mangaFooterText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 2,
  },
});