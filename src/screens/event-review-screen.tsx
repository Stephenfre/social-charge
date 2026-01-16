import { useEffect, useRef } from 'react';
import { Alert, ScrollView, TextInput, View } from 'react-native';
import { Box, Button, Flex, Image, Text } from '~/components/ui';
import { useEventById, useEventReview, useStorageImages, useSubmitEventReview } from '~/hooks';
import { useRouteStack } from '~/types/navigation.types';

import { Controller, SubmitHandler, useForm } from 'react-hook-form';
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

const SOCIAL_EXPECTATION_OPTIONS = ['exceeded', 'met', 'below'] as const;
type SocialExpectation = (typeof SOCIAL_EXPECTATION_OPTIONS)[number];

const ATTEND_AGAIN_OPTIONS = ['charged_up', 'sparked', 'drained'] as const;
type AttendAgainFeeling = (typeof ATTEND_AGAIN_OPTIONS)[number];

const formatVibeLabel = (slug: VibeSlug) => {
  if (slug === 'mvp') return 'MVP';
  return slug
    .split(/[-_]/g)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatTagLabel = (value: string) =>
  value
    .split(/[-_]/g)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatCategoryLabel = (key: keyof typeof VIBE_CATEGORIES) =>
  key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const VIBE_ENUM_VALUES = Object.values(VIBE_CATEGORIES).flat() as VibeSlug[];
const VIBE_ENUM_TUPLE = VIBE_ENUM_VALUES as [VibeSlug, ...VibeSlug[]];
const SOCIAL_EXPECTATION_TUPLE = SOCIAL_EXPECTATION_OPTIONS as unknown as [
  SocialExpectation,
  ...SocialExpectation[],
];
const ATTEND_AGAIN_TUPLE = ATTEND_AGAIN_OPTIONS as unknown as [
  AttendAgainFeeling,
  ...AttendAgainFeeling[],
];

// --- Zod Schema ---
const reviewSchema = z.object({
  overallRating: z.number().min(1, 'Please rate the overall experience').max(5),
  venueRating: z.number().min(1, 'Please rate the venue').max(5),
  organizationRating: z.number().min(1, 'Please rate the organization').max(5),
  hostRating: z.number().min(1, 'Please rate the host').max(5),
  groupVibeRating: z.number().min(1, 'Please rate the group vibe').max(5),
  socialExpectation: z.enum(SOCIAL_EXPECTATION_TUPLE, {
    message: 'Select a social expectation',
  }),
  socialComment: z.string().optional(),
  attendAgain: z.enum(ATTEND_AGAIN_TUPLE, {
    message: 'Select how you felt after',
  }),
  npsScore: z.number().min(0, 'Select a score').max(10),
  additionalFeedback: z.string().optional(),
  eventVibes: z.array(z.enum(VIBE_ENUM_TUPLE)).optional(),
  attendeeVibes: z.record(z.string(), z.enum(VIBE_ENUM_TUPLE).optional()),
});
type ReviewFormValues = z.infer<typeof reviewSchema>;

const RatingRow = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
  <Flex direction="row" gap={4} wrap="wrap">
    {[1, 2, 3, 4, 5].map((num) => (
      <Button
        key={num}
        variant={value === num ? 'primary' : 'muted'}
        className="rounded-xl"
        onPress={() => onChange(num)}>
        <Text bold={value === num}>{num}</Text>
      </Button>
    ))}
  </Flex>
);

const ScoreRow = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
  <Flex direction="row" gap={4} wrap="wrap">
    {Array.from({ length: 11 }, (_, i) => i).map((num) => (
      <Button
        key={num}
        variant={value === num ? 'primary' : 'muted'}
        className="rounded-xl"
        onPress={() => onChange(num)}>
        <Text bold={value === num}>{num}</Text>
      </Button>
    ))}
  </Flex>
);

const SingleSelectRow = <T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: readonly T[];
}) => (
  <Flex direction="row" gap={4} wrap="wrap">
    {options.map((option) => (
      <Button
        key={option}
        variant={value === option ? 'primary' : 'muted'}
        className="rounded-xl"
        onPress={() => onChange(option)}>
        <Text bold={value === option}>{formatTagLabel(option)}</Text>
      </Button>
    ))}
  </Flex>
);

