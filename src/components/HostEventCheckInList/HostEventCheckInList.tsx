import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';
import { Button, Flex, Image, Pressable, Text } from '~/components/ui';
import { Spinner } from '~/components/ui/spinner';
import { useHostEvents } from '~/hooks';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../ui/icon';
import { Calendar, Clock, MapPin, QrCode } from 'lucide-react-native';
import { Map } from '../Map/Map';
import { RootStackParamList } from '~/types/navigation.types';
import { EventRow } from '~/types/event.types';

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = Math.min(400, Math.round(SCREEN_W * 0.9));
const GAP = 14;
const SIDE_SPACER = Math.max(0, Math.round((SCREEN_W - CARD_W) / 2));

type HostNav = NativeStackNavigationProp<RootStackParamList>;

export function HostEventCheckInList() {
  const { data: events, isLoading: eventsLoading } = useHostEvents();
  const navigation = useNavigation<HostNav>();

  const keyExtractor = useCallback(
    (item: EventRow, index: number) => item.id ?? `event-${index}`,
    []
  );

  const handleOpenScanner = useCallback(
    (event: EventRow) => {
      navigation.navigate('ScanQrModal', {
        runId: event.id ?? null,
        runTitle: event.title ?? null,
        runStartTime: event.starts_at ?? null,
        runEndTime: event.ends_at ?? null,
        locationName: event.location_text ?? null,
      });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: EventRow }) => (
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
          <Text size="5xl" bold>
            {item.title}
          </Text>

          <Flex direction="row" gap={4}>
            <Flex direction="row" align="center" gap={2}>
              <Icon as={Calendar} size={'lg'} className="text-typography-light" />
              <Text size="lg">{dayjs(item.starts_at).format('ddd, MMM DD')}</Text>
            </Flex>
            <Flex direction="row" align="center" gap={2}>
              <Icon as={Clock} size={'lg'} className="text-typography-light" />
              <Text size="lg">
                {dayjs(item.starts_at).format('h:mm A')} - {dayjs(item.ends_at).format('h:mm A')}
              </Text>
            </Flex>
          </Flex>
          <Flex direction="row" align="center" gap={2}>
            <Icon as={MapPin} size={'lg'} className="text-typography-light" />
            <Text size="lg">{item.location_text}</Text>
          </Flex>
          {/* <Map
            height={150}
            rounded
            liteMode
            location={{
              latitude: item.latitude ?? undefined,
              longitude: item.longitude ?? undefined,
            }}
          /> */}

          <Button
            size="lg"
            variant="outline"
            className="mt-6 border border-primary-400 bg-transparent"
            onPress={() => handleOpenScanner(item)}>
            <Flex direction="row" align="center" justify="center" gap={2}>
              <Icon as={QrCode} size={'lg'} className="text-typography-light" />
              <Text bold size="lg">
                Scan QR Code
              </Text>
            </Flex>
          </Button>
        </Flex>
      </Pressable>
    ),
    [handleOpenScanner, navigation]
  );

  if (eventsLoading) {
    return (
      <View className="h-56 items-center justify-center">
        <Spinner />
      </View>
    );
  }

  if (!events?.length) {
    return <View className="h-40 items-center justify-center"></View>;
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
