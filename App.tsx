import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { MainTabNavigator } from '~/navigation/MainTabNavigator';
import {
  InterestScreen,
  RegisterScreen,
  RegisterUserNameScreen,
  RegisterLocationScreen,
  SignInScreen,
  WelcomeScreen,
} from '~/screens';
import './global.css';
import { RegisterUserBirthDateScreen } from '~/screens/register-user-birthdate-screen';
import { AuthProvider, useAuth } from '~/providers/AuthProvider';
import { RootStack } from '~/types/navigation.types';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useMemo } from 'react';
import { ThemeProvider, useTheme } from '~/providers/ThemeProvider';

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
  const { mode, palette } = useTheme();

  const navigationTheme = useMemo(() => {
    const base = mode === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: palette.background,
        card: palette.header,
        border: palette.border,
        text: palette.text,
        primary: palette.accent,
      },
    };
  }, [mode, palette]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={palette.header}
      />
      <RootNavigator />
    </NavigationContainer>
  );
}

function RootNavigator() {
  const { palette } = useTheme();
  const { session, initializing } = useAuth();

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
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
    <RootStack.Screen name="RegisterUserBirthDate" component={RegisterUserBirthDateScreen} />
    <RootStack.Screen name="RegisterUserLocation" component={RegisterLocationScreen} />
    <RootStack.Screen name="Interest" component={InterestScreen} />
    <RootStack.Screen name="SignIn" component={SignInScreen} />
  </RootStack.Navigator>
);

const AppStack = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="Main" component={MainTabNavigator} />
  </RootStack.Navigator>
);
