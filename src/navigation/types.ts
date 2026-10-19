// src/navigation/types.ts
import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  VerifyEmail: { email: string };
};

export type RootStackParamList = {
  Loading: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: undefined;
  CreateGame: undefined;
  GameDetail: { gameId: string };
  PlayerProfile: { userId: string };
  EditProfile: undefined;
  EditSports: undefined;
  Location: undefined;
  Privacy: undefined;
  DownloadData: undefined;
  DeleteAccount: undefined;
  Notifications: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  Create: undefined;
  Players: undefined;
  Profile: undefined;
};

export type TabRoute = keyof MainTabParamList;