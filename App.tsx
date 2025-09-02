import { GluestackUIProvider } from '~/components/ui/gluestack-ui-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from '~/navigation/MainTabNavigator';
import {
  InterestScreen,
  RegisterScreen,
  RegisterUserNameScreen,
  RegisterLocationScreen,
  SignInScreen,
  WelcomeScreen,
} from '~/screens';
import { useEffect, useState } from 'react';
import './global.css';

import { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import { RegisterUserBirthDateScreen } from '~/screens/register-user-birthdate-screen';

const Stack = createNativeStackNavigator();

export default function App() {
  const queryClient = new QueryClient();

  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState<Boolean>(true);

  useEffect(() => {
    let mounted = true;

    // get current session once
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setInitializing(false);
      }
    });

    // subscribe to changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (mounted) setSession(s);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ! FIX SPACE BETWEEN CONTENT AND CONTINUE BUTTON
  // TODO: CHANGE FORM A LETERS FROM TEXT TO "!" IN THE INPUT OR REMOVE PADDING

  if (initializing) return null; // or a splash

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <GluestackUIProvider>{session ? <AppStack /> : <AuthStack />}</GluestackUIProvider>
      </NavigationContainer>
    </QueryClientProvider>
  );
}

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="RegisterUserName" component={RegisterUserNameScreen} />
    <Stack.Screen name="RegisterUserBirthDate" component={RegisterUserBirthDateScreen} />
    <Stack.Screen name="RegisterUserLocation" component={RegisterLocationScreen} />
    <Stack.Screen name="Interest" component={InterestScreen} />
    <Stack.Screen name="SignIn" component={SignInScreen} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Main" component={MainTabNavigator} />
  </Stack.Navigator>
);
