// src/navigation/MainApp.tsx
import React, { useState, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../design';
import { BottomNav, TabRoute } from '../components/BottomNav';

// Screens
import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import PlayersScreen from '../screens/PlayersScreen';
import ProfileScreen from '../screens/ProfileScreen';

export default function MainApp() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabRoute>('Home');
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenTranslateX = useRef(new Animated.Value(0)).current;

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen />;
      case 'Discover':
        return <DiscoverScreen />;
      case 'Players':
        return <PlayersScreen />;
      case 'Profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const handleTabPress = (tab: TabRoute) => {
    if (tab === activeTab) return;

    // Fade out current screen
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslateX, {
        toValue: -10,
        duration: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveTab(tab);
      
      // Reset for new screen
      screenTranslateX.setValue(10);
      
      // Fade in new screen
      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(screenTranslateX, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleCreatePress = () => {
    // Navigate to CreateGame modal
    navigation.navigate('CreateGame' as never);
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.screenContainer,
          {
            opacity: screenOpacity,
            transform: [{ translateX: screenTranslateX }],
          },
        ]}
      >
        {renderScreen()}
      </Animated.View>
      <BottomNav
        activeTab={activeTab}
        onTabPress={handleTabPress}
        onCreatePress={handleCreatePress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
});