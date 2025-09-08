import { Home } from 'lucide-react-native';
import { Icon } from '~/components/ui/icon';
import HomeScreen from '~/screens/home-screen';

import ViewEventScreen from '~/screens/view-event-screen';
import { AppTabs, RootStack } from '~/types/navigation.types';

function HomeStackNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
      <RootStack.Screen
        name="ViewEventScreen"
        component={ViewEventScreen}
        options={{ headerShown: false }}
      />
    </RootStack.Navigator>
  );
}

export function MainTabNavigator() {
  return (
    <AppTabs.Navigator>
      <AppTabs.Screen
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
    </AppTabs.Navigator>
  );
}
