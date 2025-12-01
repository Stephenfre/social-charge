import {
  NavigatorScreenParams,
  RouteProp,
  useRoute as useRnRoute,
  useNavigation as useRnNavigation,
} from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { BottomTabNavigationProp, createBottomTabNavigator } from '@react-navigation/bottom-tabs';

/** ----- Tab params (if you have tabs) ----- */
export type AppTabParamList = {
  Home: undefined;
  Profile: undefined;
  'Event Check In': undefined;
  'Create Event': undefined;
  Wallet: undefined;
};

/** ----- Root stack params ----- */
export type RootStackParamList = {
  Root: NavigatorScreenParams<AppTabParamList>;
  Tabs: NavigatorScreenParams<AppTabParamList>;
  OnboardingStart: undefined;
  OnboardingNight: { entryReason?: string } | undefined;
  OnboardingBudget: undefined;
  OnboardingVibe: undefined;
  OnboardingComplete: undefined;
  Welcome: undefined;
  Register: undefined;
  RegisterUserName: undefined;
  RegisterUserBirthDate: undefined;
  RegisterUserLocation: undefined;
  Interest: undefined;
  SignIn: undefined;
  HomeIndex: undefined;
  ProfileIndex: undefined;
  'Profile Settings': undefined;
  Membership: undefined;
  ViewEvent: { eventId: string };
  'All Events': undefined;
  'Event History': { filter?: 'all' | 'upcoming' | 'history' } | undefined;
  EventCheckInIndex: undefined;
  CheckInIndex: { eventId: string };
  CreateEvent: { eventId?: string };
  'Review Event': undefined;
  EventReview: { eventId?: string };
  WalletIndex: undefined;
  ScanQrModal:
    | {
        runId?: string | null;
        runTitle?: string | null;
        runStartTime?: string | null;
        runEndTime?: string | null;
        locationName?: string | null;
      }
    | undefined;
};

/** ----- Navigator creators with types (optional re-exports) ----- */
export const RootStack = createNativeStackNavigator<RootStackParamList>();
export const AppTabs = createBottomTabNavigator<AppTabParamList>();

/** ----- Typed navigation hooks ----- */
// Stack
export type RootStackNav<T extends keyof RootStackParamList = keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, T>;

export function useNavigationStack<
  T extends keyof RootStackParamList = keyof RootStackParamList,
>() {
  return useRnNavigation<RootStackNav<T>>();
}

// Tabs
export type AppTabNav<T extends keyof AppTabParamList = keyof AppTabParamList> =
  BottomTabNavigationProp<AppTabParamList, T>;

export function useNavigationTabs<T extends keyof AppTabParamList = keyof AppTabParamList>() {
  return useRnNavigation<AppTabNav<T>>();
}

/** ----- Typed route hooks ----- */
export type RootRoute<T extends keyof RootStackParamList> = RouteProp<RootStackParamList, T>;
export function useRouteStack<T extends keyof RootStackParamList>() {
  return useRnRoute<RootRoute<T>>();
}

export type TabRoute<T extends keyof AppTabParamList> = RouteProp<AppTabParamList, T>;
export function useRouteTabs<T extends keyof AppTabParamList>() {
  return useRnRoute<TabRoute<T>>();
}
