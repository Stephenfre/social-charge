import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventsList } from '~/components';
import { Badge, Box, Button, Flex, Image, Pressable, Text } from '~/components/ui';
import { Icon, MenuIcon } from '~/components/ui/icon';
import { useStorageImages, useTokenBalance, useUserEvents, useUserInterests } from '~/hooks';
import { useAuth } from '~/providers/AuthProvider';
import { useRevenueCat } from '~/providers/RevenueCatProvider';
import { RootStackParamList } from '~/types/navigation.types';
import { interestEmojis } from '~/utils/const';

type ProfileNav = NativeStackNavigationProp<
  RootStackParamList,
  'Event History' | 'Profile Settings'
>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();

  const { user } = useAuth();
  const { isPro, presentPaywall, loadingOfferings } = useRevenueCat();
  const { data: events, isLoading: eventsLoading } = useUserEvents(6);
  const { data: interests, isLoading: interestsLoading } = useUserInterests(user?.id!);
  const { data: tokens } = useTokenBalance();
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
              <Box className="h-28 w-28 rounded-full bg-slate-500" />
            )}
            <Text bold size="xl">
              {user?.first_name} {user?.last_name}
            </Text>
            <Badge variant="primary">
              <Text size="sm" className="uppercase text-primary-300">
                {user?.preferred_vibe_slug}
              </Text>
            </Badge>
            {/* <Text size="sm">Joined in {dayjs(user?.created_at).format('YYYY')}</Text> */}
          </Flex>
          <Flex direction="row" align="center" gap={1}>
            <Pressable className="w-1/3 rounded-lg">
              <Flex align="center" className="p-6">
                <Text size="2xl" bold>
                  {pastEvents.length ? pastEvents.length : '--'}
                </Text>
                <Text size="sm">Events</Text>
              </Flex>
            </Pressable>
            {/* <Divider orientation="vertical" className="h-2/3 bg-background-800" /> */}
            <Pressable className="w-1/3 rounded-lg">
              <Flex align="center" className="p-6">
                <Text size="2xl" bold>
                  34
                </Text>
                <Text size="sm">Friends</Text>
              </Flex>
            </Pressable>
            {/* <Divider orientation="vertical" className="h-2/3 bg-background-800" /> */}
            <Pressable className="w-1/3 rounded-lg">
              <Flex align="center" className="p-6">
                <Text size="2xl" bold>
                  {tokens ? tokens : '--'}
                </Text>
                <Text size="sm">Credits</Text>
              </Flex>
            </Pressable>
          </Flex>
          {!isPro && (
            <Button
              className="rounded-xl bg-primary-500"
              disabled={isOpeningPaywall || loadingOfferings}
              onPress={handleUpgradePress}>
              <Text bold>Go Premium</Text>
            </Button>
          )}
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
              <Text>No umpcoming events</Text>
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
              <Text>No umpcoming events</Text>
            )}
          </Flex>
        </Flex>
      </ScrollView>
    </SafeAreaView>
  );
}
