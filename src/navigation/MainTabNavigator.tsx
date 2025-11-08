// app-navigation.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RootStackParamList, AppTabParamList } from '~/types/navigation.types';

import { Icon, AddIcon } from '~/components/ui/icon';
import { Home as HomeIcon, TicketCheck, User, Wallet as WalletIcon } from 'lucide-react-native';

import { useAuth } from '~/providers/AuthProvider';
import { useTheme } from '~/providers/ThemeProvider';

import {
  EventCheckInScreen,
  EventReviewScreen,
  HomeScreen,
  ProfileScreen,
  ProfileSettingsScreen,
  ReviewCreateEventScreen,
  ViewEventScreen,
  ViewUserEventsScreen,
  WalletScreen,
} from '~/screens';
import CreateEventScreen from '~/screens/create-event-screen';
import { EventCheckInList } from '~/components';

/** ----------------------------------
 * Root + Tabs (typed)
 * ---------------------------------- */
const RootStackNav = createNativeStackNavigator<RootStackParamList>();
const AppTabsNav = createBottomTabNavigator<AppTabParamList>();

/** ----------------------------------
 * Inner stacks (local, minimal param lists)
 * ---------------------------------- */
type HomeStackParams = { HomeIndex: undefined };
type ProfileStackParams = {
  ProfileIndex: undefined;
  'Event History': undefined;
  'Profile Settings': undefined;
};
type CheckInStackParams = { EventCheckInIndex: undefined; CheckInIndex: { eventId: string } };
type WalletStackParams = { WalletIndex: undefined };

const HomeStack = createNativeStackNavigator<HomeStackParams>();
const ProfileStack = createNativeStackNavigator<ProfileStackParams>();
const CheckInStack = createNativeStackNavigator<CheckInStackParams>();
const WalletStack = createNativeStackNavigator<WalletStackParams>();

/** ----------------------------------
 * Home
 * ---------------------------------- */
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeIndex" component={HomeScreen} />
    </HomeStack.Navigator>
  );
}

/** ----------------------------------
 * Profile
 * ---------------------------------- */
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileIndex"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="Event History"
        component={ViewUserEventsScreen}
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: '#0F1012' },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff' },
        }}
      />
      <ProfileStack.Screen
        name="Profile Settings"
        component={ProfileSettingsScreen}
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: '#0F1012' },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff' },
          title: 'Settings',
        }}
      />
    </ProfileStack.Navigator>
  );
}

/** ----------------------------------
 * Check-In
 * ---------------------------------- */
function CheckInEventStackNavigator() {
  return (
    <CheckInStack.Navigator>
      <CheckInStack.Screen
        name="EventCheckInIndex"
        component={EventCheckInList}
        options={{
          headerShown: false,
          headerStyle: { backgroundColor: '#0F1012' },
        }}
      />
      <CheckInStack.Screen
        name="CheckInIndex"
        component={EventCheckInScreen}
        options={{
          headerShown: false,
          headerStyle: { backgroundColor: '#0F1012' },
        }}
      />
    </CheckInStack.Navigator>
  );
}

/** ----------------------------------
 * Wallet
 * ---------------------------------- */
function WalletStackNavigator() {
  return (
    <WalletStack.Navigator>
      <WalletStack.Screen
        name="WalletIndex"
        component={WalletScreen}
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: '#0F1012' },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff' },
          title: 'Wallet',
        }}
      />
    </WalletStack.Navigator>
  );
}

/** ----------------------------------
 * Tabs
 * ---------------------------------- */
function EmptyScreen() {
  return null;
}

function Tabs() {
  const { user } = useAuth();

  const baseTabBar = {
    backgroundColor: '#0F1012',
    borderTopWidth: 0,
  } as const;

  return (
    <AppTabsNav.Navigator screenOptions={{ headerShown: false }}>
      <AppTabsNav.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => <Icon as={HomeIcon} size="2xl" className="text-typography-light" />,
          tabBarStyle: baseTabBar,
        }}
      />

      <AppTabsNav.Screen
        name="Event Check In"
        component={CheckInEventStackNavigator}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => <Icon as={TicketCheck} size="2xl" className="text-typography-light" />,
          tabBarStyle: baseTabBar,
        }}
      />

      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <AppTabsNav.Screen
          name="Create Event"
          component={EmptyScreen}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              // getParent() is ParamListBase; cast to never to satisfy TS safely
              navigation.getParent()?.navigate('CreateEvent' as never);
            },
          })}
          options={{
            tabBarLabel: () => null,
            tabBarIcon: () => <Icon as={AddIcon} size="2xl" className="text-typography-light" />,
            tabBarStyle: baseTabBar,
          }}
        />
      )}

      <AppTabsNav.Screen
        name="Wallet"
        component={WalletStackNavigator}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => <Icon as={WalletIcon} size="2xl" className="text-typography-light" />,
          tabBarStyle: baseTabBar,
        }}
      />

      <AppTabsNav.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => <Icon as={User} size="2xl" className="text-typography-light" />,
          tabBarStyle: baseTabBar,
        }}
      />
    </AppTabsNav.Navigator>
  );
}

/** ----------------------------------
 * Root Navigator
 * (ONLY place "Main" exists to avoid nested name collisions)
 * ---------------------------------- */
export function MainTabNavigator() {
  const { palette } = useTheme();

  const headerCommon = {
    headerShown: true,
    headerBackButtonDisplayMode: 'minimal' as const,
    headerStyle: { backgroundColor: palette.header },
    headerTintColor: palette.text,
    headerTitleStyle: { color: palette.text },
  };

  return (
    <RootStackNav.Navigator screenOptions={{ headerShown: false }}>
      <RootStackNav.Screen name="Tabs" component={Tabs} />

      <RootStackNav.Screen
        name="ViewEvent"
        component={ViewEventScreen}
        options={{ headerShown: false }}
      />

      <RootStackNav.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{ ...headerCommon, title: 'Create / Edit Event' }}
      />

      <RootStackNav.Screen
        name="Review Event"
        component={ReviewCreateEventScreen}
        options={headerCommon}
      />

      <RootStackNav.Screen
        name="EventReview"
        component={EventReviewScreen}
        options={{ ...headerCommon, title: 'Review Event' }}
      />
    </RootStackNav.Navigator>
  );
}
