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
};

export type NavigationProp<T extends keyof RootStackParamList> = NativeStackNavigationProp<
  RootStackParamList,
  T
>;
