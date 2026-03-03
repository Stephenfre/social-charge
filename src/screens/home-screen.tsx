import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, ButtonText, Flex, Pressable, Text } from '~/components/ui';
import { FontAwesome } from '@expo/vector-icons';
import ReanimatedSkeleton from 'react-native-reanimated-skeleton';

import { useAuth } from '~/providers/AuthProvider';
import {
  useForYouEvents,
  useLowTokenEvents,
  useThisWeekendEvents,
  // useTrendingEvents,
  useUpcomingEvents,
} from '~/hooks';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '~/types/navigation.types';
import { EventCard } from '~/components/EventCard/EventCard';
import { OnboardingCompletionModal } from '~/components';
import { SafeAreaView } from 'react-native-safe-area-context';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'HomeIndex'>;

const BONE_COLOR = '#3F3F46';
const HIGHLIGHT_COLOR = '#52525B';

function HomeFeaturedSkeleton() {
  return (
    <ReanimatedSkeleton
      isLoading
      boneColor={BONE_COLOR}
      highlightColor={HIGHLIGHT_COLOR}
      containerStyle={{ width: '100%', height: 256 }}
      layout={[{ key: 'featured', width: '100%', height: 256, borderRadius: 12 }]}
    />
  );
}

function HomeWideCardSkeleton() {
  return (
    <Flex gap={2} className="w-96">
      <ReanimatedSkeleton
        isLoading
        boneColor={BONE_COLOR}
        highlightColor={HIGHLIGHT_COLOR}
        containerStyle={{ width: 368, height: 256 }}
        layout={[{ key: 'image', width: 368, height: 256, borderRadius: 12 }]}
      />
    </Flex>
  );
}

function HomeForYouSkeleton() {
  return (
    <Flex gap={2}>
      <ReanimatedSkeleton
        isLoading
        boneColor={BONE_COLOR}
        highlightColor={HIGHLIGHT_COLOR}
        containerStyle={{ width: 176, height: 128 }}
        layout={[{ key: 'image', width: 176, height: 128, borderRadius: 12 }]}
      />
      <ReanimatedSkeleton
        isLoading
        boneColor={BONE_COLOR}
        highlightColor={HIGHLIGHT_COLOR}
        containerStyle={{ width: 160, height: 40 }}
        layout={[
          { key: 'title', width: 140, height: 16, borderRadius: 6 },
          { key: 'meta', width: 160, height: 14, marginTop: 10, borderRadius: 6 },
        ]}
      />
    </Flex>
  );
}

