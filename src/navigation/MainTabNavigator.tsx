// app-navigation.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RootStackParamList, AppTabParamList } from '~/types/navigation.types';

import { Icon } from '~/components/ui/icon';
import { Home as HomeIcon, User } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

import { useAuth } from '~/providers/AuthProvider';
import { useTheme } from '~/providers/ThemeProvider';

import {
  AllEventsScreen,
  EventCheckInScreen,
  EventReviewScreen,
  HostScannerScreen,
  HomeScreen,
  ProfileScreen,
  ProfileSettingsScreen,
  ReviewCreateEventScreen,
  UpdateProfileScreen,
  ViewEventScreen,
  ViewUserEventsScreen,
  WalletScreen,
} from '~/screens';
import CreateEventScreen from '~/screens/create-event-screen';
import { EventCheckInList } from '~/components';
import { cn } from '~/utils/cn';

/** ----------------------------------
 * Root + Tabs (typed)
 * ---------------------------------- */
const RootStackNav = createNativeStackNavigator<RootStackParamList>();
const AppTabsNav = createBottomTabNavigator<AppTabParamList>();

/** ----------------------------------
 * Inner stacks (local, minimal param lists)
 * ---------------------------------- */
type HomeStackParams = { HomeIndex: undefined; 'All Events': undefined };
type ProfileStackParams = {
  ProfileIndex: undefined;
  'Event History': { filter?: 'all' | 'upcoming' | 'history' } | undefined;
  'Profile Settings': undefined;
  'Update Profile': undefined;
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
      <HomeStack.Screen
        name="All Events"
        component={AllEventsScreen}
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: '#0F1012' },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff' },
          title: 'All Events',
        }}
      />
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
      <ProfileStack.Screen
        name="Update Profile"
        component={UpdateProfileScreen}
        options={{
          headerShown: false,
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

function TicketTabIcon({ focused }: { focused: boolean }) {
  const color = focused ? '#F4F4F5' : '#A1A1AA';
  return (
    <Svg width={28} height={28} viewBox="0 0 56 56">
      {focused ? (
        <Path
          fill={color}
          fillRule="evenodd"
          d="M3 20.279V16a4 4 0 0 1 4-4h42a4 4 0 0 1 4 4v4.45a3.2 3.2 0 0 1-1.95 2.945a5.001 5.001 0 0 0 .046 9.23A3.08 3.08 0 0 1 53 35.469V40a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-4.263c0-1.37.803-2.613 2.053-3.176a5.001 5.001 0 0 0-.01-9.126A3.46 3.46 0 0 1 3 20.28M39 23a3 3 0 1 0 0-6a3 3 0 0 0 0 6m0 8a3 3 0 1 0 0-6a3 3 0 0 0 0 6m0 8a3 3 0 1 0 0-6a3 3 0 0 0 0 6"
        />
      ) : (
        <Path
          fill={color}
          d="M49 12a4 4 0 0 1 4 4v4.45a3.2 3.2 0 0 1-1.767 2.86l-.183.085a5.001 5.001 0 0 0-.154 9.142l.2.088A3.08 3.08 0 0 1 53 35.469V40a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-4.263c0-1.302.725-2.489 1.869-3.087l.184-.09a5.001 5.001 0 0 0 .19-9.03l-.2-.095A3.46 3.46 0 0 1 3 20.28V16a4 4 0 0 1 4-4zm-.038 3.45H7.038a1 1 0 0 0-1 1v3.117A9.41 9.41 0 0 1 11.267 28a9.41 9.41 0 0 1-5.23 8.433v3.117a1 1 0 0 0 1 1h41.925a1 1 0 0 0 1-1v-3.117A9.41 9.41 0 0 1 44.733 28a9.41 9.41 0 0 1 5.23-8.433V16.45a1 1 0 0 0-1-1M39 33a3 3 0 1 1 0 6a3 3 0 0 1 0-6m0-8a3 3 0 1 1 0 6a3 3 0 0 1 0-6m0-8a3 3 0 1 1 0 6a3 3 0 0 1 0-6"
        />
      )}
    </Svg>
  );
}

function WalletTabIcon({ focused }: { focused: boolean }) {
  const color = focused ? '#F4F4F5' : '#A1A1AA';
  return (
    <Svg width={24} height={24} viewBox="0 0 36 36">
      {focused ? (
        <Path
          fill={color}
          d="M32.94 14H31V9a1 1 0 0 0-1-1H6a1 1 0 0 1-1-1a1 1 0 0 1 1-1h23.6a1 1 0 1 0 0-2H6a2.94 2.94 0 0 0-3 2.88v21A4.13 4.13 0 0 0 7.15 32H30a1 1 0 0 0 1-1v-5h1.94a.93.93 0 0 0 1-.91v-10a1.08 1.08 0 0 0-1-1.09M32 24h-8.58a3.87 3.87 0 0 1-3.73-4a3.87 3.87 0 0 1 3.73-4H32Z"
        />
      ) : (
        <>
          <Path
            fill={color}
            d="M32 15h-1V9a1 1 0 0 0-1-1H6a1 1 0 0 1-1-.82v-.36A1 1 0 0 1 6 6h23.58a1 1 0 0 0 0-2H6a3 3 0 0 0-3 3a3 3 0 0 0 0 .36v20.57A4.1 4.1 0 0 0 7.13 32H30a1 1 0 0 0 1-1v-6h1a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1m-3 15H7.13A2.11 2.11 0 0 1 5 27.93V9.88A3.1 3.1 0 0 0 6 10h23v5h-7a5 5 0 0 0 0 10h7Zm2-7h-9a3 3 0 0 1 0-6h9Z"
          />
          <Path fill={color} d="M23.01 21.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3" />
        </>
      )}
    </Svg>
  );
}

function Tabs() {
  const baseTabBar = {
    backgroundColor: '#0F1012',
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
  } as const;

  const renderTabIcon =
    (IconComponent: typeof HomeIcon) =>
    ({ focused }: { focused: boolean }) => (
      <Icon
        as={IconComponent}
        size="2xl"
        className={cn(
          'fill-transparent text-typography-light/70',
          focused && 'fill-typography-light text-typography-light'
        )}
        fill={focused ? '#ffff' : ''}
      />
    );

  return (
    <AppTabsNav.Navigator screenOptions={{ headerShown: false }}>
      <AppTabsNav.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: renderTabIcon(HomeIcon),
          tabBarStyle: baseTabBar,
        }}
      />

      <AppTabsNav.Screen
        name="Event Check In"
        component={CheckInEventStackNavigator}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <TicketTabIcon focused={focused} />,
          tabBarStyle: baseTabBar,
        }}
      />

      <AppTabsNav.Screen
        name="Wallet"
        component={WalletStackNavigator}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <WalletTabIcon focused={focused} />,
          tabBarStyle: baseTabBar,
        }}
      />

      <AppTabsNav.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: renderTabIcon(User),
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
        name="Review Event"
        component={ReviewCreateEventScreen}
        options={headerCommon}
      />

      <RootStackNav.Screen
        name="EventReview"
        component={EventReviewScreen}
        options={{ ...headerCommon, title: 'Review Event' }}
      />

      <RootStackNav.Screen
        name="ScanQrModal"
        component={HostScannerScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
    </RootStackNav.Navigator>
  );
}
