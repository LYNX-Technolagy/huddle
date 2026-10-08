// src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { colors } from '../design';
import { RootStackParamList } from './types';
import { useAuth } from '../context/AuthContext';

import LoadingScreen from '../screens/LoadingScreen';
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainApp from './MainApp';

import CreateGameScreen from '../screens/CreateGameScreen';
import GameDetailScreen from '../screens/GameDetailScreen';
import PlayerProfileScreen from '../screens/PlayerProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import LocationScreen from '../screens/LocationScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import DownloadDataScreen from '../screens/DownloadDataScreen';
import DeleteAccountScreen from '../screens/DeleteAccountScreen';
import { StackScreen } from 'react-native-screens';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { session, onboarded, loading } = useAuth();

  // Still checking initial session OR still fetching onboarded flag
  if (loading || (session && onboarded === null)) {
    return (
      <View style={styles.bootstrap}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const isAuthed = !!session;
  const needsOnboarding = isAuthed && onboarded === false;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {!isAuthed ? (
          // ---------- 1. Logged out ----------
          <>
            <Stack.Screen name="Loading" component={LoadingScreen} />
            <Stack.Screen name="Auth" component={AuthNavigator} />
          </>
        ) : needsOnboarding ? (
          // ---------- 2. Logged in, not onboarded ----------
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          // ---------- 3. Fully ready ----------
          <>
            <Stack.Screen name="Main" component={MainApp} />
            <Stack.Screen
              name="CreateGame"
              component={CreateGameScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="GameDetail"
              component={GameDetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="PlayerProfile"
              component={PlayerProfileScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Location"
              component={LocationScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Privacy"
              component={PrivacyScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="DownloadData"
              component={DownloadDataScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="DeleteAccount"
              component={DeleteAccountScreen}
              options={{ animation: 'slide_from_right'}}
              />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ animation: 'slide_from_right' }}
              />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bootstrap: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});