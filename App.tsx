import { GluestackUIProvider } from '~/components/ui/gluestack-ui-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
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
import { StatusBar } from 'react-native';

const queryClient = new QueryClient();

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <GluestackUIProvider>
            <StatusBar barStyle="light-content" backgroundColor="black" />
            <RootNavigator />
          </GluestackUIProvider>
        </NavigationContainer>
      </QueryClientProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { session, initializing } = useAuth();
  if (initializing) return null; // or splash

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
