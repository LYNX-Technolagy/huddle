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
import MainApp from './MainApp';

import CreateGameScreen from '../screens/CreateGameScreen';
import GameDetailScreen from '../screens/GameDetailScreen';
import PlayerProfileScreen from '../screens/PlayerProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import EditSportsScreen from '../screens/EditSportsScreen';
import LocationScreen from '../screens/LocationScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import DownloadDataScreen from '../screens/DownloadDataScreen';
import DeleteAccountScreen from '../screens/DeleteAccountScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { session, loading, isGuest } = useAuth();

  console.log(
    '[ROOT] render | session =', !!session,
    '| loading =', loading,
    '| isGuest =', isGuest
  );

  if (loading) {
    return (
      <View style={styles.bootstrap}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const isAuthed = !!session;
  const inApp = isAuthed || isGuest;

  console.log(
    '[ROOT] isAuthed =', isAuthed,
    '| inApp =', inApp,
    '| branch =', !inApp ? 'AUTH' : 'MAIN'
  );

  // Force the NavigationContainer to remount when the auth branch changes.
  // Without this, React Navigation can preserve the old branch's screens in
  // its internal stack — LoginScreen stays mounted after switching to guest.
  const navKey = !inApp ? 'auth' : 'app';

  return (
    <NavigationContainer key={navKey}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {!inApp ? (
          // ---- Logged out: Loading → Auth ----
          <>
            <Stack.Screen name="Loading" component={LoadingScreen} />
            <Stack.Screen name="Auth" component={AuthNavigator} />
          </>
        ) : (
          // ---- Logged in OR guest: Main + all app screens ----
          <>
            <Stack.Screen name="Main" component={MainApp} />

            {/* Auth is a modal for guests who want to sign in mid-flow */}
            <Stack.Screen
              name="Auth"
              component={AuthNavigator}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />

            {/* Modal for creating games */}
            <Stack.Screen
              name="CreateGame"
              component={CreateGameScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />

            {/* Standard push screens */}
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
              name="EditSports"
              component={EditSportsScreen}
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
              options={{ animation: 'slide_from_right' }}
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