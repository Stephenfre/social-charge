import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Welcome: undefined;
  Register: undefined;
  RegisterUserName: undefined;
  Interest: { editMode?: boolean; returnToSettings?: boolean } | undefined;
  SignIn: undefined;
  Main: undefined;
  Root: undefined;
  Terms: undefined;
  Privacy: undefined;
  OnboardingStart: { editMode?: boolean; returnToSettings?: boolean } | undefined;
  OnboardingNight:
    | { entryReason?: string; editMode?: boolean; returnToSettings?: boolean }
    | undefined;
  OnboardingBudget: { editMode?: boolean; returnToSettings?: boolean } | undefined;
  OnboardingVibe: { editMode?: boolean; returnToSettings?: boolean } | undefined;
  'Review Event': undefined;
};

export type NavigationProp<T extends keyof RootStackParamList> = NativeStackNavigationProp<
  RootStackParamList,
  T
>;
