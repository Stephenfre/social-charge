import { Home, User } from 'lucide-react-native';
import { Icon } from '~/components/ui/icon';
import { HomeScreen, ProfileScreen } from '~/screens';

import ViewEventScreen from '~/screens/view-event-screen';
import { AppTabs, RootStack } from '~/types/navigation.types';

function MainStackNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="HomeIndex" component={HomeScreen} options={{ headerShown: false }} />
      <RootStack.Screen
        name="ViewEvent"
        component={ViewEventScreen}
        options={{ headerShown: false }}
      />
    </RootStack.Navigator>
  );
}

function PrfoileStackNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="ProfileIndex"
        component={ProfileScreen}
        options={{ headerShown: true }}
      />
    </RootStack.Navigator>
  );
}

export function MainTabNavigator() {
  return (
    <AppTabs.Navigator>
      <AppTabs.Screen
        name="Home"
        component={MainStackNavigator}
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
      <AppTabs.Screen
        name="Profile"
        component={PrfoileStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: () => <Icon as={User} color="white" size="2xl" />,
          tabBarStyle: {
            backgroundColor: '#18181b',
            borderTopWidth: 0,
          },
        }}
      />
    </AppTabs.Navigator>
  );
}
