// src/lib/guestGuard.ts
import { Platform, Alert } from 'react-native';

export interface GuestGuardOptions {
  /** What the user was trying to do, e.g. "join this game" */
  action: string;
  /** Called if user is authenticated (or after they sign in and come back) */
  onAllowed: () => void;
  /** Called if user is a guest and chooses to sign in */
  onSignIn: () => void;
}

/**
 * If the user is a guest, show a prompt and let them choose to sign in.
 * If signed in, run `onAllowed` immediately.
 *
 * Usage:
 *   guardGuestAction({
 *     isGuest,
 *     action: 'join this game',
 *     onAllowed: () => handleJoin(gameId),
 *     onSignIn: () => navigation.navigate('Auth', { screen: 'Login' }),
 *   });
 */
export function guardGuestAction(
  isGuest: boolean,
  options: GuestGuardOptions
): void {
  if (!isGuest) {
    options.onAllowed();
    return;
  }

  const title = 'Sign in to continue';
  const message = `You'll need to sign in to ${options.action}.`;

  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    const shouldSignIn = window.confirm(`${title}\n\n${message}`);
    if (shouldSignIn) {
      options.onSignIn();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Sign in',
        onPress: options.onSignIn,
      },
    ]);
  }
}