const MultiSelectVibes = ({
  selected,
  onToggle,
}: {
  selected: VibeSlug[];
  onToggle: (tag: VibeSlug) => void;
}) => (
  <Flex gap={4} className="w-full">
    {(Object.entries(VIBE_CATEGORIES) as [keyof typeof VIBE_CATEGORIES, readonly VibeSlug[]][]).map(
      ([categoryKey, slugs]) => (
        <Flex key={categoryKey} gap={2}>
          <Text bold size="sm" className="uppercase text-typography-light">
            {formatCategoryLabel(categoryKey)}
          </Text>
          <Flex direction="row" gap={4} wrap="wrap">
            {slugs.map((slug) => {
              const isActive = selected.includes(slug);
              return (
                <Button
                  className="rounded-xl"
                  key={slug}
                  variant={isActive ? 'primary' : 'muted'}
                  onPress={() => onToggle(slug)}>
                  <Text bold={isActive}>{formatVibeLabel(slug)}</Text>
                </Button>
              );
            })}
          </Flex>
        </Flex>
      )
    )}
  </Flex>
);

const VibeChips = ({
  current,
  onPick,
}: {
  current?: VibeSlug;
  onPick: (slug: VibeSlug) => void;
}) => (
  <Flex gap={4} className="w-full">
    {(Object.entries(VIBE_CATEGORIES) as [keyof typeof VIBE_CATEGORIES, readonly VibeSlug[]][]).map(
      ([categoryKey, slugs]) => (
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
                <Text bold={current === slug}>{formatVibeLabel(slug)}</Text>
              </Button>
            ))}
          </Flex>
        </Flex>
      )
    )}
  </Flex>
);

