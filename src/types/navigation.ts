import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Welcome: undefined;
  Register: undefined;
  RegisterUserName: undefined;
  RegisterUserBirthDate: undefined;
  RegisterUserLocation: undefined;
  Interest: undefined;
  SignIn: undefined;
  Main: undefined;
  Root: undefined;
  OnboardingStart: undefined;
  OnboardingNight: { entryReason?: string } | undefined;
  OnboardingBudget: undefined;
  OnboardingVibe: undefined;
  OnboardingComplete: undefined;
  'Review Event': undefined;
};

export type NavigationProp<T extends keyof RootStackParamList> = NativeStackNavigationProp<
  RootStackParamList,
  T
>;
