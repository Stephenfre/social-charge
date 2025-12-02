import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { MainTabNavigator } from '~/navigation/MainTabNavigator';
import {
  InterestScreen,
  OnboardingBudgetScreen,
  OnboardingCompletionScreen,
  OnboardingNightScreen,
  OnboardingStartScreen,
  OnboardingVibeScreen,
  RegisterScreen,
  RegisterUserNameScreen,
  PrivacyPolicyScreen,
  TermsAndConditionsScreen,
  SignInScreen,
  WelcomeScreen,
} from '~/screens';
import './global.css';
import { AuthProvider, useAuth } from '~/providers/AuthProvider';
import { RootStack } from '~/types/navigation.types';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '~/providers/ThemeProvider';

const queryClient = new QueryClient();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <ThemeProvider>
              <AppNavigation />
            </ThemeProvider>
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigation() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" />
      <RootNavigator />
    </NavigationContainer>
  );
}

function RootNavigator() {
  const { session, initializing } = useAuth();

  if (initializing) {
    return (
      <View className="bg-background-0 flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return session ? <AppStack /> : <AuthStack />;
}

const AuthStack = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="Welcome" component={WelcomeScreen} />
    <RootStack.Screen name="Register" component={RegisterScreen} />
    <RootStack.Screen name="RegisterUserName" component={RegisterUserNameScreen} />
    <RootStack.Screen name="SignIn" component={SignInScreen} />
    <RootStack.Screen name="Terms" component={TermsAndConditionsScreen} />
    <RootStack.Screen name="Privacy" component={PrivacyPolicyScreen} />
  </RootStack.Navigator>
);

function AppStack() {
  const { user } = useAuth();
  const showOnboarding = user ? user.onboarded === false : false;

  if (showOnboarding) {
    return (
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="OnboardingStart" component={OnboardingStartScreen} />
        <RootStack.Screen name="OnboardingNight" component={OnboardingNightScreen} />
        <RootStack.Screen name="Interest" component={InterestScreen} />
        <RootStack.Screen name="OnboardingBudget" component={OnboardingBudgetScreen} />
        <RootStack.Screen name="OnboardingVibe" component={OnboardingVibeScreen} />
        <RootStack.Screen name="OnboardingComplete" component={OnboardingCompletionScreen} />
        <RootStack.Screen name="Terms" component={TermsAndConditionsScreen} />
        <RootStack.Screen name="Privacy" component={PrivacyPolicyScreen} />
      </RootStack.Navigator>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Root" component={MainTabNavigator} />
      <RootStack.Screen name="Terms" component={TermsAndConditionsScreen} />
      <RootStack.Screen name="Privacy" component={PrivacyPolicyScreen} />
    </RootStack.Navigator>
  );
}
