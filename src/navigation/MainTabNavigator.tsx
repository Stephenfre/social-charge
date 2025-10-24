import { Home, TicketCheck, User, Wallet } from 'lucide-react-native';
import { AddIcon, Icon } from '~/components/ui/icon';
import { useAuth } from '~/providers/AuthProvider';
import {
  EventCheckInScreen,
  EventReviewScreen,
  HomeScreen,
  ProfileScreen,
  ReviewCreateEventScreen,
  ViewEventScreen,
  ViewUserEventsScreen,
  WalletScreen,
} from '~/screens';
import CreateEventScreen from '~/screens/create-event-screen';
import { AppTabs, RootStack } from '~/types/navigation.types';

function HomeStackNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="HomeIndex" component={HomeScreen} options={{ headerShown: false }} />
      <RootStack.Screen
        name="ViewEvent"
        component={ViewEventScreen}
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: '#0F1012' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
          title: 'Event Details',
        }}
      />
      <RootStack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: '#0F1012' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      />
      <RootStack.Screen
        name="Review Event"
        component={ReviewCreateEventScreen}
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: '#0F1012' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
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
          headerStyle: { backgroundColor: '#0F1012' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      />
      <RootStack.Screen
        name="ViewEvent"
        component={ViewEventScreen}
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: '#0F1012' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
          title: 'Event Details',
        }}
      />
      <RootStack.Screen
        name="EventReview"
        component={EventReviewScreen}
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: '#0F1012' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
          title: 'Review Event',
        }}
      />
    </RootStack.Navigator>
  );
}

function CheckInEventStackNavigator() {
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

function WalletStackNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="WalletIndex"
        component={WalletScreen}
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: '#0F1012' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
          title: 'Wallet',
        }}
      />
    </RootStack.Navigator>
  );
}

function CreateEventStackNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#0F1012' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      />
      <RootStack.Screen
        name="Review Event"
        component={ReviewCreateEventScreen}
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: '#0F1012' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      />
      {/* 👇 Add this */}
      <RootStack.Screen
        name="ViewEvent"
        component={ViewEventScreen}
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: '#0F1012' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
          title: 'Event Details',
        }}
      />
    </RootStack.Navigator>
  );
}

export function MainTabNavigator() {
  const { user } = useAuth();

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
            backgroundColor: '#0F1012',
            borderTopWidth: 0,
          },
        }}
      />
      <AppTabs.Screen
        name="Event Check In"
        component={CheckInEventStackNavigator}
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: 'black' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
          tabBarLabel: () => null,
          tabBarIcon: () => <Icon as={TicketCheck} color="white" size="2xl" />,
          tabBarStyle: {
            backgroundColor: '#0F1012',
            borderTopWidth: 0,
          },
        }}
      />
      {user?.role === 'super_admin' || user?.role === 'admin' ? (
        <AppTabs.Screen
          name="Create Event"
          component={CreateEventStackNavigator}
          options={{
            headerShown: false,

            tabBarLabel: () => null,
            tabBarIcon: () => <Icon as={AddIcon} color="white" size="2xl" />,
            tabBarStyle: {
              backgroundColor: '#0F1012',
              borderTopWidth: 0,
            },
          }}
        />
      ) : null}
      <AppTabs.Screen
        name="Wallet"
        component={WalletStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: () => <Icon as={Wallet} color="white" size="2xl" />,
          tabBarStyle: {
            backgroundColor: '#0F1012',
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
            backgroundColor: '#0F1012',
            borderTopWidth: 0,
          },
        }}
      />
    </AppTabs.Navigator>
  );
}
