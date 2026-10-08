// src/screens/VerifyEmailScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, typography, shadows } from '../design';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import type { AuthStackParamList } from '../navigation/types';

type RouteProps = RouteProp<AuthStackParamList, 'VerifyEmail'>;

const BACKGROUND_IMAGE = require('../assets/images/background_2.jpg');

// Cooldown for resend (seconds)
const RESEND_COOLDOWN = 30;

export default function VerifyEmailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { email } = route.params;
  const { resendVerification, session } = useAuth();

  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Pulse animation for the mail icon
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Safety net: if a session appears while this screen is mounted,
  // RootNavigator will swap automatically — but we log it for clarity.
  useEffect(() => {
    if (session) {
      console.log('✅ Email verified — session created, RootNavigator will swap.');
    }
  }, [session]);

  const handleResend = async () => {
    if (resending || cooldown > 0) return;

    setResending(true);
    setError(null);
    setInfo(null);

    const { error: resendError } = await resendVerification(email);
    setResending(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setInfo('New link sent. Check your inbox (and spam).');
    setCooldown(RESEND_COOLDOWN);
  };

  const handleBack = () => navigation.goBack();

  const resendDisabled = resending || cooldown > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.paperOverlay} />
      </ImageBackground>

      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🏐</Text>
            <Text style={styles.logoText}>HUDDLE</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Card mangaStyle style={styles.mainCard}>
            {/* Animated mail icon */}
            <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulse }] }]}>
              <Ionicons name="mail-open-outline" size={40} color={colors.primary} />
            </Animated.View>

            <Text style={styles.eyebrow}>CHECK YOUR EMAIL</Text>
            <Text style={styles.title}>
              ONE CLICK{'\n'}TO PLAY
            </Text>

            <Text style={styles.subtitle}>
              We sent a verification link to
            </Text>
            <Text style={styles.emailText}>{email}</Text>

            <Text style={styles.instructions}>
              Open the email and tap the link to verify your account. You'll be
              brought right back here.
            </Text>

            {/* Status messages */}
            {error ? (
              <View style={[styles.statusBox, styles.statusBoxError]}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={styles.statusTextError}>{error}</Text>
              </View>
            ) : null}

            {info ? (
              <View style={[styles.statusBox, styles.statusBoxSuccess]}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                <Text style={styles.statusTextSuccess}>{info}</Text>
              </View>
            ) : null}

            {/* Resend button */}
            <Button
              variant="primary"
              size="large"
              pill={false}
              loading={resending}
              onPress={handleResend}
              disabled={resendDisabled}
              style={styles.resendButton}
            >
              {cooldown > 0
                ? `RESEND IN ${cooldown}s`
                : "RESEND EMAIL"}
            </Button>

            {/* Helper */}
            <View style={styles.helperBlock}>
              <Text style={styles.helperTitle}>DIDN'T GET IT?</Text>
              <Text style={styles.helperText}>
                • Check your spam or promotions folder{'\n'}
                • Make sure {email} is correct{'\n'}
                • Wait a minute, then resend
              </Text>
            </View>
          </Card>

          {/* Motivational footer */}
          <View style={styles.motivationalBlock}>
            <View style={styles.motivationalLine} />
            <Text style={styles.motivationalText}>
              "THE GAME IS WAITING."
            </Text>
            <View style={styles.motivationalLine} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  paperOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 245, 240, 0.75)',
  },
  contentContainer: { flex: 1, zIndex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ?? 20) + 20,
    paddingBottom: spacing.md,
  },
  backButton: { padding: spacing.xs, width: 40 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoIcon: { fontSize: 24 },
  logoText: {
    ...typography.sporty,
    fontSize: 18,
    letterSpacing: 3,
    color: colors.ink,
  },
  placeholder: { width: 40 },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },

  mainCard: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    padding: spacing.xxxl,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 3,
    borderColor: colors.ink,
    alignItems: 'center',
    ...shadows.panel,
  },

  iconWrap: {
    width: 80,
    height: 80,
    borderWidth: 3,
    borderColor: colors.ink,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  eyebrow: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  title: {
    ...typography.heading,
    fontSize: 32,
    lineHeight: 36,
    color: colors.ink,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emailText: {
    ...typography.body,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  instructions: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },

  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    width: '100%',
    marginBottom: spacing.md,
  },
  statusBoxError: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  statusBoxSuccess: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  statusTextError: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
    flex: 1,
  },
  statusTextSuccess: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
    flex: 1,
  },

  resendButton: {
    width: '100%',
    borderRadius: 0,
    marginTop: spacing.sm,
  },

  helperBlock: {
    width: '100%',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  helperTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  helperText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },

  motivationalBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xxxl,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  motivationalLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    maxWidth: 60,
  },
  motivationalText: {
    ...typography.sporty,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});