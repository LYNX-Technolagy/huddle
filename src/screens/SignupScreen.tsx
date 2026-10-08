// src/screens/SignupScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { colors, spacing, typography, shadows } from '../design';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Checkbox } from '../components/Checkbox';
import { useAuth } from '../context/AuthContext';

const { height, width } = Dimensions.get('window');
const BACKGROUND_IMAGE = require('../assets/images/background_2.jpg');

// Legal URLs — must match PrivacyScreen
const LEGAL_URLS = {
  terms: 'https://joinhuddleup.netlify.app/terms',
  privacy: 'https://joinhuddleup.netlify.app/privacy',
};

export default function SignupScreen() {
  const { signUp } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    agreement?: string;
  }>({});

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!username) newErrors.username = 'Username is required';
    else if (username.length < 3)
      newErrors.username = 'Must be at least 3 characters';
    if (!email) newErrors.email = 'Email is required';
    else if (!email.includes('@')) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6)
      newErrors.password = 'Must be at least 6 characters';
    if (!agreed)
      newErrors.agreement = 'You must agree to the Terms and Privacy Policy';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    const { error: signupError } = await signUp({
      email,
      password,
      username,
      fullName: undefined,
    });

    setLoading(false);

    if (signupError) {
      setErrors({ email: signupError?.message });
      return;
    }

    navigation.navigate('VerifyEmail', { email });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // ---------------------------------------------------------------------------
  // Legal links
  // ---------------------------------------------------------------------------

  const openTerms = () => {
    Linking.openURL(LEGAL_URLS.terms).catch(() => {});
  };

  const openPrivacy = () => {
    Linking.openURL(LEGAL_URLS.privacy).catch(() => {});
  };

  useEffect(() => {
    if (imageError) {
      console.warn('Manga background image failed to load.');
    }
  }, [imageError]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={styles.backgroundImage}
        resizeMode="cover"
        onError={() => setImageError(true)}
        onLoad={() => console.log('Manga background loaded')}
      >
        <View style={styles.paperOverlay} />
      </ImageBackground>

      <View style={styles.contentContainer}>
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

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Card mangaStyle style={styles.mainCard}>
              <Text style={styles.eyebrow}>JOIN THE TEAM</Text>
              <Text style={styles.title}>READY TO{'\n'}PLAY?</Text>
              <Text style={styles.subtitle}>
                Create your account and find your match
              </Text>

              <View style={styles.inputContainer}>
                <Input
                  label="Username"
                  icon="person-outline"
                  placeholder="Choose a username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.username}
                  containerStyle={styles.inputWrapper}
                  variant="light"
                />

                <Input
                  label="Email"
                  icon="mail-outline"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.email}
                  containerStyle={styles.inputWrapper}
                  variant="light"
                />

                <Input
                  label="Password"
                  icon="lock-closed-outline"
                  placeholder="Create a password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  error={errors.password}
                  containerStyle={styles.inputWrapper}
                  variant="light"
                />
              </View>

              {/* Age + Terms agreement */}
              <View style={styles.agreementBlock}>
                <View style={styles.agreementRow}>
                  <Checkbox
                    checked={agreed}
                    onPress={() => {
                      setAgreed((v) => !v);
                      if (errors.agreement) {
                        setErrors((prev) => ({ ...prev, agreement: undefined }));
                      }
                    }}
                  />
                  <Text style={styles.agreementText}>
                    I am 13 or older and agree to the{' '}
                    <Text style={styles.agreementLink} onPress={openTerms}>
                      Terms of Service
                    </Text>{' '}
                    and{' '}
                    <Text style={styles.agreementLink} onPress={openPrivacy}>
                      Privacy Policy
                    </Text>
                    .
                  </Text>
                </View>

                {errors.agreement ? (
                  <Text style={styles.agreementError}>{errors.agreement}</Text>
                ) : null}
              </View>

              <Button
                variant="primary"
                size="large"
                pill={false}
                loading={loading}
                onPress={handleSignup}
                disabled={!agreed || loading}
                style={styles.signUpButton}
              >
                CREATE ACCOUNT
              </Button>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Quick signup — disabled for Beta 1 (deferred to Google OAuth in v1.1) */}
              <View style={styles.quickSignupContainer}>
                <View style={[styles.quickSignupButton, styles.quickSignupDisabled]}>
                  <Ionicons name="logo-google" size={20} color={colors.textMuted} />
                </View>
                <View style={[styles.quickSignupButton, styles.quickSignupDisabled]}>
                  <Ionicons name="logo-apple" size={22} color={colors.textMuted} />
                </View>
                <View style={[styles.quickSignupButton, styles.quickSignupDisabled]}>
                  <Ionicons name="logo-facebook" size={20} color={colors.textMuted} />
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  ALREADY HAVE AN ACCOUNT?{' '}
                  <Text style={styles.signinLink} onPress={handleBack}>
                    SIGN IN
                  </Text>
                </Text>
              </View>
            </Card>

            <View style={styles.motivationalBlock}>
              <View style={styles.motivationalLine} />
              <Text style={styles.motivationalText}>
                "EVERY GAME STARTS WITH A FIRST STEP."
              </Text>
              <View style={styles.motivationalLine} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backgroundImage: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%',
  },
  paperOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 245, 240, 0.75)',
  },
  contentContainer: { flex: 1, position: 'relative', zIndex: 1 },
  keyboardView: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop:
      Platform.OS === 'ios'
        ? 60
        : StatusBar.currentHeight
        ? StatusBar.currentHeight + 20
        : 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 3,
    borderColor: colors.ink,
    ...shadows.panel,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.heading,
    fontSize: 32,
    lineHeight: 36,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  inputContainer: { width: '100%', marginBottom: spacing.md },
  inputWrapper: { marginBottom: spacing.md },

  // Agreement block
  agreementBlock: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  agreementText: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    flex: 1,
  },
  agreementLink: {
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  agreementError: {
    ...typography.caption,
    fontSize: 11,
    color: colors.error,
    fontWeight: '600',
    marginTop: spacing.sm,
  },

  signUpButton: {
    width: '100%',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: 0,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
    width: '100%',
  },
  dividerLine: { flex: 1, height: 2, backgroundColor: colors.border },
  dividerText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },

  quickSignupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    width: '100%',
    marginBottom: spacing.xl,
  },
  quickSignupButton: {
    width: 48,
    height: 48,
    borderRadius: 0,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.panel,
  },
  quickSignupDisabled: {
    opacity: 0.4,
  },

  footer: { alignItems: 'center', width: '100%' },
  footerText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  signinLink: {
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    maxWidth: 40,
  },
  motivationalText: {
    ...typography.sporty,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});