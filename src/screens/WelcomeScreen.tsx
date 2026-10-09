// src/screens/WelcomeScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
  Easing,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../design';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LocationPicker, LocationValue } from '../components/LocationPicker';
import { useAuth } from '../context/AuthContext';
import { setMySports, updateProfile, completeOnboarding } from '../lib/profile';
import type { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import type { SkillLevel, Rank } from '../types';

const { width } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type StepType = 'intro' | 'sports' | 'rank' | 'location' | 'done';

interface Step {
  id: StepType;
  eyebrow: string;
  title: string;
  subtitle: string;
  background: any;
}

const STEPS: Step[] = [
  {
    id: 'intro',
    eyebrow: 'WELCOME TO HUDDLE',
    title: 'FIND YOUR\nNEXT GAME',
    subtitle: 'Local sports. Real people.\nNo commitment.',
    background: require('../assets/images/background_1.jpg'),
  },
  {
    id: 'sports',
    eyebrow: 'STEP 1 OF 4',
    title: 'WHAT DO YOU\nPLAY?',
    subtitle: 'Pick your sports and your level',
    background: require('../assets/images/background_2.jpg'),
  },
  {
    id: 'rank',
    eyebrow: 'STEP 2 OF 4',
    title: 'YOUR\nRANK',
    subtitle: 'How would you describe yourself?',
    background: require('../assets/images/background_3.jpg'),
  },
  {
    id: 'location',
    eyebrow: 'STEP 3 OF 4',
    title: 'FIND GAMES\nNEAR YOU',
    subtitle: 'We use this to show games in your area',
    background: require('../assets/images/background_4.jpg'),
  },
  {
    id: 'done',
    eyebrow: 'STEP 4 OF 4',
    title: "YOU'RE\nREADY",
    subtitle: 'Time to find your game',
    background: require('../assets/images/background_1.jpg'),
  },
];

// Sports match our DB `sports` table exactly.
const SPORTS: { id: string; emoji: string; name: string }[] = [
  { id: 'volleyball', emoji: '🏐', name: 'Volleyball' },
  { id: 'basketball', emoji: '🏀', name: 'Basketball' },
  { id: 'soccer',     emoji: '⚽', name: 'Soccer' },
  { id: 'tennis',     emoji: '🎾', name: 'Tennis' },
  { id: 'running',    emoji: '🏃', name: 'Running' },
  { id: 'other',      emoji: '🎯', name: 'Other' },
];

const SKILL_LEVELS: { id: SkillLevel; label: string }[] = [
  { id: 'casual',      label: 'Casual' },
  { id: 'regular',     label: 'Regular' },
  { id: 'competitive', label: 'Competitive' },
];

const RANK_OPTIONS: { id: Rank; title: string; description: string }[] = [
  { id: 'S', title: 'TOP PLAYER',  description: 'Always competing, high intensity' },
  { id: 'A', title: 'EXPERIENCED', description: 'Play hard, know the game' },
  { id: 'B', title: 'SOLID',       description: 'Regular player, reliable' },
  { id: 'C', title: 'CASUAL',      description: 'Here for fun and fitness' },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { user, markOnboarded } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);

  // Sports + skill state
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [sportSkills, setSportSkills] = useState<Record<string, SkillLevel>>({});

  // Rank state — default to C
  const [rank, setRank] = useState<Rank>('C');

  // Location state
  const [location, setLocation] = useState<LocationValue | null>(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const step = STEPS[currentStep];

  // Animate content on step change
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [currentStep]);

  // -------------------------------------------------------------------------
  // Sports handlers
  // -------------------------------------------------------------------------

  const toggleSport = (sportId: string) => {
    if (selectedSports.includes(sportId)) {
      setSelectedSports((prev) => prev.filter((id) => id !== sportId));
      setSportSkills((prev) => {
        const next = { ...prev };
        delete next[sportId];
        return next;
      });
    } else {
      setSelectedSports((prev) => [...prev, sportId]);
    }
  };

  const setSportSkill = (sportId: string, level: SkillLevel) => {
    setSportSkills((prev) => ({ ...prev, [sportId]: level }));
  };

  // -------------------------------------------------------------------------
  // Step validation
  // -------------------------------------------------------------------------

  const isStepComplete = (): boolean => {
    switch (step.id) {
      case 'intro':
        return true;
      case 'sports':
        return (
          selectedSports.length > 0 &&
          selectedSports.every((id) => !!sportSkills[id])
        );
      case 'rank':
        return true; // pre-selected
      case 'location':
        return location !== null;
      case 'done':
        return true;
      default:
        return false;
    }
  };

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      scrollViewRef.current?.scrollTo({ x: next * width, animated: true });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    // Flip the context flag → RootNavigator swaps to Main.
    // Note: onboarded_at is NOT set in the DB, so next launch
    // will send them back to onboarding.
    markOnboarded();
  };

  // -------------------------------------------------------------------------
  // Final save
  // -------------------------------------------------------------------------

  const handleFinish = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      if (!location) throw new Error('Location required');

      // 1. Save sports + per-sport skill
      const sportInputs = selectedSports.map((sportId, idx) => ({
        sport_id: sportId,
        skill_level: sportSkills[sportId] ?? 'casual',
        is_primary: idx === 0, // first selected = primary
      }));
      const { error: sportsErr } = await setMySports(sportInputs);
      if (sportsErr) throw sportsErr;

      // 2. Save rank + location
      const { error: profileErr } = await updateProfile({
        rank,
        location: { lat: location.lat, lng: location.lng },
        city: location.city ?? undefined,
      });
      if (profileErr) throw profileErr;

      // 3. Mark onboarding complete in DB
      const { error: onboardErr } = await completeOnboarding();
      if (onboardErr) throw onboardErr;

      // 4. Flip the context flag → RootNavigator swaps to Main.
      markOnboarded();
    } catch (e: any) {
      setSaveError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Progress
  // -------------------------------------------------------------------------

  const getProgress = () => ((currentStep + 1) / STEPS.length) * 100;

  //-- Temp. debug --//
  useEffect(() => {
    console.log('Current User', user);
    console.log('User ID', user?.id);
    console.log('Session exists', !!user);
  });

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ImageBackground source={step.background} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.paperOverlay} />
      </ImageBackground>

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🏐</Text>
          <Text style={styles.logoText}>HUDDLE</Text>
        </View>
        {currentStep === 0 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>SKIP</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${getProgress()}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1} / {STEPS.length}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.carousel}
      >
        {STEPS.map((s, index) => (
          <View key={s.id} style={[styles.slide, { width }]}>
            <Animated.View
              style={[
                styles.contentWrapper,
                {
                  opacity: index === currentStep ? fadeAnim : 0,
                  transform: [{ translateY: index === currentStep ? slideAnim : 20 }],
                },
              ]}
            >
              <Card mangaStyle style={styles.mainCard}>
                <Text style={styles.eyebrow}>{s.eyebrow}</Text>
                <Text style={styles.title}>{s.title}</Text>
                <Text style={styles.subtitle}>{s.subtitle}</Text>

                <View style={styles.contentArea}>
                  {/* INTRO */}
                  {s.id === 'intro' && (
                    <View style={styles.featureGrid}>
                      <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>🏐</Text>
                        <Text style={styles.featureText}>Find Games</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>🤝</Text>
                        <Text style={styles.featureText}>Meet Players</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>🎯</Text>
                        <Text style={styles.featureText}>Skill Match</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>📍</Text>
                        <Text style={styles.featureText}>Local Games</Text>
                      </View>
                    </View>
                  )}

                  {/* SPORTS + SKILL */}
                  {s.id === 'sports' && (
                    <View style={styles.sportsList}>
                      {SPORTS.map((sport) => {
                        const isSelected = selectedSports.includes(sport.id);
                        const skill = sportSkills[sport.id];
                        return (
                          <View key={sport.id} style={styles.sportBlock}>
                            <TouchableOpacity
                              style={[
                                styles.sportCard,
                                isSelected && styles.sportCardSelected,
                              ]}
                              onPress={() => toggleSport(sport.id)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                              <Text
                                style={[
                                  styles.sportName,
                                  isSelected && styles.sportNameSelected,
                                ]}
                              >
                                {sport.name}
                              </Text>
                              {isSelected && (
                                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                              )}
                            </TouchableOpacity>

                            {isSelected && (
                              <View style={styles.skillRow}>
                                {SKILL_LEVELS.map((level) => {
                                  const isActive = skill === level.id;
                                  return (
                                    <TouchableOpacity
                                      key={level.id}
                                      style={[
                                        styles.skillPill,
                                        isActive && styles.skillPillActive,
                                      ]}
                                      onPress={() => setSportSkill(sport.id, level.id)}
                                      activeOpacity={0.7}
                                    >
                                      <Text
                                        style={[
                                          styles.skillPillText,
                                          isActive && styles.skillPillTextActive,
                                        ]}
                                      >
                                        {level.label}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* RANK */}
                  {s.id === 'rank' && (
                    <View style={styles.rankList}>
                      {RANK_OPTIONS.map((option) => {
                        const isActive = rank === option.id;
                        return (
                          <TouchableOpacity
                            key={option.id}
                            style={[styles.rankRow, isActive && styles.rankRowActive]}
                            onPress={() => setRank(option.id)}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.rankBadge, isActive && styles.rankBadgeActive]}>
                              <Text style={[styles.rankLetter, isActive && styles.rankLetterActive]}>
                                {option.id}
                              </Text>
                            </View>
                            <View style={styles.rankTextWrap}>
                              <Text style={[styles.rankTitle, isActive && styles.rankTitleActive]}>
                                {option.title}
                              </Text>
                              <Text style={styles.rankDesc}>{option.description}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* LOCATION */}
                  {s.id === 'location' && (
                    <View style={styles.locationContainer}>
                      <LocationPicker
                        value={location}
                        onChange={setLocation}
                        initialMode="gps"
                        primaryLabel="ENABLE LOCATION"
                      />
                    </View>
                  )}

                  {/* DONE */}
                  {s.id === 'done' && (
                    <View style={styles.doneBlock}>
                      <Text style={styles.doneEmoji}>🔥</Text>
                      <Text style={styles.doneText}>
                        {selectedSports.length} {selectedSports.length === 1 ? 'sport' : 'sports'} · Rank {rank}
                      </Text>
                      {location?.city && (
                        <Text style={styles.doneSub}>📍 {location.city}</Text>
                      )}
                    </View>
                  )}
                </View>

                {saveError && <Text style={styles.saveError}>{saveError}</Text>}

                {/* Continue / Finish button */}
                <Button
                  variant={isStepComplete() ? 'primary' : 'outline'}
                  size="large"
                  pill={false}
                  onPress={handleNext}
                  disabled={!isStepComplete() || saving}
                  loading={step.id === 'done' ? saving : false}
                  style={styles.continueButton}
                >
                  {step.id === 'done' ? "LET'S GO" : 'CONTINUE'}
                </Button>
              </Card>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      {/* Footer tagline */}
      <View style={styles.footer}>
        <View style={styles.footerLine} />
        <Text style={styles.footerText}>
          {currentStep === 0 && '"EVERY GAME STARTS HERE."'}
          {currentStep === 1 && '"CHOOSE YOUR WEAPON."'}
          {currentStep === 2 && '"KNOW YOUR LEVEL."'}
          {currentStep === 3 && '"FIND YOUR TRIBE."'}
          {currentStep === 4 && '"NOW GO PLAY."'}
        </Text>
        <View style={styles.footerLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backgroundImage: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%',
  },
  paperOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 245, 240, 0.85)',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ?? 20) + 20,
    paddingBottom: spacing.md,
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  logoText: {
    ...typography.sporty,
    fontSize: 18,
    letterSpacing: 3,
    color: colors.ink,
  },
  skipButton: { padding: spacing.sm },
  skipText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
  },

  progressContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    zIndex: 10,
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  carousel: { flex: 1 },
  slide: {
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
  },

  mainCard: {
    padding: spacing.xxxl,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
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
  contentArea: { marginBottom: spacing.xl },

  // ---- Intro ----
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  featureItem: {
    width: '48%',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  featureText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
  },

  // ---- Sports + Skill ----
  sportsList: {
    // no gap — spacing handled on children
  },
  sportBlock: {
    marginBottom: spacing.md,
  },
  sportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
  },
  sportCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  sportEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  sportName: {
    flex: 1,
    ...typography.body,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sportNameSelected: {
    color: colors.ink,
  },
  skillRow: {
    flexDirection: 'row',
    paddingLeft: spacing.xl,
    paddingTop: spacing.sm,
  },
  skillPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
  },
  skillPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  skillPillText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  skillPillTextActive: {
    color: colors.textLight,
  },

  // ---- Rank ----
  rankList: {
    // no gap
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  rankRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  rankBadge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginRight: spacing.md,
  },
  rankBadgeActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  rankLetter: {
    ...typography.heading,
    fontSize: 20,
    color: colors.ink,
  },
  rankLetterActive: {
    color: colors.textLight,
  },
  rankTextWrap: { flex: 1 },
  rankTitle: {
    ...typography.subtitle,
    fontSize: 14,
    color: colors.textSecondary,
  },
  rankTitleActive: {
    color: colors.ink,
  },
  rankDesc: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },

  // ---- Location ----
  locationContainer: {
    width: '100%',
    paddingVertical: spacing.md,
  },

  // ---- Done ----
  doneBlock: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  doneEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  doneText: {
    ...typography.subtitle,
    color: colors.ink,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  doneSub: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  // ---- Error ----
  saveError: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  continueButton: {
    width: '100%',
    borderRadius: 0,
    marginTop: spacing.sm,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: spacing.md,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    maxWidth: 60,
    marginHorizontal: spacing.md,
  },
  footerText: {
    ...typography.sporty,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});