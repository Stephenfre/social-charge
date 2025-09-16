import { Home, TicketCheck, User } from 'lucide-react-native';
import { Icon } from '~/components/ui/icon';
import {
  EventCheckInScreen,
  HomeScreen,
  ProfileScreen,
  ViewEventScreen,
  ViewUserEventsScreen,
} from '~/screens';
import { AppTabs, RootStack } from '~/types/navigation.types';

function HomeStackNavigator() {
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

function ProfileStackNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="ProfileIndex"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="Event History"
        component={ViewUserEventsScreen}
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: 'black' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      />
      <RootStack.Screen
        name="ViewEvent"
        component={ViewEventScreen}
        options={{ headerShown: false }}
      />
    </RootStack.Navigator>
  );
}

function EventStackNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="EventCheckInIndex"
        component={EventCheckInScreen}
        options={{
          headerShown: false,
        }}
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
            backgroundColor: '#000',
            borderTopWidth: 0,
          },
        }}
      />
      <AppTabs.Screen
        name="Event Check In"
        component={EventStackNavigator}
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: 'black' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
          tabBarLabel: () => null,
          tabBarIcon: () => <Icon as={TicketCheck} color="white" size="2xl" />,
          tabBarStyle: {
            backgroundColor: '#000',
            borderTopWidth: 0,
          },
        }}
      />
      <AppTabs.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: () => <Icon as={User} color="white" size="2xl" />,
          tabBarStyle: {
            backgroundColor: '#000',
            borderTopWidth: 0,
          },
        }}
      />
    </AppTabs.Navigator>
  );
}