export function EventReviewScreen() {
  const { params } = useRouteStack<'EventReview'>();
  const { data: event } = useEventById(params.eventId!);
  const { data: existingReview } = useEventReview(params.eventId ?? null);
  const hasPrefilled = useRef(false);

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
    reset,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      overallRating: 3,
      venueRating: 3,
      organizationRating: 3,
      hostRating: 3,
      groupVibeRating: 3,
      socialExpectation: 'met',
      socialComment: '',
      attendAgain: 'sparked',
      npsScore: 7,
      additionalFeedback: '',
      eventVibes: [],
      attendeeVibes: {},
    },
  });

  useEffect(() => {
    hasPrefilled.current = false;
  }, [params.eventId]);

  useEffect(() => {
    if (!existingReview || hasPrefilled.current) return;
    hasPrefilled.current = true;

    const rawAttendeeVibes = existingReview.attendee_vibes ?? null;
    const attendeeVibes: Record<string, VibeSlug | undefined> = {};
    if (Array.isArray(rawAttendeeVibes)) {
      rawAttendeeVibes.forEach((entry) => {
        if (entry?.subject_user && entry?.vibe_slug) {
          attendeeVibes[entry.subject_user] = entry.vibe_slug;
        }
      });
    } else if (rawAttendeeVibes && typeof rawAttendeeVibes === 'object') {
      Object.entries(rawAttendeeVibes).forEach(([userId, vibe]) => {
        if (typeof vibe === 'string') {
          attendeeVibes[userId] = vibe as VibeSlug;
        }
      });
    }

    const eventVibes = Array.isArray(existingReview.event_vibes)
      ? (existingReview.event_vibes.filter((vibe): vibe is VibeSlug => typeof vibe === 'string') ??
          [])
      : [];

    reset({
      overallRating: existingReview.overall_rating ?? existingReview.rating ?? 3,
      venueRating: existingReview.venue_rating ?? 3,
      organizationRating: existingReview.organization_rating ?? 3,
      hostRating: existingReview.host_rating ?? 3,
      groupVibeRating: existingReview.group_vibe_rating ?? 3,
      socialExpectation: existingReview.social_expectation ?? 'met',
      socialComment: existingReview.social_comment ?? '',
      attendAgain: existingReview.attend_again ?? 'sparked',
      npsScore: existingReview.nps_score ?? 7,
      additionalFeedback:
        existingReview.additional_feedback ?? existingReview.event_comment ?? existingReview.comment ?? '',
      eventVibes,
      attendeeVibes,
    });
  }, [existingReview, reset]);

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
        venueDetails: event.place_id
          ? {
              name: event.location_text ?? event.formatted_address ?? 'Venue',
              formattedAddress: event.formatted_address ?? event.location_text ?? 'Venue',
              lat: event.latitude ?? null,
              lon: event.longitude ?? null,
              provider: event.provider ?? null,
            }
          : undefined,
        overallRating: values.overallRating,
        venueRating: values.venueRating,
        organizationRating: values.organizationRating,
        hostRating: values.hostRating,
        groupVibeRating: values.groupVibeRating,
        socialExpectation: values.socialExpectation,
        socialComment: values.socialComment || null,
        attendAgain: values.attendAgain,
        npsScore: values.npsScore,
        eventVibes: values.eventVibes ?? [],
        additionalFeedback: values.additionalFeedback || null,
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
        <Flex gap={8}>
          <Flex gap={2}>
            <Text bold size="lg">
              Overall Experience
            </Text>
            <Controller
              control={control}
              name="overallRating"
              render={({ field: { onChange, value } }) => (
                <RatingRow value={value} onChange={onChange} />
              )}
            />
            {errors.overallRating && (
              <Text className="text-error-500">{errors.overallRating.message}</Text>
            )}
          </Flex>

          <Flex gap={4}>
            <Text bold size="lg">
              Event Quality
            </Text>
            <Flex gap={2}>
              <Text bold>Venue</Text>
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
            </Flex>
            <Flex gap={2}>
              <Text bold>Organization</Text>
              <Controller
                control={control}
                name="organizationRating"
                render={({ field: { onChange, value } }) => (
                  <RatingRow value={value} onChange={onChange} />
                )}
              />
              {errors.organizationRating && (
                <Text className="text-error-500">{errors.organizationRating.message}</Text>
              )}
            </Flex>
            <Flex gap={2}>
              <Text bold>Host</Text>
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
            </Flex>
            <Flex gap={2}>
              <Text bold>Group Size</Text>
              <Controller
                control={control}
                name="groupVibeRating"
                render={({ field: { onChange, value } }) => (
                  <RatingRow value={value} onChange={onChange} />
                )}
              />
              {errors.groupVibeRating && (
                <Text className="text-error-500">{errors.groupVibeRating.message}</Text>
              )}
            </Flex>
          </Flex>

          <Flex gap={2}>
            <Text bold size="lg">
              Social Experience
            </Text>
            <Controller
              control={control}
              name="socialExpectation"
              render={({ field: { onChange, value } }) => (
                <SingleSelectRow
                  value={value}
                  onChange={onChange}
                  options={SOCIAL_EXPECTATION_OPTIONS}
                />
              )}
            />
            {errors.socialExpectation && (
              <Text className="text-error-500">{errors.socialExpectation.message}</Text>
            )}
            <Controller
              control={control}
              name="socialComment"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="m-2 h-24 rounded-md bg-white px-3"
                  placeholder="Tell us more (optional)"
                  value={value}
                  onChangeText={onChange}
                  multiline
                />
              )}
            />
          </Flex>

          <Flex gap={2}>
            <Text bold size="lg">
              Would You Attend Again?
            </Text>
            <Controller
              control={control}
              name="attendAgain"
              render={({ field: { onChange, value } }) => (
                <SingleSelectRow value={value} onChange={onChange} options={ATTEND_AGAIN_OPTIONS} />
              )}
            />
            {errors.attendAgain && (
              <Text className="text-error-500">{errors.attendAgain.message}</Text>
            )}
          </Flex>

          <Flex gap={2}>
            <Text bold size="lg">
              Recommend to Others?
            </Text>
            <Controller
              control={control}
              name="npsScore"
              render={({ field: { onChange, value } }) => (
                <ScoreRow value={value} onChange={onChange} />
              )}
            />
            {errors.npsScore && <Text className="text-error-500">{errors.npsScore.message}</Text>}
          </Flex>

          <Flex gap={2}>
            <Text bold size="lg">
              Additional Feedback
            </Text>
            <Controller
              control={control}
              name="additionalFeedback"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="m-2 h-24 rounded-md bg-white px-3"
                  placeholder="Anything else you want to share?"
                  value={value}
                  onChangeText={onChange}
                  multiline
                />
              )}
            />
          </Flex>

          <Flex gap={2}>
            <Text bold size="lg">
              Event Vibes
            </Text>
            <Controller
              control={control}
              name="eventVibes"
              render={({ field: { onChange, value } }) => (
                <MultiSelectVibes
                  selected={value ?? []}
                  onToggle={(tag) => {
                    const next = value?.includes(tag)
                      ? value.filter((item) => item !== tag)
                      : [...(value ?? []), tag];
                    onChange(next);
                  }}
                />
              )}
            />
          </Flex>

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