function HomeUpcomingRowSkeleton() {
  return (
    <Flex gap={2} direction="row" className="w-80 pr-2">
      <ReanimatedSkeleton
        isLoading
        boneColor={BONE_COLOR}
        highlightColor={HIGHLIGHT_COLOR}
        containerStyle={{ width: 64, height: 64 }}
        layout={[{ key: 'image', width: 56, height: 56, borderRadius: 12 }]}
      />
      <ReanimatedSkeleton
        isLoading
        boneColor={BONE_COLOR}
        highlightColor={HIGHLIGHT_COLOR}
        containerStyle={{ width: 224, height: 64 }}
        layout={[
          { key: 'title', width: 120, height: 12, borderRadius: 6 },
          { key: 'token', width: 32, height: 24, marginLeft: 148, marginTop: -12, borderRadius: 6 },
          { key: 'location', width: 100, height: 10, marginTop: 4, borderRadius: 6 },
          { key: 'date', width: 96, height: 10, marginTop: 8, borderRadius: 6 },
        ]}
      />
    </Flex>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();

  const { userId, justCompletedOnboarding, setJustCompletedOnboarding } = useAuth();
  const [completionVisible, setCompletionVisible] = useState(false);

  useEffect(() => {
    setCompletionVisible(justCompletedOnboarding);
  }, [justCompletedOnboarding]);

  const handleCloseCompletion = useCallback(() => {
    setCompletionVisible(false);
    setJustCompletedOnboarding(false);
  }, [setJustCompletedOnboarding]);

  const { data: forYouEvents = [], isLoading: forYouEventsLoading } = useForYouEvents(userId);
  const { data: upcomingEvents = [], isLoading: upcomingEventsLoading } = useUpcomingEvents();
  const { data: lowTokenEvents = [], isLoading: lowTokenEventsLoading } = useLowTokenEvents();
  const { data: thisWeekendEvents = [], isLoading: thisWeekendEventsLoading } =
    useThisWeekendEvents();
  // const { data: trendingEvents = [], isLoading: trendingEventsLoading } = useTrendingEvents();

  function splitIntoRows<T>(arr: T[], numRows: number): T[][] {
    const rows: T[][] = Array.from({ length: numRows }, () => []);
    arr.forEach((item, index) => {
      rows[index % numRows].push(item);
    });
    return rows;
  }

  const upcomingEventRows = splitIntoRows(upcomingEvents, 2);
  const upcomingEventRowSkeletons = splitIntoRows(Array.from({ length: 4 }), 2);

  // const trendingEventRows = splitIntoRows(trendingEvents, 3);
  // const trendingEventRowSkeletons = splitIntoRows(Array.from({ length: 4 }), 2);

  const handlePressNavigateToViewEvent = (eventId: string) => {
    navigation.navigate('ViewEvent', { eventId });
  };
  const handleNavigateToAllEvents = () => {
    navigation.navigate('All Events');
  };

  return (
    <SafeAreaView className="flex flex-1 bg-background-dark" edges={['top']}>
      <ScrollView className="my-2">
        <Flex gap={4}>
          {upcomingEventsLoading || upcomingEvents.length ? (
            <View className="mx-4">
              {upcomingEventsLoading ? (
                <HomeFeaturedSkeleton />
              ) : (
                <EventCard
                  onPress={() => handlePressNavigateToViewEvent(upcomingEvents[3]?.id)}
                  event={upcomingEvents[0]}
                  featured
                  imageSize="cover"
                />
              )}
            </View>
          ) : null}

          {/* fix to remove ongoing events */}

          {thisWeekendEventsLoading || thisWeekendEvents.length ? (
            <Flex gap={4}>
              <Flex direction="row" justify="space-between" align="center" className="mx-4">
                <Text size="xl" bold>
                  This Weekend
                </Text>
                <Button variant="link" onPress={handleNavigateToAllEvents}>
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
                      return <HomeWideCardSkeleton key={i} />;
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
          ) : null}

          {forYouEventsLoading || forYouEvents.length ? (
            <Flex gap={4}>
              <Flex direction="row" justify="space-between" align="center" className="mx-4">
                <Text size="xl" bold>
                  Just for you
                </Text>
                <Button variant="link" onPress={handleNavigateToAllEvents}>
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
                      return <HomeForYouSkeleton key={i} />;
                    })}
                  </>
                ) : (
                  <>
                    {forYouEvents.map((event) => {
                      return (
                        <Pressable
                          key={event.id}
                          onPress={() => handlePressNavigateToViewEvent(event.id)}>
                          <Flex gap={2} key={event.id}>
                            <EventCard
                              event={event}
                              onPress={() => handlePressNavigateToViewEvent(event.id)}
                              rounded="md"
                              imageSize="xl-wide"
                              className="pr-2"
                              showTitle={false}
                              showDate={false}
                              showLocation={false}
                              showToken={false}
                            />
                            <Flex>
                              <Text
                                size="md"
                                weight="600"
                                className="w-40"
                                numberOfLines={1}
                                ellipsizeMode="tail">
                                {event?.title}
                              </Text>
                              <Flex direction="row">
                                <Text size="sm" className="text-gray-500">
                                  {dayjs(event?.starts_at).format('ddd MM/DD')}
                                </Text>
                                <Text size="sm" className="text-gray-500">
                                  {' '}
                                  | {event?.location_text}
                                </Text>
                              </Flex>
                            </Flex>
                          </Flex>
                        </Pressable>
                      );
                    })}
                  </>
                )}
              </ScrollView>
            </Flex>
          ) : null}

          {upcomingEventsLoading || upcomingEvents.length ? (
            <Flex gap={4}>
              <Flex direction="row" justify="space-between" align="center" className="mx-4">
                <Text size="xl" bold>
                  Upcoming Events
                </Text>
                <Button variant="link" onPress={handleNavigateToAllEvents}>
                  <Flex direction="row" align="center" gap={2}>
                    <Text className="text-typography-light">View All</Text>
                    <FontAwesome name="chevron-right" size={12} color="white" />
                  </Flex>
                </Button>
              </Flex>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 14, paddingRight: 8 }}>
                <Flex direction="column" gap={2}>
                  {upcomingEventsLoading ? (
                    <>
                      {upcomingEventRowSkeletons.map((row, rowIndex) => (
                        <Flex key={rowIndex} direction="row" gap={2} className="mb-2">
                          {row.map((_, i) => (
                            <HomeUpcomingRowSkeleton key={`${rowIndex}-${i}`} />
                          ))}
                        </Flex>
                      ))}
                    </>
                  ) : (
                    <>
                      {upcomingEventRows.map((row, rowIndex) => (
                        <Flex direction="row" gap={2} key={rowIndex}>
                          {row.map((event) => (
                            <Pressable
                              className="w-80"
                              key={event.id}
                              onPress={() => handlePressNavigateToViewEvent(event.id)}>
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
                                  <Flex direction="row" gap={2}>
                                    <Text
                                      size="md"
                                      weight="600"
                                      className="w-40"
                                      numberOfLines={1}
                                      ellipsizeMode="tail">
                                      {event?.title}
                                    </Text>
                                    <Button className="h-6 w-8 rounded-md bg-green-500 p-0">
                                      <ButtonText className="text-xs text-white">
                                        ${event?.token_cost}
                                      </ButtonText>
                                    </Button>
                                  </Flex>
                                  <Flex>
                                    <Text size="sm" className="text-gray-500">
                                      {event?.location_text}
                                    </Text>
                                    <Text size="sm" className="text-gray-500">
                                      {dayjs(event?.starts_at).format('ddd MM/DD')}
                                    </Text>
                                  </Flex>
                                </Flex>
                              </Flex>
                            </Pressable>
                          ))}
                        </Flex>
                      ))}
                    </>
                  )}
                </Flex>
              </ScrollView>
            </Flex>
          ) : null}

          {lowTokenEventsLoading || lowTokenEvents.length ? (
            <Flex gap={4}>
              <Flex direction="row" justify="space-between" align="center" className="mx-4">
                <Text size="xl" bold>
                  Low Token Events
                </Text>
                <Button variant="link" onPress={handleNavigateToAllEvents}>
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
                      return <HomeWideCardSkeleton key={i} />;
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
          ) : null}

          {/* <Flex gap={4}>
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
                                  | {event?.location_text}
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
          </Flex> */}
        </Flex>
      </ScrollView>
      <OnboardingCompletionModal visible={completionVisible} onClose={handleCloseCompletion} />
    </SafeAreaView>
  );
}
