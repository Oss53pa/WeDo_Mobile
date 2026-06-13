/**
 * Navigation Types and Route Parameters
 */

import {NavigatorScreenParams} from '@react-navigation/native';
import {StackScreenProps} from '@react-navigation/stack';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';

// Root Stack Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  TontineDetail: {tontineId: string};
  CreateTontine: undefined;
  PaymentFlow: {contributionId: string};
  Chat: {tontineId: string};
  MemberProfile: {userId: string; tontineId?: string};
  Settings: undefined;
  Notifications: undefined;
  EditProfile: undefined;
  AddMobileMoneyAccount: undefined;
  VoteDetail: {voteId: string};
  // New feature screens (registered at root level — reachable from anywhere)
  ManageTontine: {tontineId: string};
  InviteTontine: {tontineId: string; tontineName?: string; inviteCode?: string};
  JoinByCode: undefined;
  HowItWorks: undefined;
  Feedback: undefined;
  Kyc: undefined;
  // Trust layer (MVP)
  Registre: {tontineId: string};
  OrganizerDashboard: {tontineId: string};
  KycP2: undefined;
};

// Auth Stack Navigator
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  VerifyOTP: {email?: string; phone?: string};
  CreatePIN: {email: string; fullName: string};
  SetupBiometric: undefined;
  LinkMobileMoney: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Tontines: NavigatorScreenParams<TontinesStackParamList>;
  Create: undefined;
  Messages: NavigatorScreenParams<MessagesStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Profile Stack Navigator (nested in Profile Tab)
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Notifications: undefined;
  Transactions: undefined;
};

// Messages Stack Navigator (nested in Messages Tab)
export type MessagesStackParamList = {
  MessagesList: undefined;
  Chat: {tontineId: string};
};

// Tontines Stack Navigator (nested in Tontines Tab)
export type TontinesStackParamList = {
  TontinesList: undefined;
  TontineDetail: {tontineId: string};
  Contribution: {tontineId: string; contributionId?: string};
  MyTontines: undefined;
  ExploreTontines: undefined;
};

// Tontine Stack Navigator (for tontine detail screens)
export type TontineStackParamList = {
  TontineDetail: {tontineId: string};
};

// Screen Props Type Helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<
  RootStackParamList,
  T
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = StackScreenProps<
  AuthStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
  MainTabParamList,
  T
>;

export type TontinesStackScreenProps<T extends keyof TontinesStackParamList> = StackScreenProps<
  TontinesStackParamList,
  T
>;

export type TontineStackScreenProps<T extends keyof TontineStackParamList> = StackScreenProps<
  TontineStackParamList,
  T
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
