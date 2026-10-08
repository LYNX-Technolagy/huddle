// src/screens/LoginScreen.tsx
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../design';
import { responsive, isWeb, isDesktop } from '../utils/responsive';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../context/AuthContext';

const { height, width } = Dimensions.get('window');

// Manga-style background (black and white)
const BACKGROUND_IMAGE = require('../assets/images/background_2.jpg');


export default function LoginScreen() {
  const { signIn } = useAuth();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [imageError, setImageError] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!email.includes('@')) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);

    const { error: loginError } = await signIn(email, password);

    setLoading(false);

    if (loginError) {
      setErrors({ password: loginError.message });
      return;
    } else {
      // No manual navigation -- Root navigator picks up the new session
      // and routes to Onboaring or Main depending on onboarded_at.
    }
  }

  const handleSignupPress = () => {
    navigation.navigate('Signup' as never);
  };

  useEffect(() => {
    if (imageError) {
      console.warn('⚠️ Manga background image failed to load.');
    }
  }, [imageError]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Manga Background */}
      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={styles.backgroundImage}
        resizeMode="cover"
        onError={() => setImageError(true)}
        onLoad={() => console.log('✅ Manga background loaded')}
      >
        {/* Ink overlay for readability */}
        <View style={styles.inkOverlay} />
      </ImageBackground>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Header - Manga Style */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🏐</Text>
            <Text style={styles.logoText}>HUDDLE</Text>
          </View>
          <View style={styles.headerLine} />
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

            {/* Main Card - Manga Panel Style */}
            <Card
              variant="light"
              mangaStyle
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.65)',
                borderWidth: 2,
                borderColor: colors.ink,
                ...shadows.panel,
              }}
            >
              {/* Eyebrow - Nike style */}
              <Text style={styles.eyebrow}>WELCOME BACK</Text>

              {/* Title - Haikyuu energy */}
              <Text style={styles.title}>
                GET IN THE{'\n'}GAME
              </Text>

              {/* Subtitle */}
              <Text style={styles.subtitle}>
                Sign in to find your next match
              </Text>

              {/* Input Fields */}
              <View style={styles.inputContainer}>
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
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  error={errors.password}
                  containerStyle={styles.inputWrapper}
                  variant="light"
                />

                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>FORGOT PASSWORD?</Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button - Haikyuu Orange */}
              <Button
                variant="primary"
                size="large"
                pill={false}
                loading={loading}
                onPress={handleLogin}
                style={styles.signInButton}
              >
                SIGN IN
              </Button>

              {/* Divider - Manga style */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Quick Login - Ink style buttons */}
              <View style={styles.quickLoginContainer}>
                <TouchableOpacity style={styles.quickLoginButton} onPress={handleLogin}>
                  <Ionicons name="logo-google" size={20} color={colors.ink} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickLoginButton} onPress={handleLogin}>
                  <Ionicons name="logo-apple" size={22} color={colors.ink} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickLoginButton} onPress={handleLogin}>
                  <Ionicons name="logo-facebook" size={20} color={colors.ink} />
                </TouchableOpacity>
              </View>

              {/* Sign Up Link - Nike style */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  DON'T HAVE AN ACCOUNT?{' '}
                  <Text style={styles.signupLink} onPress={handleSignupPress}>
                    SIGN UP
                  </Text>
                </Text>
              </View>
            </Card>

            {/* Nike Motivational Line */}
            <View style={styles.motivationalBlock}>
              <View style={styles.motivationalLine} />
              <Text style={styles.motivationalText}>
                "DON'T JUST WATCH. PLAY."
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
  container: {
    flex: 1,
    backgroundColor: 'rgba(247, 245, 240, 0.75)',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  inkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 245, 240, 0.92)', // Paper white overlay
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 20,
    paddingBottom: spacing.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoIcon: {
    fontSize: 24,
  },
  logoText: {
    ...typography.sporty,
    fontSize: 18,
    letterSpacing: 3,
    color: colors.ink,
  },
  headerLine: {
    width: 40,
    height: 3,
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
  },
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
    backgroundColor: colors.paper,
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
  inputContainer: {
    width: '100%',
    marginBottom: spacing.md,
  },
  inputWrapper: {
    marginBottom: spacing.md,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  forgotPasswordText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  signInButton: {
    width: '100%',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: 0, // Square - manga style
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  quickLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    width: '100%',
    marginBottom: spacing.xl,
  },
  quickLoginButton: {
    width: 48,
    height: 48,
    borderRadius: 0, // Square - manga style
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.panel,
  },
  footer: {
    alignItems: 'center',
    width: '100%',
  },
  footerText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  signupLink: {
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