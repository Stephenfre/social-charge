import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home } from 'lucide-react-native';
import { Icon } from '~/components/ui/icon';
import HomeScreen from '~/screens/home-screen';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

const HomeStack = createNativeStackNavigator();
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
    </HomeStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export function MainTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: () => <Icon as={Home} color="white" size="2xl" />,
          tabBarStyle: {
            backgroundColor: '#18181b',
            borderTopWidth: 0,
          },
        }}
      />
    </Tab.Navigator>
  );
}
