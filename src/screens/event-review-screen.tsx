import { ScrollView, View, TextInput, Alert } from 'react-native';
import { Box, Button, Flex, Image, Text } from '~/components/ui';
import { useEventById, useStorageImages, useSubmitEventReview } from '~/hooks';
import { useRouteStack } from '~/types/navigation.types';

import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { VibeSlug } from '~/hooks/useEvents';

export const VIBE_CATEGORIES = {
  personality: [
    'chill',
    'wildcard',
    'observer',
    'deep_connector',
    'fun_maker',
    'connector',
    'mystery',
  ],
  social_energy: ['nightlife', 'hype_starter', 'social_butterfly', 'karaoke_star'],
  lifestyle: ['homebody', 'early_riser', 'night_owl', 'planner', 'spontaneous', 'zen'],
  interests: [
    'culture',
    'music_lover',
    'style_icon',
    'chill_gamer',
    'dog_person',
    'late_night_foodie',
  ],
  adventure: ['explorer', 'trailblazer', 'spontaneous_traveler', 'summer_energy'],
  seasonal: ['holiday_spirit'],
  reputation: ['mvp', 'vibe_validator'],
} as const satisfies Record<string, readonly VibeSlug[]>;

const formatVibeLabel = (slug: VibeSlug) => {
  if (slug === 'mvp') return 'MVP';
  return slug
    .split(/[-_]/g)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatCategoryLabel = (key: keyof typeof VIBE_CATEGORIES) =>
  key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const VIBE_ENUM_VALUES = Object.values(VIBE_CATEGORIES).flat() as VibeSlug[];
const VIBE_ENUM_TUPLE = VIBE_ENUM_VALUES as [VibeSlug, ...VibeSlug[]];

// --- Zod Schema ---
const reviewSchema = z.object({
  eventRating: z.number().min(1, 'Please rate the event'),
  eventComment: z.string().optional(),

  venueRating: z.number().min(1, 'Please rate the venue'),
  venueComment: z.string().optional(),

  hostRating: z.number().min(1, 'Please rate the host'),
  hostComment: z.string().optional(),

  attendeeVibes: z.record(z.string(), z.enum(VIBE_ENUM_TUPLE).optional()),
});
type ReviewFormValues = z.infer<typeof reviewSchema>;

export function EventReviewScreen() {
  const { params } = useRouteStack<'EventReview'>();
  const { data: event, isLoading } = useEventById(params.eventId!);

  // Load avatars for checked-in attendees
  const checkInAvatarPaths = event?.check_ins?.map((r) => r.profile_picture) ?? [];
  const { data: eventCheckInUserAvatar = [], isLoading: eventCheckInUserAvatarLoading } =
    useStorageImages({
      bucket: 'avatars',
      paths: checkInAvatarPaths,
    });

  const { mutateAsync: submitReview, isPending } = useSubmitEventReview();

  // --- Form setup ---
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      eventRating: 0,
      eventComment: '',
      venueRating: 0,
      venueComment: '',
      hostRating: 0,
      hostComment: '',
      attendeeVibes: {},
    },
  });

  // Helper UI: 1–5 rating row
  const RatingRow = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
    <Flex direction="row" gap={4}>
      {[1, 2, 3, 4, 5].map((num) => (
        <Button
          key={num}
          variant={value === num ? 'primary' : 'muted'}
          className="rounded-xl"
          onPress={() => onChange(num)}>
          <Text bold={value === num ? true : false}>{num}</Text>
        </Button>
      ))}
    </Flex>
  );

  // Helper UI: Vibe chips row for a single attendee
  const VibeChips = ({
    current,
    onPick,
  }: {
    current?: VibeSlug;
    onPick: (slug: VibeSlug) => void;
  }) => (
    <Flex gap={4} className="w-full">
      {(
        Object.entries(VIBE_CATEGORIES) as [keyof typeof VIBE_CATEGORIES, readonly VibeSlug[]][]
      ).map(([categoryKey, slugs]) => (
        <Flex key={categoryKey} gap={2}>
          <Text bold size="sm" className="uppercase text-typography-light">
            {formatCategoryLabel(categoryKey)}
          </Text>
          <Flex direction="row" gap={4} wrap="wrap">
            {slugs.map((slug) => (
              <Button
                className="rounded-xl"
                key={slug}
                variant={current === slug ? 'primary' : 'muted'}
                onPress={() => onPick(slug)}>
                <Text bold={current === slug ? true : false}>{formatVibeLabel(slug)}</Text>
              </Button>
            ))}
          </Flex>
        </Flex>
      ))}
    </Flex>
  );

  const onSubmit: SubmitHandler<ReviewFormValues> = async (values) => {
    if (!event?.id) {
      Alert.alert('Error', 'Event details are unavailable. Please try again later.');
      return;
    }

    const hostIds =
      event.event_hosts
        ?.map((host) => {
          const candidate = host as { id?: string; user_id?: string } | null;
          return candidate?.id ?? candidate?.user_id ?? null;
        })
        .filter((id): id is string => !!id) ?? [];

    try {
      // Convert record -> array for RPC
      const attendeeVibesArray =
        Object.entries(values.attendeeVibes)
          .filter(([, vibe]) => !!vibe)
          .map(([user_id, vibe]) => ({ subject_user: user_id, vibe_slug: vibe as VibeSlug })) ?? [];

      await submitReview({
        eventId: event.id,
        venueId: event.place_id ?? null,
        ratings: {
          event: { rating: values.eventRating, comment: values.eventComment || null },
          venue: { rating: values.venueRating, comment: values.venueComment || null },
          host: { rating: values.hostRating, comment: values.hostComment || null },
        },
        attendeeVibes: attendeeVibesArray,
        hostIds,
      });

      Alert.alert('Thanks!', 'Your review has been submitted.');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to submit review.');
    }
  };

  return (
    <View className="h-full bg-background-dark p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Event Review */}
        <Flex gap={8}>
          <Flex gap={2}>
            <Text bold size="lg">
              Event
            </Text>
            <Controller
              control={control}
              name="eventRating"
              render={({ field: { onChange, value } }) => (
                <RatingRow value={value} onChange={onChange} />
              )}
            />
            {errors.eventRating && (
              <Text className="text-error-500">{errors.eventRating.message}</Text>
            )}
            <Controller
              control={control}
              name="eventComment"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="m-2 h-24 rounded-md bg-white px-3"
                  placeholder="Share details about the event..."
                  value={value}
                  onChangeText={onChange}
                  multiline
                />
              )}
            />
          </Flex>

          {/* Venue Review */}
          <Flex gap={2}>
            <Text bold size="lg">
              Venue
            </Text>
            <Controller
              control={control}
              name="venueRating"
              render={({ field: { onChange, value } }) => (
                <RatingRow value={value} onChange={onChange} />
              )}
            />
            {errors.venueRating && (
              <Text className="text-error-500">{errors.venueRating.message}</Text>
            )}
            <Controller
              control={control}
              name="venueComment"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="m-2 h-24 rounded-md bg-white px-3"
                  placeholder="What did you think about the venue?"
                  value={value}
                  onChangeText={onChange}
                  multiline
                />
              )}
            />
          </Flex>

          {/* Host Review */}
          <Flex gap={2}>
            <Text bold size="lg">
              Host
            </Text>
            <Controller
              control={control}
              name="hostRating"
              render={({ field: { onChange, value } }) => (
                <RatingRow value={value} onChange={onChange} />
              )}
            />
            {errors.hostRating && (
              <Text className="text-error-500">{errors.hostRating.message}</Text>
            )}
            <Controller
              control={control}
              name="hostComment"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="m-2 h-24 rounded-md bg-white px-3"
                  placeholder="Feedback for the host?"
                  value={value}
                  onChangeText={onChange}
                  multiline
                />
              )}
            />
          </Flex>

          {/* Attendee Vibe Voting */}
          <Flex gap={4} className="mt-2">
            <Text bold size="xl">
              Attendee Vibes
            </Text>
            {event?.check_ins?.length ? (
              <Flex gap={8}>
                {event.check_ins.map((att, i) => {
                  const imgUri =
                    !eventCheckInUserAvatarLoading && eventCheckInUserAvatar[i]
                      ? eventCheckInUserAvatar[i]
                      : undefined;
                  const fieldName = `attendeeVibes.${att.user_id}` as const;

                  return (
                    <Flex key={att.user_id} gap={4} className="rounded-xl bg-background-900 p-3">
                      <Flex direction="row" align="center" gap={10}>
                        {imgUri ? (
                          <Image
                            alt="attendee picture"
                            source={{ uri: imgUri }}
                            rounded="full"
                            size="xl"
                          />
                        ) : (
                          <Box className="h-28 w-28 rounded-full bg-slate-500" />
                        )}
                        <Text size="lg" bold>
                          {att.first_name + ' ' + att.last_name}
                        </Text>
                      </Flex>

                      <Controller
                        control={control}
                        name={fieldName}
                        render={({ field: { value, onChange } }) => (
                          <VibeChips current={value as VibeSlug | undefined} onPick={onChange} />
                        )}
                      />
                    </Flex>
                  );
                })}
              </Flex>
            ) : (
              <Text>No check-ins to vote on.</Text>
            )}
          </Flex>

          {/* Submit */}
          <Button
            onPress={handleSubmit(onSubmit)}
            className="mb-10 mt-4 h-14 w-full rounded-lg bg-primary-700 "
            disabled={isPending}>
            <Text bold className="text-white">
              {isPending ? 'Submitting…' : 'Submit Review'}
            </Text>
          </Button>
        </Flex>
      </ScrollView>
    </View>
  );
}
