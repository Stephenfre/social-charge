import { Calendar, Heart, MapPin, View } from 'lucide-react-native';
import { Button, ButtonText, Flex, Image, Pressable, Text } from '../ui';
import { EventRow } from '~/types/event.types';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';

interface EventCardProps {
  event: EventRow;
  onPress?: () => void;
  featured?: boolean;
  favorited?: boolean;
  overlay?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showTitle?: boolean;
  showDate?: boolean;
  showLocation?: boolean;
  showToken?: boolean;
  imageSize:
    | 'none'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | 'xl-wide'
    | '2xl'
    | 'full'
    | '2xs'
    | 'xs'
    | 'cover';
  className?: string;
}

export function EventCard({
  event,
  onPress,
  featured = false,
  favorited = false,
  overlay = true,
  rounded = 'lg',
  showTitle = true,
  showDate = true,
  showLocation = true,
  showToken = true,
  imageSize,
  className,
}: EventCardProps) {
  return (
    <Flex className="relative">
      {featured && (
        <Button className="absolute left-0 top-0 z-50 m-4 h-6 rounded-md bg-red-500 px-4">
          <ButtonText className="text-sm text-white">FEATURED</ButtonText>
        </Button>
      )}
      {favorited && (
        <Pressable className="absolute right-0 top-0 z-50 mr-2 mt-3 h-6 rounded-md px-4">
          <Heart size={18} color="white" />
        </Pressable>
      )}

      <Pressable onPress={onPress} className={className}>
        <Image
          source={{
            uri: event?.cover_img ?? 'https://picsum.photos/800/400', // fallback
          }}
          size={imageSize}
          overlay={overlay}
          rounded={rounded}
          alt="image"
        />
        <LinearGradient
          colors={['transparent', '#0F1012']} // transparent top → dark bottom
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: imageSize === 'sm' ? 20 : imageSize === 'xl-wide' ? 50 : 125, // how tall the fade should be
          }}
        />
      </Pressable>

      <Flex direction="column" gap={1} className="absolute left-0 top-36 z-50 px-4">
        {showToken && (
          <Button className="h-6 w-10 rounded-md bg-green-500 p-0">
            <ButtonText className="text-sm text-white">${event?.token_cost}</ButtonText>
          </Button>
        )}

        {showTitle && event?.title && (
          <Text size="lg" bold className="text-white">
            {event?.title}
          </Text>
        )}

        {(showDate || showLocation) && (
          <Flex direction="row" gap={4}>
            {showDate && event?.starts_at && (
              <Flex direction="row" align="center" gap={1}>
                <Calendar color={'white'} size={14} />
                <Text size="lg" className="text-white">
                  {dayjs(event?.starts_at).format('MMM DD')}
                </Text>
              </Flex>
            )}
            {showLocation && event?.location && (
              <Flex direction="row" align="center" gap={1}>
                <MapPin color={'white'} size={14} />
                <Text size="lg" className="text-white">
                  {event?.location}
                </Text>
              </Flex>
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}
