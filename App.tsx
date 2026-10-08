// App.tsx
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform, View } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://e8d3a5a693419af5fc4f9bfbf6227a6b@o4512183920623616.ingest.de.sentry.io/4512183930978384',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function App() {
  const GestureProvider = ({ children }: { children: React.ReactNode }) => {
    if (Platform.OS === 'web') {
      return <View style={styles.container}>{children}</View>;
    }
    return (
      <GestureHandlerRootView style={styles.container}>
        {children}
      </GestureHandlerRootView>
    );
  };

  return (
    <SafeAreaProvider>
      <GestureProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </GestureProvider>
    </SafeAreaProvider>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
});