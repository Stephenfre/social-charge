import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventsList } from '~/components';
import { Badge, Box, Button, Flex, Image, Pressable, Text } from '~/components/ui';
import { useMyTokenBalance, useStorageImages, useUserEvents, useUserInterests } from '~/hooks';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { RootStackParamList } from '~/types/navigation.types';
import { interestEmojis } from '~/utils/const';
import { useTheme } from '~/providers/ThemeProvider';

type EventHistory = NativeStackNavigationProp<RootStackParamList, 'Event History'>;

export function ProfileScreen() {
  const navigation = useNavigation<EventHistory>();

  const { user } = useAuth();
  const { data: events, isLoading: eventsLoading } = useUserEvents(6);
  const { data: interests, isLoading: interestsLoading } = useUserInterests(user?.id!);
  const { data: tokens, isLoading: tokensLoading } = useMyTokenBalance();
  const { data: userAvater, isLoading: userAvatarLoading } = useStorageImages({
    bucket: 'avatars',
    paths: [user?.profile_picture],
  });
  const { isDark, setMode, palette } = useTheme();

  const handleViewAllPress = () => {
    navigation.navigate('Event History');
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    console.log(error);
  };

  const filterEventsByPast = events?.filter((event) => event.event_status !== 'upcoming');

  return (
    <SafeAreaView className="h-full bg-background-dark">
      <ScrollView className="p-4">
        <Flex gap={4}>
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
            <Text bold size="2xl">
              {user?.first_name} {user?.last_name}
            </Text>
            {/* Add THIS TO DB */}
            {/* Add THIS TO DB */}
            <Text size="sm">@DevinBooker</Text>
            <Text size="sm">Joined in {dayjs(user?.created_at).format('YYYY')}</Text>
            <Badge variant="primary">
              <Text size="sm" className="uppercase text-primary-300">
                {user?.preferred_vibe_slug}
              </Text>
            </Badge>
          </Flex>
          <Flex direction="row" align="center" gap={1}>
            <Pressable className="w-1/3 rounded-lg">
              <Flex align="center" className="p-6">
                <Text size="2xl" bold>
                  {filterEventsByPast?.length ? filterEventsByPast.length : '--'}
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
          <Flex className="rounded-2xl bg-background-900 p-4">
            <Flex direction="row" justify="space-between" align="center">
              <Flex gap={1}>
                <Text bold size="lg">
                  Dark Mode
                </Text>
                <Text size="sm" className="text-typography-500">
                  Switch between light and dark appearance.
                </Text>
              </Flex>
              <Switch
                value={isDark}
                onValueChange={(value) => setMode(value ? 'dark' : 'light')}
                trackColor={{ false: '#a1a1aa', true: palette.accent }}
                thumbColor={isDark ? palette.inverseText : '#f4f4f5'}
                ios_backgroundColor="#a1a1aa"
              />
            </Flex>
          </Flex>
          <Flex direction="row" justify="space-between" className="my-2">
            <Text size="2xl" bold>
              Events History
            </Text>
            <Button variant="link" onPress={handleViewAllPress}>
              <Text>View All</Text>
            </Button>
          </Flex>
          <EventsList events={events ?? []} loading={eventsLoading} />
        </Flex>
      </ScrollView>
      <Button className="mx-4" onPress={logout}>
        <Text>Logout</Text>
      </Button>
    </SafeAreaView>
  );
}
