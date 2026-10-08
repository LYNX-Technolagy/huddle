// src/screens/LoadingScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../design';
import { supabase } from "../lib/supabase";

const { width, height } = Dimensions.get('window');

// CONFIG: Set your desired video duration in milliseconds
const VIDEO_DURATION = 7000; // 7 seconds

export default function LoadingScreen() {
  const navigation = useNavigation();
  const videoRef = useRef<Video>(null);
  const [canSkip, setCanSkip] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  // Get safe area insets
  const insets = useSafeAreaInsets();

  // Animation values
  const videoScale = useRef(new Animated.Value(1)).current;
  const skipOpacity = useRef(new Animated.Value(0)).current;

  // Brand reveal animations
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandScale = useRef(new Animated.Value(1.2)).current;
  const brandTranslateY = useRef(new Animated.Value(60)).current;

  // Manga panel effects
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const panelScale = useRef(new Animated.Value(0.9)).current;

  // Underline animations
  const lineWidth = useRef(new Animated.Value(0)).current;
  const lineOpacity = useRef(new Animated.Value(0)).current;

  // Tagline animations
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(20)).current;

  // Screen fade out
  const screenFade = useRef(new Animated.Value(1)).current;

  // Progress bar
  const progressBar = useRef(new Animated.Value(0)).current;

  // Simulate loading progress
  useEffect(() => {
    Animated.timing(progressBar, {
      toValue: 1,
      duration: VIDEO_DURATION + 500,
      easing: Easing.bezier(0.65, 0, 0.35, 1),
      useNativeDriver: false,
    }).start();

    // Show skip button after 3 seconds
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
      Animated.spring(skipOpacity, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }, 3000);

    // Fallback if video doesn't trigger completion
    const fallbackTimer = setTimeout(() => {
      if (!videoEnded && !isNavigating) {
        handleVideoComplete();
      }
    }, VIDEO_DURATION + 1000);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleVideoStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      const successStatus = status as AVPlaybackStatusSuccess;

      if (successStatus.positionMillis >= VIDEO_DURATION && !videoEnded) {
        setVideoEnded(true);
        handleVideoComplete();
      }
    }
  };

  const handleVideoComplete = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    showBrandReveal();
  };

  const showBrandReveal = () => {
    // First: Show manga panel frame
    Animated.parallel([
      Animated.timing(panelOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(panelScale, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Second: Brand reveal with manga impact
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(brandScale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(brandTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(lineOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate the orange underline
      Animated.timing(lineWidth, {
        toValue: 80,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    }, 300);

    // Third: Tagline appears
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, 700);

    // Fourth: Fade out, then route based on session
    setTimeout(async () => {
      Animated.timing(screenFade, {
        toValue: 0,
        duration: 600,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigation.navigate('Main' as never);
        } else {
          navigation.navigate('Auth' as never);
        }
      });
    }, 4500);
  };

  const handleSkip = () => {
    if (canSkip && !isNavigating) {
      setIsNavigating(true);
      showBrandReveal();
    }
  };

  const handleVideoError = () => {
    // Fallback if video fails
    setTimeout(() => {
      showBrandReveal();
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Video Background - Anime spike */}
      <View style={[StyleSheet.absoluteFill]}>
        <Video
          ref={videoRef}
          source={require('../assets/videos/volleyball-serve.mp4')}
          rate={1.0}
          volume={0}
          isMuted
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping={false}
          progressUpdateIntervalMillis={100}
          onPlaybackStatusUpdate={handleVideoStatusUpdate}
          onError={handleVideoError}
          style={StyleSheet.absoluteFill}
          useNativeControls={false}
        />
      </View>

      {/* Manga-Style Overlay - Dark at bottom for readability */}
      <LinearGradient
        colors={[
          'rgba(0,0,0,0.1)',   // Minimal at top to show anime
          'rgba(0,0,0,0.4)',   // Medium in middle
          'rgba(0,0,0,0.85)',  // Dark at bottom for text
        ]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Manga Panel Frame - Reveals before brand */}
      <Animated.View
        style={[
          styles.panelFrame,
          {
            opacity: panelOpacity,
            transform: [{ scale: panelScale }],
          }
        ]}
      >
        <View style={styles.panelBorder} />
      </Animated.View>

      {/* Brand Container - Centered with manga style */}
      <Animated.View
        style={[
          styles.brandContainer,
          {
            opacity: brandOpacity,
            transform: [
              { scale: brandScale },
              { translateY: brandTranslateY }
            ],
            paddingTop: insets.top || 20,
            paddingBottom: insets.bottom || 20,
          }
        ]}
      >
        {/* Manga-Style Impact Lines */}
        <Animated.View style={[styles.impactLines, { opacity: brandOpacity }]}>
          <View style={styles.impactLine} />
          <View style={styles.impactLine} />
          <View style={styles.impactLine} />
        </Animated.View>

        {/* Orange Underline - Haikyuu style */}
        <Animated.View
          style={[
            styles.orangeUnderline,
            {
              opacity: lineOpacity,
              width: lineWidth,
            }
          ]}
        />

        {/* Main Brand - HUDDLE with manga effect */}
        <Animated.Text style={[
          styles.brandText,
          {
            textShadowColor: 'rgba(245, 106, 0, 0.3)',
            textShadowOffset: { width: 0, height: 4 },
            textShadowRadius: 12,
          }
        ]}>
          HUDDLE
        </Animated.Text>

        {/* Orange Underline - Second accent */}
        <Animated.View
          style={[
            styles.orangeUnderline,
            styles.orangeUnderlineBottom,
            {
              opacity: lineOpacity,
              width: lineWidth.interpolate({
                inputRange: [0, 80],
                outputRange: [0, 40],
              }),
            }
          ]}
        />

        {/* Tagline - Nike style */}
        <Animated.Text style={[
          styles.tagline,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslateY }],
          }
        ]}>
          FIND YOUR GAME
        </Animated.Text>

        {/* Manga Panel Border Effect */}
        <Animated.View style={[
          styles.mangaBorder,
          { opacity: brandOpacity }
        ]} />
      </Animated.View>

      {/* Progress Bar - Manga style */}
      <Animated.View style={[
        styles.progressContainer,
        {
          bottom: insets.bottom + 40,
          opacity: skipOpacity,
        }
      ]}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressBar.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }
            ]}
          />
        </View>
      </Animated.View>

      {/* Skip Button - Nike style with manga feel */}
      {canSkip && (
        <Animated.View
          style={[
            styles.skipContainer,
            {
              opacity: skipOpacity,
              top: insets.top + 20 || 44,
              right: insets.right + 20 || 40,
            }
          ]}
        >
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.6}
          >
            <View style={styles.skipIcon}>
              <Ionicons name="play-skip-forward" size={12} color={colors.textLight} />
            </View>
            <Text style={styles.skipText}>SKIP</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Nike-Style Speed Lines (Decorative) */}
      <Animated.View style={[
        styles.speedLines,
        {
          opacity: brandOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.3],
          })
        }
      ]}>
        <View style={styles.speedLine} />
        <View style={[styles.speedLine, styles.speedLine2]} />
        <View style={[styles.speedLine, styles.speedLine3]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  // Panel Frame - Manga style
  panelFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelBorder: {
    width: width * 0.85,
    height: height * 0.6,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'transparent',
  },
  // Brand Container
  brandContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    position: 'relative',
  },
  // Impact Lines - Manga style
  impactLines: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    right: '10%',
    bottom: '10%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  impactLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    width: '100%',
  },
  // Orange Underline - Haikyuu style
  orangeUnderline: {
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginBottom: 20,
  },
  orangeUnderlineBottom: {
    marginTop: 20,
    marginBottom: 0,
    height: 2,
  },
  // Main Brand Text
  brandText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 12,
    textAlign: 'center',
    fontFamily: 'System',
  },
  // Tagline - Nike style
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 6,
    marginTop: 20,
    textTransform: 'uppercase',
  },
  // Manga Border Effect
  mangaBorder: {
    position: 'absolute',
    top: '5%',
    left: '5%',
    right: '5%',
    bottom: '5%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  // Progress Bar - Manga style
  progressContainer: {
    position: 'absolute',
    left: 40,
    right: 40,
    bottom: 40,
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  // Skip Button - Nike style
  skipContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 8,
  },
  skipIcon: {
    opacity: 0.7,
  },
  skipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  // Speed Lines - Nike dynamic effect
  speedLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  speedLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    width: '60%',
    left: '-10%',
    transform: [{ rotate: '-15deg' }],
    top: '20%',
  },
  speedLine2: {
    top: '40%',
    width: '40%',
    transform: [{ rotate: '15deg' }],
    left: '70%',
  },
  speedLine3: {
    top: '70%',
    width: '50%',
    transform: [{ rotate: '-10deg' }],
    left: '-5%',
  },
});