// src/navigation/types.ts
import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack Types (unauthenticated only)
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  VerifyEmail: { email: string };
};

// Onboarding Stack Types (authenticated but not onboarded)
export type OnboardingStackParamList = {
  Welcome: undefined;
};

// Root Stack Types
export type RootStackParamList = {
  Loading: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: undefined;
  CreateGame: undefined;
  GameDetail: { gameId: string };
  PlayerProfile: { userId: string };
  EditProfile: undefined;
  Location: undefined;
  DownloadData: undefined;
  DeleteAccount: undefined;
  Privacy: undefined;
  Notifications: undefined;
};

// Main Tab Types
export type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  Create: undefined;
  Players: undefined;
  Profile: undefined;
};

export type TabRoute = keyof MainTabParamList;