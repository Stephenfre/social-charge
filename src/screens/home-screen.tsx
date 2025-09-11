import dayjs from 'dayjs';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { Button, Flex, Skeleton, Text } from '~/components/ui';
import { FontAwesome } from '@expo/vector-icons';

import { useAuth } from '~/providers/AuthProvider';
import {
  useForYouEvents,
  useLowTokenEvents,
  useThisWeekendEvents,
  useTrendingEvents,
  useUpcomingEvents,
} from '~/hooks';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '~/types/navigation.types';
import { supabase } from '~/lib/supabase';
import { EventCard } from '~/components/EventCard/EventCard';

type ViewEventNav = NativeStackNavigationProp<RootStackParamList, 'ViewEvent'>;

export function HomeScreen() {
  const navigation = useNavigation<ViewEventNav>();

  const { userId } = useAuth();

  const { data: forYouEvents = [], isLoading: forYouEventsLoading } = useForYouEvents(userId);
  const { data: upcomingEvents = [], isLoading: upcomingEventsLoading } = useUpcomingEvents();
  const { data: lowTokenEvents = [], isLoading: lowTokenEventsLoading } = useLowTokenEvents();
  const { data: thisWeekendEvents = [], isLoading: thisWeekendEventsLoading } =
    useThisWeekendEvents();
  const { data: trendingEvents = [], isLoading: trendingEventsLoading } = useTrendingEvents();

  function splitIntoRows<T>(arr: T[], numRows: number): T[][] {
    const rows: T[][] = Array.from({ length: numRows }, () => []);
    arr.forEach((item, index) => {
      rows[index % numRows].push(item);
    });
    return rows;
  }

  const upcomingEventRows = splitIntoRows(upcomingEvents, 2);
  const upcomingEventRowSkeletons = splitIntoRows(Array.from({ length: 4 }), 2);

  const trendingEventRows = splitIntoRows(trendingEvents, 3);
  const trendingEventRowSkeletons = splitIntoRows(Array.from({ length: 4 }), 2);

  const handlePressNavigateToViewEvent = (eventId: string) => {
    navigation.navigate('ViewEvent', { eventId });
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    console.log(error);
  };

  return (
    <SafeAreaView className=" h-full bg-background-dark">
      <ScrollView className="my-2">
        <Flex gap={4}>
          <View className="mx-4">
            {upcomingEventsLoading ? (
              <Flex>
                <Skeleton className="h-64 w-full" />
              </Flex>
            ) : (
              <EventCard
                onPress={() => handlePressNavigateToViewEvent(upcomingEvents[7]?.id)}
                event={upcomingEvents[7]}
                featured
                imageSize="cover"
              />
            )}
          </View>
          <Flex gap={4}>
            <Flex direction="row" justify="space-between" align="center" className="mx-4">
              <Text size="xl" bold>
                This Weekend
              </Text>
              <Button variant="link">
                <Flex direction="row" align="center" gap={2}>
                  <Text className="text-typography-light">View All</Text>
                  <FontAwesome name="chevron-right" size={12} color="white" />
                </Flex>
              </Button>
            </Flex>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 14 }}>
              {thisWeekendEventsLoading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => {
                    return (
                      <Flex key={i} className="mr-2 w-96">
                        <Skeleton className="h-64 w-full" />
                      </Flex>
                    );
                  })}
                </>
              ) : (
                <>
                  {thisWeekendEvents.map((event) => {
                    return (
                      <Flex gap={2} key={event.id} className="w-96">
                        <EventCard
                          event={event}
                          onPress={() => handlePressNavigateToViewEvent(event.id)}
                          rounded="md"
                          favorited
                          imageSize="cover"
                          className="pr-2"
                        />
                      </Flex>
                    );
                  })}
                </>
              )}
            </ScrollView>
          </Flex>
          <Flex gap={4}>
            <Flex direction="row" justify="space-between" align="center" className="mx-4">
              <Text size="xl" bold>
                Just for you
              </Text>
              <Button variant="link">
                <Flex direction="row" align="center" gap={2}>
                  <Text className="text-typography-light">View All</Text>
                  <FontAwesome name="chevron-right" size={12} color="white" />
                </Flex>
              </Button>
            </Flex>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 14 }}>
              {forYouEventsLoading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => {
                    return (
                      <Flex gap={2} key={i}>
                        <Skeleton className="mr-2 h-32 w-44" />
                        <Flex gap={2}>
                          <Skeleton className="h-5 w-24" />
                          <Flex direction="row">
                            <Skeleton className="h-5 w-40" />
                          </Flex>
                        </Flex>
                      </Flex>
                    );
                  })}
                </>
              ) : (
                <>
                  {forYouEvents.map((event) => {
                    return (
                      <Flex gap={2} key={event.id}>
                        <EventCard
                          event={event}
                          onPress={() => handlePressNavigateToViewEvent(event.id)}
                          rounded="md"
                          favorited
                          imageSize="xl-wide"
                          className="pr-2"
                          showTitle={false}
                          showDate={false}
                          showLocation={false}
                          showToken={false}
                        />
                        <Flex>
                          <Text size="md" weight="600" className="w-40">
                            {event?.title}
                          </Text>
                          <Flex direction="row">
                            <Text size="sm" className="text-gray-500">
                              {dayjs(event?.starts_at).format('ddd MM/DD')}
                            </Text>
                            <Text size="sm" className="text-gray-500">
                              {' '}
                              | {event?.location}
                            </Text>
                          </Flex>
                        </Flex>
                      </Flex>
                    );
                  })}
                </>
              )}
            </ScrollView>
          </Flex>
          <Flex gap={4}>
            <Flex direction="row" justify="space-between" align="center" className="mx-4">
              <Text size="xl" bold>
                Upcoming Events
              </Text>
              <Button variant="link">
                <Button variant="link">
                  <Flex direction="row" align="center" gap={2}>
                    <Text className="text-typography-light">View All</Text>
                    <FontAwesome name="chevron-right" size={12} color="white" />
                  </Flex>
                </Button>
              </Button>
            </Flex>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 14, paddingRight: 8 }}>
              <Flex direction="column" gap={2}>
                {upcomingEventsLoading ? (
                  <>
                    {
                      !upcomingEventRowSkeletons.map((row, rowIndex) => (
                        <Flex key={rowIndex} direction="row" gap={2}>
                          {row.map((_, i) => (
                            <Flex
                              gap={2}
                              direction="row"
                              justify="space-between"
                              className="w-80 pr-2"
                              key={i}>
                              <Flex direction="row" gap={4}>
                                <Skeleton className="h-16 w-16" />
                                <Flex gap={4}>
                                  <Skeleton className="h-4 w-36" />
                                  <Skeleton className="h-4 w-20" />
                                </Flex>
                              </Flex>
                              <Skeleton className="w-16 rounded-xl bg-gray-300 p-2" />
                            </Flex>
                          ))}
                        </Flex>
                      ))
                    }
                  </>
                ) : (
                  <>
                    {upcomingEventRows.map((row, rowIndex) => (
                      <Flex key={rowIndex} direction="row" gap={2}>
                        {row.map((event) => (
                          <Flex gap={2} direction="row" className="pr-2" key={event.id}>
                            <EventCard
                              event={event}
                              onPress={() => handlePressNavigateToViewEvent(event.id)}
                              rounded="md"
                              imageSize="sm"
                              showTitle={false}
                              showDate={false}
                              showLocation={false}
                              showToken={false}
                            />
                            <Flex>
                              <Text size="md" weight="600" className="w-40">
                                {event?.title}
                              </Text>
                              <Flex direction="row">
                                <Text size="sm" className="text-gray-500">
                                  {dayjs(event?.starts_at).format('ddd MM/DD')}
                                </Text>
                                <Text size="sm" className="text-gray-500">
                                  {' '}
                                  | Venue
                                </Text>
                              </Flex>
                            </Flex>
                            <Flex
                              className="w-16 rounded-xl bg-background-900 p-2"
                              justify="center"
                              align="center">
                              <Text className="text-primary" weight="500">
                                RSVP
                              </Text>
                              <Text className="text-white" weight="500">
                                {event?.token_cost} $B
                              </Text>
                            </Flex>
                          </Flex>
                        ))}
                      </Flex>
                    ))}
                  </>
                )}
              </Flex>
            </ScrollView>
          </Flex>
          <Flex gap={4}>
            <Flex direction="row" justify="space-between" align="center" className="mx-4">
              <Text size="xl" bold>
                Low Token Events
              </Text>
              <Button variant="link">
                <Flex direction="row" align="center" gap={2}>
                  <Text className="text-typography-light">View All</Text>
                  <FontAwesome name="chevron-right" size={12} color="white" />
                </Flex>
              </Button>
            </Flex>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 14 }}>
              {lowTokenEventsLoading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => {
                    return (
                      <Flex key={i} className="mr-2 w-96">
                        <Skeleton className="h-64 w-full" />
                      </Flex>
                    );
                  })}
                </>
              ) : (
                <>
                  {lowTokenEvents.map((event) => {
                    return (
                      <Flex gap={2} key={event.id} className="w-96">
                        <EventCard
                          event={event}
                          onPress={() => handlePressNavigateToViewEvent(event.id)}
                          rounded="md"
                          favorited
                          imageSize="cover"
                          className="pr-2"
                        />
                      </Flex>
                    );
                  })}
                </>
              )}
            </ScrollView>
          </Flex>
          <Flex gap={4}>
            <Flex direction="row" justify="space-between" align="center" className="mx-4">
              <Text size="xl" bold>
                Trending Events
              </Text>
              <Button variant="link">
                <Button variant="link">
                  <Flex direction="row" align="center" gap={2}>
                    <Text className="text-typography-light">View All</Text>
                    <FontAwesome name="chevron-right" size={12} color="white" />
                  </Flex>
                </Button>
              </Button>
            </Flex>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 14, paddingRight: 8 }}>
              <Flex direction="column" gap={2}>
                {trendingEventsLoading ? (
                  <>
                    {
                      !trendingEventRowSkeletons.map((row, rowIndex) => (
                        <Flex key={rowIndex} direction="row" gap={2}>
                          {row.map((_, i) => (
                            <Flex
                              gap={2}
                              direction="row"
                              justify="space-between"
                              className="w-80 pr-2"
                              key={i}>
                              <Flex direction="row" gap={4}>
                                <Skeleton className="h-16 w-16" />
                                <Flex gap={4}>
                                  <Skeleton className="h-4 w-36" />
                                  <Skeleton className="h-4 w-20" />
                                </Flex>
                              </Flex>
                              <Skeleton className="w-16 rounded-xl bg-gray-300 p-2" />
                            </Flex>
                          ))}
                        </Flex>
                      ))
                    }
                  </>
                ) : (
                  <>
                    {trendingEventRows.map((row, rowIndex) => (
                      <Flex key={rowIndex} direction="row" gap={2}>
                        {row.map((event) => (
                          <Flex gap={2} direction="row" className="pr-2" key={event.id}>
                            <EventCard
                              event={event}
                              onPress={() => handlePressNavigateToViewEvent(event.id)}
                              rounded="md"
                              imageSize="sm"
                              showTitle={false}
                              showDate={false}
                              showLocation={false}
                              showToken={false}
                            />
                            <Flex>
                              <Text size="md" weight="600" className="w-40">
                                {event?.title}
                              </Text>
                              <Flex direction="row">
                                <Text size="sm" className="text-gray-500">
                                  {dayjs(event?.starts_at).format('ddd MM/DD')}
                                </Text>
                                <Text size="sm" className="text-gray-500">
                                  {' '}
                                  | Venue
                                </Text>
                              </Flex>
                            </Flex>
                            <Flex
                              className="w-16 rounded-xl bg-background-900 p-2"
                              justify="center"
                              align="center">
                              <Text className="text-primary" weight="500">
                                RSVP
                              </Text>
                              <Text className="text-white" weight="500">
                                {event?.token_cost} $B
                              </Text>
                            </Flex>
                          </Flex>
                        ))}
                      </Flex>
                    ))}
                  </>
                )}
              </Flex>
            </ScrollView>
          </Flex>
        </Flex>
        <Button onPress={logout}>
          <Text>Logout</Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
