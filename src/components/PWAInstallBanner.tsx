// src/components/PWAInstallBanner.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../design';
import {
  hasNativeInstallPrompt,
  triggerNativeInstall,
  isStandalone,
  getPlatform,
  shouldShowInstallFlow,
  clearInstallParam,
} from '../lib/pwaInstall';

export const PWAInstallBanner: React.FC = () => {
  // Only run on web
  if (Platform.OS !== 'web') return null;

  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'other'>('other');
  const [hasPrompt, setHasPrompt] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) return;

    // Only show if user came with ?install=1
    if (!shouldShowInstallFlow()) return;

    setPlatform(getPlatform());
    setHasPrompt(hasNativeInstallPrompt());
    setVisible(true);

    // Clear the query param so reloading doesn't re-trigger
    clearInstallParam();
  }, []);

  const handleInstall = async () => {
    const outcome = await triggerNativeInstall();
    if (outcome === 'accepted') {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          accessibilityLabel="Dismiss"
        >
          <Ionicons name="close" size={20} color={colors.ink} />
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <Ionicons name="download-outline" size={32} color={colors.primary} />
        </View>

        <Text style={styles.title}>INSTALL HUDDLE</Text>
        <Text style={styles.subtitle}>
          Get the full app experience — no app store required.
        </Text>

        {/* Android + has prompt: real install button */}
        {platform === 'android' && hasPrompt ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleInstall}
            activeOpacity={0.85}
          >
            <Ionicons name="download" size={16} color={colors.textLight} />
            <Text style={styles.primaryButtonText}>INSTALL NOW</Text>
          </TouchableOpacity>
        ) : null}

        {/* iOS: show tutorial */}
        {platform === 'ios' ? (
          <View style={styles.tutorialBlock}>
            <View style={styles.tutorialStep}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>1</Text>
              </View>
              <Text style={styles.tutorialText}>
                Tap the <Text style={styles.bold}>Share</Text> button at the bottom
              </Text>
            </View>
            <View style={styles.tutorialStep}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>
              <Text style={styles.tutorialText}>
                Scroll and tap <Text style={styles.bold}>"Add to Home Screen"</Text>
              </Text>
            </View>
            <View style={styles.tutorialStep}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>3</Text>
              </View>
              <Text style={styles.tutorialText}>
                Tap <Text style={styles.bold}>Add</Text> to install
              </Text>
            </View>
          </View>
        ) : null}

        {/* Android without prompt: show manual tutorial */}
        {platform === 'android' && !hasPrompt ? (
          <View style={styles.tutorialBlock}>
            <View style={styles.tutorialStep}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>1</Text>
              </View>
              <Text style={styles.tutorialText}>
                Tap the <Text style={styles.bold}>⋮ menu</Text> in Chrome
              </Text>
            </View>
            <View style={styles.tutorialStep}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>
              <Text style={styles.tutorialText}>
                Tap <Text style={styles.bold}>"Install app"</Text> or
                <Text style={styles.bold}> "Add to Home screen"</Text>
              </Text>
            </View>
          </View>
        ) : null}

        {/* Desktop: tell them to visit on mobile */}
        {platform === 'desktop' ? (
          <View style={styles.tutorialBlock}>
            <Text style={styles.desktopNotice}>
              Huddle works best on mobile. Open this page on your phone to install
              the app to your home screen.
            </Text>
            <Text style={styles.desktopUrl}>huddleza.netlify.app</Text>
          </View>
        ) : null}

        {/* Continue without install */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleDismiss}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Continue in browser</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    zIndex: 10000,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.background,
    borderWidth: 3,
    borderColor: colors.ink,
    padding: spacing.xl,
    position: 'relative',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    padding: spacing.xs,
    zIndex: 2,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.sporty,
    fontSize: 18,
    color: colors.ink,
    letterSpacing: 2,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.ink,
    marginBottom: spacing.md,
    minHeight: 52,
  },
  primaryButtonText: {
    ...typography.button,
    fontSize: 13,
    color: colors.textLight,
    letterSpacing: 1.5,
  },
  tutorialBlock: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  tutorialStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepBadgeText: {
    ...typography.sporty,
    fontSize: 12,
    color: colors.textLight,
  },
  tutorialText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
    flex: 1,
    paddingTop: 3,
  },
  bold: {
    fontWeight: '800',
    color: colors.ink,
  },
  desktopNotice: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  desktopUrl: {
    ...typography.body,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    marginTop: spacing.sm,
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  skipText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});