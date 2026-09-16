import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Platform, ScrollView } from 'react-native';
import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventsList } from '~/components';
import { Badge, Button, Flex, Image, Pressable, Text } from '~/components/ui';
import { Icon, MenuIcon } from '~/components/ui/icon';
import { User as UserIcon } from 'lucide-react-native';
import { useReferralCode, useStorageImages, useUserEvents, useUserInterests } from '~/hooks';
import { useAuth } from '~/providers/AuthProvider';
import { RootStackParamList } from '~/types/navigation.types';
import { interestEmojis } from '~/utils/const';
import { useRevenueCat } from '~/providers/RevenueCatProvider';

type ProfileNav = NativeStackNavigationProp<
  RootStackParamList,
  'Event History' | 'Profile Settings'
>;

const formatVibeLabel = (slug?: string | null) => {
  if (!slug) return '';
  return slug.replace(/_/g, ' ').toUpperCase();
};

const formatMembershipLabel = (membership?: string | null) => {
  switch (membership) {
    case 'premium':
      return 'PREMIUM';
    case 'plus':
      return 'PLUS';
    case 'admin':
      return 'ADMIN';
    case 'superadmin':
      return 'SUPER ADMIN';
    case 'basic':
    default:
      return 'BASIC';
  }
};

const getMembershipBadgeClassName = (membership?: string | null) => {
  switch (membership) {
    case 'premium':
      return 'bg-amber-400';
    case 'plus':
      return 'bg-zinc-300';
    case 'basic':
    default:
      return 'bg-white';
  }
};

