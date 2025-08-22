import { GluestackUIProvider } from '~/components/ui/gluestack-ui-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import './global.css';
import { MainTabNavigator } from '~/navigation/MainTabNavigator';
import { InterestScreen, RegisterInfoScreen, RegisterScreen, WelcomeScreen } from '~/screens';
import { SafeAreaView } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

export default function App() {
  const queryClient = new QueryClient();

  // ! FIX SPACE BETWEEN CONTENT AND CONTINUE BUTTON
  // TODO CHANGE FORM A LETERS FROM TEXT TO "!" IN THE INPUT OR REMOVE PADDING

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <GluestackUIProvider>
          <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{
              headerShown: false,
            }}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="RegisterInfo" component={RegisterInfoScreen} />
            <Stack.Screen name="Interest" component={InterestScreen} />
            <Stack.Screen name="Main" component={MainTabNavigator} />
          </Stack.Navigator>
        </GluestackUIProvider>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
