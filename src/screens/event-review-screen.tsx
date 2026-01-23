import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { Box, Button, Flex, Image, Pressable, Text } from '~/components/ui';
import { useEventById, useEventReview, useStorageImages, useSubmitEventReview } from '~/hooks';
import { RootStackParamList, useRouteStack } from '~/types/navigation.types';

import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { VibeSlug } from '~/hooks/useEvents';
import { SafeAreaView } from 'react-native-safe-area-context';

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
const TOTAL_STEPS = 3;

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
type ReviewNav = NativeStackNavigationProp<RootStackParamList>;
type EventReviewContentProps = {
  eventId: string;
  onClose: () => void;
};

const RatingRow = ({ value, onChange }: { value?: number; onChange: (n: number) => void }) => (
  <Flex gap={2}>
    <Flex direction="row" gap={2}>
      {[1, 2, 3, 4, 5].map((num) => {
        const selected = value === num;
        return (
          <Pressable
            key={num}
            onPress={() => onChange(num)}
            accessibilityRole="button"
            className={`h-10 w-10 flex-1 items-center justify-center rounded-full border ${
              selected ? 'border-primary bg-primary' : 'border-white/30 bg-transparent'
            }`}>
            <Text className="text-white" bold={selected}>
              {num}
            </Text>
          </Pressable>
        );
      })}
    </Flex>
    <Flex direction="row" justify="space-between">
      <Text size="xs" className="text-white/70">
        Very bad
      </Text>
      <Text size="xs" className="text-white/70">
        Great
      </Text>
    </Flex>
  </Flex>
);

const ScoreRow = ({ value, onChange }: { value?: number; onChange: (n: number) => void }) => (
  <Flex direction="row" gap={3} wrap="wrap">
    {Array.from({ length: 11 }, (_, i) => i).map((num) => {
      const selected = value === num;
      return (
        <Pressable
          key={num}
          onPress={() => onChange(num)}
          accessibilityRole="button"
          className={`h-10 w-10 items-center justify-center rounded-full border ${
            selected ? 'border-primary bg-primary' : 'border-white/30 bg-transparent'
          }`}>
          <Text className="text-white" bold={selected}>
            {num}
          </Text>
        </Pressable>
      );
    })}
  </Flex>
);

