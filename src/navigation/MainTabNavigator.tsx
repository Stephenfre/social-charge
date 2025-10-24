// app-navigation.tsx
import React from 'react';
import { Icon } from '~/components/ui/icon';
import { AddIcon } from '~/components/ui/icon';
import { Home, TicketCheck, User, Wallet as WalletIcon } from 'lucide-react-native';
import { useAuth } from '~/providers/AuthProvider';

import { RootStack, AppTabs, RootStackParamList, AppTabParamList } from '~/types/navigation.types';

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

/** ---------------------------
 *  Stacks used inside the Tabs
 *  (Keep these lean; detail screens live on RootStack)
 *  --------------------------- */
function HomeStackNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="HomeIndex" component={HomeScreen} />
    </RootStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="ProfileIndex"
        component={ProfileScreen}
        options={{ headerShown: false }}
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
    </RootStack.Navigator>
  );
}

function CheckInEventStackNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="EventCheckInIndex"
        component={EventCheckInScreen}
        options={{ headerShown: false }}
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

/** A tiny placeholder so the “Create Event” tab can redirect to the RootStack screen */
function EmptyScreen() {
  return null;
}

/** ---------------------------
 *  Tabs (inside RootStack)
 *  --------------------------- */
function Tabs() {
  const { user } = useAuth();

  const baseTabBar = {
    backgroundColor: '#0F1012',
    borderTopWidth: 0,
  } as const;

  return (
    <AppTabs.Navigator>
      <AppTabs.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: () => <Icon as={Home} color="white" size="2xl" />,
          tabBarStyle: baseTabBar,
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
          tabBarStyle: baseTabBar,
        }}
      />

      {/* Admin-only Create tab: routes to RootStack CreateEvent (so no tabs on the editor) */}
      {(user?.role === 'super_admin' || user?.role === 'admin') && (
        <AppTabs.Screen
          name="Create Event"
          component={EmptyScreen}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.getParent()?.navigate('CreateEvent' as keyof RootStackParamList);
            },
          })}
          options={{
            headerShown: false,
            tabBarLabel: () => null,
            tabBarIcon: () => <Icon as={AddIcon} color="white" size="2xl" />,
            tabBarStyle: baseTabBar,
          }}
        />
      )}

      <AppTabs.Screen
        name="Wallet"
        component={WalletStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: () => <Icon as={WalletIcon} color="white" size="2xl" />,
          tabBarStyle: baseTabBar,
        }}
      />

      <AppTabs.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: () => <Icon as={User} color="white" size="2xl" />,
          tabBarStyle: baseTabBar,
        }}
      />
    </AppTabs.Navigator>
  );
}

/** ---------------------------
 *  Root navigator
 *  Tabs live here as "Main"
 *  Detail screens (no tab bar) live here too
 *  --------------------------- */
export function MainTabNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tabs shell */}
      <RootStack.Screen name="Main" component={Tabs} />

      {/* Detail screens that should NOT show the tab bar */}
      <RootStack.Screen
        name="ViewEvent"
        component={ViewEventScreen}
        options={{
          headerShown: false,
          // If you want a header, toggle and style here
          // headerShown: true,
          // headerBackButtonDisplayMode: 'minimal',
          // headerStyle: { backgroundColor: '#0F1012' },
          // headerTintColor: 'white',
          // headerTitleStyle: { color: 'white' },
          // title: 'Event Details',
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
          title: 'Create / Edit Event',
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
