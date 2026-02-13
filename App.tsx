import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Pressable, StatusBar, Text } from 'react-native';
import { useEffect, useState } from 'react';

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
import { RevenueCatProvider } from '~/providers/RevenueCatProvider';
import { ThemeProvider } from '~/providers/ThemeProvider';
import { RootStack, type RootStackParamList } from '~/types/navigation.types';
import { SplashScreen } from '~/components';
import { resolveRootStackTarget } from '~/utils/resolveRootStackTarget';
import * as Sentry from '@sentry/react-native';

const routingInstrumentation = Sentry.reactNavigationIntegration();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  sendDefaultPii: true,
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.reactNativeTracingIntegration(),
    routingInstrumentation,
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],
});

type ErrorFallbackProps = {
  error: unknown;
  componentStack: string;
  resetError: () => void;
  eventId: string;
};

const RootErrorFallback = ({ error, resetError }: ErrorFallbackProps) => {
  const message = error instanceof Error ? error.message : 'Unexpected error encountered.';

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
      }}>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 8 }}>
        Something went wrong.
      </Text>
      {__DEV__ && (
        <Text style={{ color: '#fff', opacity: 0.7, marginBottom: 16, textAlign: 'center' }}>
          {message}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={resetError}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 999,
          backgroundColor: '#fff',
        }}>
        <Text style={{ color: '#000', fontWeight: '600' }}>Try again</Text>
      </Pressable>
    </GestureHandlerRootView>
  );
};

const queryClient = new QueryClient();

export default Sentry.wrap(function App() {
  return (
    <Sentry.ErrorBoundary fallback={(errorProps) => <RootErrorFallback {...errorProps} />}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <RevenueCatProvider>
            <QueryClientProvider client={queryClient}>
              <BottomSheetModalProvider>
                <ThemeProvider>
                  <AppNavigation />
                </ThemeProvider>
              </BottomSheetModalProvider>
            </QueryClientProvider>
          </RevenueCatProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </Sentry.ErrorBoundary>
  );
});

function AppNavigation() {
  const { session, user, initializing } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timeout);
  }, []);

  if (showSplash || initializing) {
    return <SplashScreen />;
  }

  const target = resolveRootStackTarget(session, user);

  return (
    // 👈 key forces a full remount when target changes (auth → onboarding → app)
    <NavigationContainer
      key={target}
      ref={navigationRef}
      onReady={() => {
        routingInstrumentation.registerNavigationContainer(navigationRef);
      }}>
      <StatusBar barStyle="light-content" />
      {target === 'auth' && <AuthStack />}
      {target === 'onboarding' && <OnboardingStack />}
      {target === 'app' && <AppStack />}
    </NavigationContainer>
  );
}

/* ---------- Navigators ---------- */

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
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
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
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="Root" component={MainTabNavigator} />
    {/* optional: reuse onboarding screens for settings flows */}
    <RootStack.Screen name="OnboardingStart" component={OnboardingStartScreen} />
    <RootStack.Screen name="OnboardingNight" component={OnboardingNightScreen} />
    <RootStack.Screen name="Interest" component={InterestScreen} />
    <RootStack.Screen name="OnboardingBudget" component={OnboardingBudgetScreen} />
    <RootStack.Screen name="OnboardingVibe" component={OnboardingVibeScreen} />
    <RootStack.Screen name="Terms" component={TermsAndConditionsScreen} />
    <RootStack.Screen name="Privacy" component={PrivacyPolicyScreen} />
  </RootStack.Navigator>
);
