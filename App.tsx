import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { StatusBar } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

import './global.css';
import { MainTabNavigator } from '~/navigation/MainTabNavigator';
import {
  InterestScreen,
  OnboardingBudgetScreen,
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
import { AuthProvider, useAuth } from '~/providers/AuthProvider';
import { ThemeProvider } from '~/providers/ThemeProvider';
import { RootStack } from '~/types/navigation.types';
import { SplashScreen } from '~/components';
import { resolveRootStackTarget } from '~/utils/resolveRootStackTarget';

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
  const { session, user, initializing } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timeout);
  }, []);

  const target = useMemo(() => resolveRootStackTarget(session, user), [session, user]);

  if (showSplash || initializing) {
    return <SplashScreen />;
  }

  if (target === 'auth') {
    return <AuthStack />;
  }

  if (target === 'onboarding') {
    return <OnboardingStack />;
  }

  return <AppStack />;
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

const OnboardingStack = () => (
  <RootStack.Navigator key="onboarding" screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="OnboardingStart" component={OnboardingStartScreen} />
    <RootStack.Screen name="OnboardingNight" component={OnboardingNightScreen} />
    <RootStack.Screen name="Interest" component={InterestScreen} />
    <RootStack.Screen name="OnboardingBudget" component={OnboardingBudgetScreen} />
    <RootStack.Screen name="OnboardingVibe" component={OnboardingVibeScreen} />
    <RootStack.Screen name="Terms" component={TermsAndConditionsScreen} />
    <RootStack.Screen name="Privacy" component={PrivacyPolicyScreen} />
  </RootStack.Navigator>
);

const AppStack = () => (
  <RootStack.Navigator key="app" screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="Root" component={MainTabNavigator} />
    <RootStack.Screen name="OnboardingStart" component={OnboardingStartScreen} />
    <RootStack.Screen name="OnboardingNight" component={OnboardingNightScreen} />
    <RootStack.Screen name="Interest" component={InterestScreen} />
    <RootStack.Screen name="OnboardingBudget" component={OnboardingBudgetScreen} />
    <RootStack.Screen name="OnboardingVibe" component={OnboardingVibeScreen} />
    <RootStack.Screen name="Terms" component={TermsAndConditionsScreen} />
    <RootStack.Screen name="Privacy" component={PrivacyPolicyScreen} />
  </RootStack.Navigator>
);