const SingleSelectRow = <T extends string>({
  value,
  onChange,
  options,
}: {
  value?: T;
  onChange: (next: T) => void;
  options: readonly T[];
}) => (
  <Flex direction="row" gap={3}>
    {options.map((option) => {
      const selected = value === option;
      return (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          accessibilityRole="radio"
          accessibilityState={{ selected }}
          className={`h-10 flex-1 items-center justify-center rounded-full border ${
            selected ? 'border-primary bg-primary' : 'border-white/30 bg-transparent'
          }`}>
          <Text className="text-white" bold={selected}>
            {formatTagLabel(option)}
          </Text>
        </Pressable>
      );
    })}
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

export function EventReviewContent({ eventId, onClose }: EventReviewContentProps) {
  const { data: event } = useEventById(eventId);
  const { data: existingReview } = useEventReview(eventId ?? null);
  const hasPrefilled = useRef(false);
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
    trigger,
    watch,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      overallRating: undefined,
      venueRating: undefined,
      organizationRating: undefined,
      hostRating: undefined,
      groupVibeRating: undefined,
      socialExpectation: undefined,
      socialComment: '',
      attendAgain: undefined,
      npsScore: undefined,
      additionalFeedback: '',
      eventVibes: [],
      attendeeVibes: {},
    },
  });

  useEffect(() => {
    hasPrefilled.current = false;
  }, [eventId]);

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

      setIsSubmitted(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to submit review.');
    }
  };

  const handleBackToEvent = () => {
    onClose();
  };

  const handleBack = () => {
    if (step === 1) {
      onClose();
      return;
    }
    setStep((prev) => Math.max(1, prev - 1));
  };

  const requiredValues = watch([
    'overallRating',
    'venueRating',
    'organizationRating',
    'hostRating',
    'groupVibeRating',
    'socialExpectation',
    'attendAgain',
    'npsScore',
  ]);
  const isRequiredComplete = useMemo(
    () => requiredValues.every((value) => value !== undefined && value !== null),
    [requiredValues]
  );

  const handleNext = async () => {
    if (step === 1) {
      const ok = await trigger([
        'overallRating',
        'venueRating',
        'organizationRating',
        'hostRating',
        'groupVibeRating',
        'socialExpectation',
        'attendAgain',
        'npsScore',
      ]);
      if (!ok) return;
    }
    setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
  };

  if (isSubmitted) {
    return (
      <LinearGradient colors={['#007BFF', '#0056b3']} style={{ flex: 1 }}>
        <View className="flex-1 px-6 py-10">
          <View className="absolute inset-0">
            <View className="absolute left-6 top-10 h-8 w-8 rounded-full bg-white/20" />
            <View className="absolute right-10 top-16 h-12 w-12 rounded-full bg-white/15" />
            <View className="absolute left-16 top-40 h-6 w-6 rounded-full bg-white/20" />
            <View className="absolute right-6 top-52 h-16 w-16 rounded-full bg-white/10" />
            <View className="absolute left-10 top-64 h-10 w-10 rounded-full bg-white/15" />
            <View className="absolute right-14 top-80 h-6 w-6 rounded-full bg-white/20" />
          </View>

          <View className="flex-1 items-center justify-center gap-8">
            <View className="h-32 w-32 items-center justify-center rounded-full bg-white/20">
              <View className="h-24 w-24 items-center justify-center rounded-full bg-white">
                <Text className="text-5xl text-primary">✓</Text>
              </View>
            </View>
            <Text className="text-center text-3xl font-semibold text-white">
              Thank you for{'\n'}completing the{'\n'}survey!
            </Text>
          </View>

          <Button onPress={handleBackToEvent} className="h-12 w-full rounded-full bg-white">
            <Text className="text-primary" bold>
              Back to event
            </Text>
          </Button>
        </View>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView className="flex flex-1 bg-background-dark">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
      <Flex className="px-6 pb-2">
          <Flex direction="row" justify="space-between" align="center">
            <View></View>
            <Text className="text-sm font-semibold text-white/70">
              {step}/{TOTAL_STEPS}
            </Text>
          </Flex>
          <Flex className="mt-2 h-2 w-full rounded-full bg-white/10">
            <View
              className=" h-2 rounded-full bg-primary"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </Flex>
        </Flex>
        <Flex gap={8} className="px-5 pb-24 pt-6">
          {step === 1 ? (
            <Flex gap={8}>
              <Flex gap={2}>
                <Text bold size="xl" className="text-white">
                  Event review
                </Text>
                <Text className="text-sm text-white/70">
                  Thanks for completing the survey. Your feedback helps us improve future events.
                </Text>
              </Flex>

              <Flex gap={3}>
                <Text bold className="text-white">
                  1. Overall experience
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
                <Text bold className="text-white">
                  2. Event quality
                </Text>
                <Flex gap={3}>
                  <Text className="text-white/80">Venue</Text>
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
                <Flex gap={3}>
                  <Text className="text-white/80">Organization</Text>
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
                <Flex gap={3}>
                  <Text className="text-white/80">Host</Text>
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
                <Flex gap={3}>
                  <Text className="text-white/80">Group size</Text>
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

              <Flex gap={4}>
                <Text bold className="text-white">
                  3. Social experience
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
                      className="min-h-[96px] rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-white"
                      placeholder="Tell us more (optional)"
                      placeholderTextColor="#A3A3A3"
                      value={value}
                      onChangeText={onChange}
                      multiline
                      style={{ textAlignVertical: 'top' }}
                    />
                  )}
                />
              </Flex>

              <Flex gap={4}>
                <Text bold className="text-white">
                  4. Would you attend again?
                </Text>
                <Controller
                  control={control}
                  name="attendAgain"
                  render={({ field: { onChange, value } }) => (
                    <SingleSelectRow
                      value={value}
                      onChange={onChange}
                      options={ATTEND_AGAIN_OPTIONS}
                    />
                  )}
                />
                {errors.attendAgain && (
                  <Text className="text-error-500">{errors.attendAgain.message}</Text>
                )}
              </Flex>

              <Flex gap={4}>
                <Text bold className="text-white">
                  5. Recommend to others?
                </Text>
                <Controller
                  control={control}
                  name="npsScore"
                  render={({ field: { onChange, value } }) => (
                    <ScoreRow value={value} onChange={onChange} />
                  )}
                />
                {errors.npsScore && (
                  <Text className="text-error-500">{errors.npsScore.message}</Text>
                )}
              </Flex>

              <Flex gap={4}>
                <Text bold className="text-white">
                  6. Additional feedback
                </Text>
                <Controller
                  control={control}
                  name="additionalFeedback"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="min-h-[96px] rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-white"
                      placeholder="Anything else you want to share?"
                      placeholderTextColor="#A3A3A3"
                      value={value}
                      onChangeText={onChange}
                      multiline
                      style={{ textAlignVertical: 'top' }}
                    />
                  )}
                />
              </Flex>
            </Flex>
          ) : null}

          {step === 2 ? (
            <Flex gap={8}>
              <Text bold className="text-white">
              How would you describe the overall vibe of this event?
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
          ) : null}

          {step === 3 ? (
            <Flex gap={8}>
              <Text bold size="xl" className="text-white">
                Attendee vibes
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
                      <Flex
                        key={att.user_id}
                        gap={4}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <Flex direction="row" align="center" gap={10}>
                          {imgUri ? (
                            <Image
                              alt="attendee picture"
                              source={{ uri: imgUri }}
                              rounded="full"
                              size="xl"
                            />
                          ) : (
                            <Box className="h-24 w-24 rounded-full bg-gray-200" />
                          )}
                          <Text size="lg" bold className="text-white">
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
                <Text className="text-white/70">No check-ins to vote on.</Text>
              )}
            </Flex>
          ) : null}
        </Flex>
      </ScrollView>

        <View className="px-5 pb-6 pt-3">
          <Flex direction="row" gap={3}>
          <Button
            onPress={handleBack}
            className="h-12 flex-1 rounded-full bg-white/10"
            disabled={step === 1}>
            <Text className="text-white" bold>
              Back
            </Text>
          </Button>
          <Button
            onPress={step < TOTAL_STEPS ? handleNext : handleSubmit(onSubmit)}
            className="h-12 flex-1 rounded-full bg-primary"
            disabled={isPending || (step < TOTAL_STEPS ? !isRequiredComplete : !isRequiredComplete)}>
            <Text className="text-white" bold>
              {step < TOTAL_STEPS ? 'Next' : isPending ? 'Submitting...' : 'Finish'}
            </Text>
          </Button>
          </Flex>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function EventReviewScreen() {
  const navigation = useNavigation<ReviewNav>();
  const { params } = useRouteStack<'EventReview'>();
  const eventId = params.eventId;

  const handleClose = () => {
    if (!eventId) {
      navigation.goBack();
      return;
    }
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'ViewEvent',
            params: { eventId, fromReview: true, source: params.source },
          } as never,
        ],
      })
    );
  };

  if (!eventId) {
    return (
      <Flex flex className="bg-background-dark">
        <Flex align="center" className="m-auto" gap={4}>
          <Text size="xl">Event not found.</Text>
          <Button onPress={handleClose}>
            <Text bold>Go Back</Text>
          </Button>
        </Flex>
      </Flex>
    );
  }

  return <EventReviewContent eventId={eventId} onClose={handleClose} />;
}
