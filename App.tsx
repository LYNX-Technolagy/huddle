// App.tsx
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform, View } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';

import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { PWAInstallBanner } from './src/components/PWAInstallBanner';
import { initInstallPrompt } from './src/lib/pwaInstall';

// -----------------------------------------------------------------------------
// Sentry — initialize before any rendering
// -----------------------------------------------------------------------------

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'beta',
  sendDefaultPii: true,
  tracesSampleRate: 0.1,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    navigationIntegration,
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],
  enableNativeFramesTracking: !isRunningInExpoGo(),

  beforeSend(event) {
    const SCRUB_KEYS = [
      'email',
      'password',
      'token',
      'location',
      'lat',
      'lng',
      'city',
      'full_name',
      'bio',
    ];

    // Scrub event.extra
    if (event.extra) {
      for (const key of SCRUB_KEYS) delete event.extra[key];
    }

    // Scrub contexts
    if (event.contexts) {
      for (const ctxKey of Object.keys(event.contexts)) {
        const ctx = event.contexts[ctxKey];
        if (ctx && typeof ctx === 'object') {
          for (const key of SCRUB_KEYS) {
            delete (ctx as Record<string, unknown>)[key];
          }
        }
      }
    }

    // Scrub breadcrumb data
    if (event.breadcrumbs?.values) {
      const crumbs = Array.from(event.breadcrumbs.values());
      for (const crumb of crumbs) {
        if (crumb.data) {
          for (const key of SCRUB_KEYS) delete crumb.data[key];
        }
      }
    }

    return event;
  },
});

// -----------------------------------------------------------------------------
// PWA install prompt capture (web only)
// -----------------------------------------------------------------------------

if (Platform.OS === 'web') {
  initInstallPrompt();
}

// -----------------------------------------------------------------------------
// App component
// -----------------------------------------------------------------------------

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
          <PWAInstallBanner />
        </AuthProvider>
      </GestureProvider>
    </SafeAreaProvider>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
});