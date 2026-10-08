// src/components/BottomNav.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../design';

const { width } = Dimensions.get('window');

export type TabRoute = 'Home' | 'Discover' | 'Create' | 'Players' | 'Profile';

interface BottomNavProps {
  activeTab: TabRoute;
  onTabPress: (tab: TabRoute) => void;
  onCreatePress?: () => void;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabItem {
  key: TabRoute;
  label: string;
  icon: IoniconName;
  activeIcon?: IoniconName;
}

const tabs: TabItem[] = [
  { key: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'Discover', label: 'Discover', icon: 'compass-outline', activeIcon: 'compass' },
  { key: 'Create', label: 'Create', icon: 'add-circle-outline', activeIcon: 'add-circle' },
  { key: 'Players', label: 'Players', icon: 'people-outline', activeIcon: 'people' },
  { key: 'Profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabPress,
  onCreatePress,
}) => {
  const insets = useSafeAreaInsets();
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animate indicator on tab change
  useEffect(() => {
    const tabIndex = tabs.findIndex(t => t.key === activeTab);
    const tabWidth = (width - 40 - (tabs.length - 1) * 4) / tabs.length;
    const position = tabIndex * tabWidth + tabWidth / 2 - 24;
    
    Animated.spring(indicatorPosition, {
      toValue: position,
      tension: 300,
      friction: 30,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const handlePress = (tab: TabRoute) => {
    if (tab === 'Create') {
      onCreatePress?.();
      return;
    }
    
    // Scale animation on press
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.92,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
    
    onTabPress(tab);
  };

  const tabWidth = (width - 40 - (tabs.length - 1) * 4) / tabs.length;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 16 }]}>
      <Animated.View
        style={[
          styles.navBackground,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Active Indicator - Manga style */}
        <Animated.View
          style={[
            styles.indicator,
            {
              transform: [{ translateX: indicatorPosition }],
              backgroundColor: colors.primary,
            },
          ]}
        />

        {/* Tab Items */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const isCreate = tab.key === 'Create';

            // Create tab - special styling
            if (isCreate) {
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabItem, styles.createTab]}
                  onPress={() => handlePress(tab.key)}
                  activeOpacity={0.8}
                >
                  <Animated.View
                    style={[
                      styles.createButton,
                      shadows.floating,
                      {
                        transform: [{ scale: isActive ? 1.1 : 1 }],
                      },
                    ]}
                  >
                    <Ionicons name="add" size={28} color={colors.textLight} />
                  </Animated.View>
                  <Text style={[styles.tabLabel, styles.createLabel]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, { width: tabWidth }]}
                onPress={() => handlePress(tab.key)}
                activeOpacity={0.6}
              >
                <View style={styles.tabContent}>
                  <Ionicons
                    name={isActive ? (tab.activeIcon || tab.icon) : tab.icon}
                    size={24}
                    color={isActive ? colors.primary : colors.textMuted}
                    style={styles.tabIcon}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive && styles.tabLabelActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    paddingHorizontal: 20,
  },
  navBackground: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingVertical: 8,
    paddingHorizontal: 8,
    ...shadows.card,
    position: 'relative',
    overflow: 'visible',
    minHeight: 72,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'relative',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    zIndex: 2,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabIcon: {
    marginBottom: 0,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.3,
    marginTop: 1,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  createTab: {
    marginTop: -20,
    zIndex: 3,
  },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    ...shadows.button,
  },
  createLabel: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
    zIndex: 1,
  },
});