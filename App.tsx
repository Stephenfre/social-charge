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
import './global.css';
import { RegisterUserBirthDateScreen } from '~/screens/register-user-birthdate-screen';
import { AuthProvider, useAuth } from '~/providers/AuthProvider';

const Stack = createNativeStackNavigator();
// create once
const queryClient = new QueryClient();

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <GluestackUIProvider>
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