const getMembershipTextClassName = (membership?: string | null) => {
  switch (membership) {
    case 'premium':
      return 'text-amber-950';
    case 'plus':
      return 'text-zinc-950';
    case 'basic':
    default:
      return 'text-black';
  }
};

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();

  const { user } = useAuth();
  const { isPro, presentPaywall, loadingOfferings } = useRevenueCat();
  const { data: events, isLoading: eventsLoading } = useUserEvents(6);
  const { data: interests, isLoading: interestsLoading } = useUserInterests(user?.id!);
  const { data: referralCode, isLoading: referralCodeLoading } = useReferralCode();
  const { data: userAvater, isLoading: userAvatarLoading } = useStorageImages({
    bucket: 'avatars',
    paths: [user?.profile_picture],
  });
  const [isOpeningPaywall, setIsOpeningPaywall] = useState(false);

  const handleViewAllPress = () => {
    navigation.navigate('Event History', { filter: 'history' });
  };

  const handleViewAllUpcoming = () => {
    navigation.navigate('Event History', { filter: 'upcoming' });
  };

  const handleOpenSettings = () => {
    navigation.navigate('Profile Settings');
  };

  const handleUpgradePress = async () => {
    setIsOpeningPaywall(true);
    try {
      await presentPaywall();
    } finally {
      setIsOpeningPaywall(false);
    }
  };

  const handleShareReferral = async () => {
    if (!referralCode) return;

    try {
      if (Platform.OS === 'android') {
        const permission = await Contacts.requestPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Contacts permission needed',
            'Allow contact access to choose a friend to invite.'
          );
          return;
        }
      }

      const contact = await Contacts.presentContactPickerAsync();
      if (!contact) return;

      const phoneNumber = contact.phoneNumbers?.find(({ number }) => !!number)?.number;
      if (!phoneNumber) {
        Alert.alert('No phone number', `${contact.name ?? 'This contact'} has no phone number.`);
        return;
      }

      if (!(await SMS.isAvailableAsync())) {
        Alert.alert('Messages unavailable', 'SMS messaging is not available on this device.');
        return;
      }

      const referralUrl = `https://socialcharge.app/signup?ref=${encodeURIComponent(referralCode)}`;
      await SMS.sendSMSAsync(
        phoneNumber,
        `Join me on Social Charge. Sign up with my invite and check in to your first event: ${referralUrl}`
      );
    } catch {
      Alert.alert('Unable to open contacts', 'Please try again from your device.');
    }
  };

  const upcomingEvents = (events ?? []).filter((event) => event.event_status === 'upcoming');
  const pastEvents = (events ?? []).filter((event) => event.event_status !== 'upcoming');

  return (
    <SafeAreaView className="h-full bg-background-dark">
      <ScrollView className="p-4">
        <Flex gap={4}>
          <Flex direction="row" justify="flex-end">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open profile settings"
              onPress={handleOpenSettings}>
              <Icon as={MenuIcon} className="text-typography-50" size="2xl" />
            </Pressable>
          </Flex>
          <Flex align="center" gap={1}>
            {userAvater && !userAvatarLoading ? (
              <Image
                alt="picture of host"
                size="xl"
                rounded="full"
                source={{ uri: userAvater[0] ?? '' }}
              />
            ) : (
              <Flex align="center" justify="center" className="h-28 w-28 rounded-full bg-slate-500">
                <UserIcon size={48} color="#9CA3AF" />
              </Flex>
            )}
            <Text bold size="xl">
              {user?.first_name} {user?.last_name}
            </Text>
            <Flex direction="row" gap={2} wrap="wrap" justify="center">
              <Badge variant="solid" className={getMembershipBadgeClassName(user?.membership)}>
                <Text size="sm" className={getMembershipTextClassName(user?.membership)}>
                  {formatMembershipLabel(user?.membership)}
                </Text>
              </Badge>
              {user?.preferred_vibe_slug ? (
                <Badge variant="primary">
                  <Text size="sm" className="text-primary-300">
                    {formatVibeLabel(user.preferred_vibe_slug)}
                  </Text>
                </Badge>
              ) : null}
            </Flex>
          </Flex>
          {!isPro ? (
            <Button
              className={
                Platform.OS === 'android'
                  ? 'rounded-xl bg-background-700 opacity-60'
                  : 'rounded-xl bg-primary-500'
              }
              disabled={Platform.OS === 'android' || isOpeningPaywall || loadingOfferings}
              onPress={handleUpgradePress}>
              <Text bold className={Platform.OS === 'android' ? 'text-typography-400' : undefined}>
                Go Premium
              </Text>
            </Button>
          ) : null}
          <Flex gap={2} className="rounded-2xl bg-background-900 p-4">
            <Text size="xl" bold>
              Invite friends
            </Text>
            <Text>
              Earn 10 Social Batteries when a friend signs up with your link and checks in to their
              first event.
            </Text>
            <Button
              className="rounded-xl bg-primary-500"
              disabled={referralCodeLoading || !referralCode}
              onPress={handleShareReferral}>
              <Text bold>{referralCodeLoading ? 'Loading invite…' : 'Invite a contact'}</Text>
            </Button>
            {referralCode ? (
              <Text size="sm" className="text-typography-400">
                Invite code: {referralCode}
              </Text>
            ) : null}
          </Flex>
          <Flex>
            <Text size="2xl" bold className="mb-2">
              Interests
            </Text>
            {!interestsLoading && (
              <>
                <Flex direction="row" gap={4} wrap="wrap">
                  {interests?.map((interest) => (
                    <Badge
                      key={interest.interest}
                      variant="solid"
                      className="bg-background-900 px-4 py-2">
                      <Text size="sm" weight="700">
                        {interestEmojis[interest.interest]} {interest.interest}
                      </Text>
                    </Badge>
                  ))}
                </Flex>
              </>
            )}
          </Flex>
          <Flex>
            <Flex direction="row" justify="space-between" align="center" className="mt-2">
              <Text size="xl" bold>
                Upcoming Events
              </Text>
              <Button variant="link" onPress={handleViewAllUpcoming}>
                <Text>View All</Text>
              </Button>
            </Flex>
            {upcomingEvents.length ? (
              <EventsList events={upcomingEvents} loading={eventsLoading} />
            ) : (
              <Text>No upcoming events</Text>
            )}
          </Flex>
          <Flex>
            <Flex direction="row" justify="space-between" align="center" className="mt-2">
              <Text size="xl" bold>
                Events History
              </Text>
              <Button variant="link" onPress={handleViewAllPress}>
                <Text>View All</Text>
              </Button>
            </Flex>
            {pastEvents.length ? (
              <EventsList events={pastEvents} loading={eventsLoading} />
            ) : (
              <Text>No upcoming events</Text>
            )}
          </Flex>
        </Flex>
      </ScrollView>
    </SafeAreaView>
  );
}
