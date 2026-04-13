import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { AppState, Pressable, StatusBar, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';
import * as ExpoSplashScreen from 'expo-splash-screen';

import './global.css';
import { MainTabNavigator } from '~/navigation/MainTabNavigator';
import {
  InterestScreen,
  OnboardingBudgetScreen,
  OnboardingNightScreen,
  OnboardingStartScreen,
  OnboardingVibeScreen,
  PolicyDetailScreen,
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
import { resolveRootStackTarget } from '~/utils/resolveRootStackTarget';
import * as Sentry from '@sentry/react-native';

void ExpoSplashScreen.preventAutoHideAsync();

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
          <QueryClientProvider client={queryClient}>
            <RevenueCatProvider>
              <BottomSheetModalProvider>
                <ThemeProvider>
                  <AppNavigation />
                </ThemeProvider>
              </BottomSheetModalProvider>
            </RevenueCatProvider>
          </QueryClientProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </Sentry.ErrorBoundary>
  );
});

function AppNavigation() {
  const { session, user, initializing } = useAuth();
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);

  useEffect(() => {
    const hideSplash = async () => {
      try {
        await ExpoSplashScreen.hideAsync();
      } catch {
        // Ignore splash hide errors.
      }
    };

    if (!initializing) {
      void hideSplash();
    }
  }, [initializing]);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) {
      return;
    }

    let isMounted = true;

    const checkForUpdates = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (isMounted && result.isAvailable) {
          setShowUpdateToast(true);
        }
      } catch {
        // ignore update check failures
      }
    };

    void checkForUpdates();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void checkForUpdates();
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const handleApplyUpdate = async () => {
    if (isApplyingUpdate) return;

    setIsApplyingUpdate(true);

    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch {
      setIsApplyingUpdate(false);
    }
  };

  if (initializing) {
    return null;
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
      {target === 'profileCompletion' && <ProfileCompletionStack />}
      {target === 'onboarding' && <OnboardingStack />}
      {target === 'app' && <AppStack />}
      {showUpdateToast ? (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 24,
          }}>
          <View
            style={{
              backgroundColor: '#18181B',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#27272A',
              paddingHorizontal: 16,
              paddingVertical: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 12,
            }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 6 }}>
              Update available
            </Text>
            <Text style={{ color: '#D4D4D8', fontSize: 14, marginBottom: 12 }}>
              A newer version of the app is ready to install.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <Pressable onPress={() => setShowUpdateToast(false)} disabled={isApplyingUpdate}>
                <Text style={{ color: '#A1A1AA', fontSize: 14, fontWeight: '600' }}>Later</Text>
              </Pressable>
              <Pressable onPress={handleApplyUpdate} disabled={isApplyingUpdate}>
                <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '700' }}>
                  {isApplyingUpdate ? 'Updating...' : 'Update'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
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
    <RootStack.Screen name="Policy Detail" component={PolicyDetailScreen} />
  </RootStack.Navigator>
);

const ProfileCompletionStack = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="RegisterUserName" component={RegisterUserNameScreen} />
    <RootStack.Screen name="Terms" component={TermsAndConditionsScreen} />
    <RootStack.Screen name="Privacy" component={PrivacyPolicyScreen} />
    <RootStack.Screen name="Policy Detail" component={PolicyDetailScreen} />
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
    <RootStack.Screen name="Policy Detail" component={PolicyDetailScreen} />
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
    <RootStack.Screen name="Policy Detail" component={PolicyDetailScreen} />
  </RootStack.Navigator>
);
