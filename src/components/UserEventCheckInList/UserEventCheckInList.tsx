import { useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';
import {  Button, Flex, Image, Pressable, Text } from '~/components/ui';
import { Spinner } from '~/components/ui/spinner';
import { useUserEventCheckIns, useUserEvents } from '~/hooks';
import type { UserEventCardRow } from '~/types/event.types';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../ui/icon';
import { Calendar, CheckCircle2, Clock, MapPin, TicketX } from 'lucide-react-native';
import { UserCheckInQr } from '../UserCheckInQr/UserCheckInQr';
import { RootStackParamList } from '~/types/navigation.types';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = Math.min(400, Math.round(SCREEN_W * 0.9));
const GAP = 14;
const SIDE_SPACER = Math.max(0, Math.round((SCREEN_W - CARD_W) / 2));

export function UserEventCheckInList() {
  const { data: events, isLoading: eventsLoading } = useUserEvents(6);
  const eventIds = useMemo(
    () => (events ?? []).map((event) => event.id).filter(Boolean) as string[],
    [events]
  );
  const { data: checkedInEvents } = useUserEventCheckIns(eventIds);

  const checkedInEventIds = useMemo(
    () => new Set((checkedInEvents ?? []).map((row) => row.event_id)),
    [checkedInEvents]
  );

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'CheckInIndex'>>();

  const keyExtractor = useCallback(
    (item: UserEventCardRow, index: number) => item.id ?? `event-${index}`,
    []
  );

  const handlePressNavigateToViewEvent = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' as never }],
    });
  };

  const renderItem = useCallback(
    ({ item }: { item: UserEventCardRow }) => {
      const hasEventEnded =
        item.event_status === 'past' ||
        (item.ends_at ? dayjs().isAfter(dayjs(item.ends_at)) : false);
      const isCheckedIn = !!item.id && checkedInEventIds.has(item.id);

      return (
        <Pressable
          className="mr-8 mt-16 flex h-[90%] rounded-2xl bg-background-900"
          onPress={() => {
            console.log('pressed');
            navigation.navigate('CheckInIndex', { eventId: item.id! });
          }}
          style={{
            width: CARD_W,
            marginRight: GAP,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.6,
            shadowRadius: 10,
            elevation: 6,
          }}>
          <View style={{ borderRadius: 16, overflow: 'hidden' }}>
            <Image
              source={item?.cover_img ? { uri: item.cover_img } : undefined}
              size="cover"
              overlay={false}
              alt="image"
              rounded="2xl"
            />
            <LinearGradient colors={['transparent', '#18191f']} style={styles.gradient} />
          </View>

          <Flex className="px-4">
            <Flex direction="row" align="center" justify="space-between">
              <Text size="5xl" bold className="flex-1">
                {item.title}
              </Text>
            </Flex>

            <Flex direction="row" gap={4}>
              <Flex direction="row" align="center" gap={2}>
                <Icon as={Calendar} size={'lg'} className="text-typography-light" />
                <Text size="lg">{dayjs(item.starts_at).format('ddd, MMM DD')}</Text>
              </Flex>
              <Flex direction="row" align="center" gap={2}>
                <Icon as={Clock} size={'lg'} className="text-typography-light" />
                <Text size="lg">{dayjs(item.starts_at).format('h:mm A')}</Text>
              </Flex>
            </Flex>
            <Flex direction="row" align="center" gap={2}>
              <Icon as={MapPin} size={'lg'} className="text-typography-light" />
              <Text size="lg">{item.location_text}</Text>
            </Flex>

            <Flex align="center" className="mt-10">
              {!hasEventEnded &&
                (isCheckedIn ? (
                  <Flex align="center" gap={2}>
                    <Icon as={CheckCircle2} size={'4xl'} className="text-green-500" />
                    <Text size="xl" className="text-green-500">
                      Checked in
                    </Text>
                  </Flex>
                ) : (
                  <UserCheckInQr eventId={item.id!} size={160} />
                ))}
            </Flex>
          </Flex>
          {hasEventEnded && (
            <View className="absolute inset-0 items-center justify-center rounded-2xl bg-black/60">
              <Text size="xl" bold className="text-white">
                Event has ended
              </Text>
            </View>
          )}
        </Pressable>
      );
    },
    [checkedInEventIds, navigation]
  );

  if (eventsLoading) {
    return (
      <SafeAreaView className="h-full bg-background-dark">
        <Flex flex justify="center" align="center">
          <Spinner color={'white'} />
        </Flex>
      </SafeAreaView>
    );
  }

  if (!events?.length) {
    return (
      <SafeAreaView className="h-full bg-background-dark">
        <Flex align="center" className="m-auto" gap={4}>
          <Flex align="center">
            <TicketX size={48} color={'white'} />
            <Text bold size="xl">
              Looks like your calendar’s clear
            </Text>
            <Text size="sm">Time to find something worth showing up for.</Text>
          </Flex>
          <Button className="rounded-lg" onPress={handlePressNavigateToViewEvent}>
            <Text bold>Find Events</Text>
          </Button>
        </Flex>
      </SafeAreaView>
    );
  }

  return (
    <Flex flex className="bg-background-dark">
      <FlatList
        horizontal
        data={events}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={false}
        bounces={false}
        alwaysBounceHorizontal={false}
        overScrollMode="never"
        contentContainerStyle={{
          paddingLeft: SIDE_SPACER,
          paddingRight: SIDE_SPACER,
          paddingVertical: 16,
        }}
        getItemLayout={(_, index) => ({
          length: CARD_W + GAP,
          offset: (CARD_W + GAP) * index,
          index,
        })}
      />
    </Flex>
  );
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
});
