import { useForm, Controller, SubmitHandler, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Flex, Image, Input, InputField, Pressable, Text } from '~/components/ui';
import { Calendar } from 'react-native-calendars';
import { TextInput, Alert, FlatList } from 'react-native';
import { useCallback, useEffect } from 'react';

import { ChevronRight, PlusCircle } from 'lucide-react-native';
import { INTEREST_CATEGORIES } from '~/constants/interests';
import { categoryEmojis, interestEmojis } from '~/utils/const';
import { useEventById, useEventCreateStore, useHosts, useStorageImages } from '~/hooks';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { MultiModal } from '~/components';
import GooglePlacesTextInput from 'react-native-google-places-textinput';
import { eventSchema } from '~/schema/event';
import { combine } from '~/utils/datetime';
import { useRouteStack } from '~/types/navigation.types';
import { PersonCard } from '~/types/event.types';
import dayjs from 'dayjs';

export type location = {
  locationText: string;
  formattedAddress: string;
  provider: string;
  placeId: string;
  long: number;
  lat: number;
};

export type CreateEventFormValues = z.infer<typeof eventSchema>;

export default function CreateEventScreen() {
  const { params } = useRouteStack<'CreateEvent'>();
  const navigation = useNavigation<NavigationProp<'Review Event'>>();
  const { data: hosts, isLoading: loadingHost } = useHosts();

  const { data: event, isLoading: loadingEvent } = useEventById(params?.eventId ?? '');

  const defaultFormValues = {
    title: '',
    hostId: '',
    hostName: '',
    ageLimit: '',
    description: '',
    location: {},
    date: '', // YYYY-MM-DD
    startTime: '',
    endTime: '',
    capacity: '',
    creditCost: '',
    coverImageUri: '',
    interests: [],
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateEventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: defaultFormValues,
  });

  const {
    // title,
    // hostId,
    // hostName,
    // ageLimit,
    // description,
    // date,
    // startTime,
    // endTime,
    // capacity,
    // creditCost,
    selectedInterests,
    coverImageUri,
    originalCoverImageUri,
    setTitle,
    setEventId,
    setHostId,
    setHostName,
    setAgeLimit,
    setDescription,
    setLocation,
    setDate,
    setStartTime,
    setEndTime,
    setCapacity,
    setCreditCost,
    setCoverImageUri,
    setOriginalCoverImageUri,
    setOriginalCoverPath,
    setInterests,
    toggleInterest,
  } = useEventCreateStore();

  const toAgeLabel = (n?: number | null) => (n ? `${n} and over` : '');

  function toTime12(dtISO: string) {
    return dayjs(dtISO).format('h:mm A');
  }
  function toDateStr(dtISO: string) {
    return dayjs(dtISO).format('YYYY-MM-DD');
  }

  const { data: coverImg } = useStorageImages({
    bucket: 'event_cover',
    paths: [event?.cover_img], // stored in users table
  });

  const imageUrl =
    Array.isArray(coverImg) && coverImg[0]
      ? coverImg[0] // never null ✅
      : '';

  const firstHost = event?.event_hosts?.[0];

  useEffect(() => {
    if (!event) return;
    const formVals = {
      eventId: params.eventId,
      title: event?.title ?? '',
      hostId: firstHost?.id ?? '',
      hostName: event?.event_hosts?.length
        ? `${firstHost?.first_name + ' ' + firstHost?.last_name}`.trim()
        : '',
      ageLimit: toAgeLabel(event?.age_limit),
      description: event?.description ?? '',
      location: {
        locationText: event?.location_text ?? '',
        formattedAddress: event?.formatted_address ?? '',
        provider: event?.provider ?? '',
        placeId: event?.place_id ?? '',
        long: event?.longitude ?? undefined,
        lat: event?.latitude ?? undefined,
      },
      date: event?.starts_at ? toDateStr(event?.starts_at) : '',
      startTime: event?.starts_at ? toTime12(event?.starts_at) : '',
      endTime: event?.ends_at ? toTime12(event?.ends_at) : '',
      capacity: String(event?.capacity ?? ''),
      creditCost: String(event?.token_cost ?? ''),
      originalCoverImageUri: imageUrl,

      interests: event?.category ?? [],
    } as const;

    // RHF
    reset(formVals);
    setEventId(formVals.eventId ?? '');
    setTitle(formVals.title);
    setHostId(formVals.hostId);
    setHostName(formVals.hostName);
    setAgeLimit(formVals.ageLimit);
    setDescription(formVals.description);
    setLocation({
      locationText: formVals.location.locationText ?? '',
      formattedAddress: formVals.location.formattedAddress ?? '',
      provider: formVals.location.provider ?? '',
      placeId: formVals.location.placeId ?? '',
      long: formVals.location.long ?? undefined,
      lat: formVals.location.lat ?? undefined,
    });
    setDate(formVals.date);
    setStartTime(event.starts_at ?? '');
    setEndTime(event.ends_at ?? '');
    setCapacity(formVals.capacity);
    setCreditCost(formVals.creditCost);
    setOriginalCoverImageUri(imageUrl);
    setOriginalCoverPath(event?.cover_img ?? '');
    setInterests(formVals.interests);
  }, [event]);

  const handleImagePick = async (useCamera: boolean = false) => {
    try {
      // Request permissions
      const { status } = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please allow access to continue');
        return;
      }

      // Pick image
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
          });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri; // file://...
        setValue('coverImageUri', uri, { shouldValidate: true, shouldDirty: true });
        // and also reflect it in store
        setCoverImageUri(uri);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to pick image');
    } finally {
    }
  };

  const chooseImageSource = () => {
    Alert.alert('Add Photo', 'Choose image source', [
      { text: 'Library', onPress: () => handleImagePick(false) },
      { text: 'Camera', onPress: () => handleImagePick(true) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };
  const onSubmit: SubmitHandler<CreateEventFormValues> = async (values) => {
    console.log(values);
    try {
      // Defensive checks
      if (!values.date || !values.startTime || !values.endTime) {
        console.error('Missing date or time fields');
        return;
      }

      const startAt = combine(values.date, values.startTime);
      const endAt = combine(values.date, values.endTime);

      // Update store safely
      setTitle(values.title?.trim());
      setHostId(values.hostId);
      setHostName(values.hostName?.trim());
      setAgeLimit(values.ageLimit);
      setDescription(values.description?.trim());
      setLocation(values.location);
      setDate(values.date);

      setStartTime(startAt.toISOString());
      setEndTime(endAt.toISOString());

      setCapacity(values.capacity);
      setCreditCost(values.creditCost);
      setCoverImageUri(values.coverImageUri);

      setInterests(
        (values.interests ?? []).filter((i): i is string => typeof i === 'string' && i.length > 0)
      );

      navigation.navigate('Review Event');
    } catch (err) {
      console.error('[onSubmit] failed', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const interestEntries = Object.entries(INTEREST_CATEGORIES);

  useFocusEffect(
    useCallback(() => {
      const sub = watch((vals) => {
        setTitle(vals.title ?? '');
        setDescription(vals.description ?? '');
        setLocation({
          locationText: vals.location?.locationText ?? '',
          formattedAddress: vals.location?.formattedAddress ?? '',
          provider: vals.location?.provider ?? '',
          placeId: vals.location?.placeId ?? '',
          long: vals.location?.long,
          lat: vals.location?.lat,
        });
        setDate(vals.date ?? '');
        setStartTime(vals.startTime ?? '');
        setEndTime(vals.endTime ?? '');
        setCapacity(vals.capacity ?? '');
        setCreditCost(vals.creditCost ?? '');
        setCoverImageUri(vals.coverImageUri ?? '');
        setInterests(
          ((vals.interests ?? []) as (string | undefined)[]).filter(
            (i): i is string => typeof i === 'string'
          )
        );
      });
      return () => sub.unsubscribe(); // unsubscribe on blur
    }, [watch])
  );

  const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY!;

  return (
    <Flex flex className="bg-background-dark p-4">
      <FlatList
        data={interestEntries}
        keyExtractor={([category]) => category}
        // All the UI before Interests
        ListHeaderComponent={
          <Flex gap={8}>
            <Flex align="center">
              <Text className="text-background-700">
                Fill in the details below to create your event.
              </Text>
            </Flex>

            {/* Date */}
            <Flex>
              <Controller
                control={control}
                name="date"
                render={({ field: { value, onChange } }) => (
                  <Calendar
                    style={{
                      borderWidth: 1,
                      borderColor: '#1f2026',
                      height: 350,
                      borderRadius: 10,
                      backgroundColor: '#18191f',
                    }}
                    theme={{
                      backgroundColor: '#18191f',
                      calendarBackground: '#18191f',
                      textSectionTitleColor: '#b6c1cd',
                      monthTextColor: '#e5e7eb',
                      arrowColor: '#e6fff5',
                      dayTextColor: '#e5e7eb',
                      textDisabledColor: '#6b7280',
                      todayTextColor: '#007BFF',
                    }}
                    onDayPress={(day) => onChange(day.dateString)}
                    markingType="custom"
                    markedDates={
                      value
                        ? {
                            [value]: {
                              customStyles: {
                                container: { backgroundColor: '#0ea5e9', borderRadius: 8 },
                                text: { color: '#FFFFFF', fontWeight: '600' },
                              },
                            },
                          }
                        : undefined
                    }
                    minDate={new Date().toISOString().split('T')[0]}
                  />
                )}
              />
              {errors.date && (
                <Text className="pt-1 text-error-500" bold size="xs">
                  {errors.date.message}
                </Text>
              )}
            </Flex>

            {/* Times */}
            <Flex direction="row" className="w-full" justify="space-between" align="center">
              <Controller
                control={control}
                name="startTime"
                render={({ field: { value, onChange } }) => (
                  <Flex>
                    <MultiModal
                      title="Start Time"
                      modalType="time"
                      value={value}
                      onChange={onChange}
                    />
                    {errors.startTime && (
                      <Text className="pt-1 text-error-500" bold size="xs">
                        {errors.startTime.message}
                      </Text>
                    )}
                  </Flex>
                )}
              />
              <Text>To</Text>
              <Controller
                control={control}
                name="endTime"
                render={({ field: { value, onChange } }) => (
                  <Flex>
                    <MultiModal
                      title="End Time"
                      modalType="time"
                      value={value}
                      onChange={onChange}
                    />
                    {errors.endTime && (
                      <Text className="pt-1 text-error-500" bold size="xs">
                        {errors.endTime.message}
                      </Text>
                    )}
                  </Flex>
                )}
              />
            </Flex>

            {/* Cover image */}
            <Flex direction="column" align="center" className=" w-full px-4" gap={6}>
              <Flex direction="column" justify="center" gap={4} className="w-full">
                {originalCoverImageUri || coverImageUri ? (
                  <Pressable onPress={chooseImageSource}>
                    <Flex align="center" gap={2}>
                      <Image
                        source={{ uri: coverImageUri || originalCoverImageUri }}
                        className="h-28 w-full rounded-lg"
                        alt="Profile picture"
                      />
                      <Text size="sm" className="text-gray-500">
                        Change Photo
                      </Text>
                    </Flex>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={chooseImageSource}
                    className="h-28 rounded-lg border border-dashed border-background-800 bg-background-900">
                    <Flex align="center" justify="center" className="h-full" gap={1}>
                      <Text className="text-background-700">Add a cover image</Text>
                      <PlusCircle size={20} color={'#46474c'} />
                    </Flex>
                  </Pressable>
                )}
                {errors.coverImageUri && (
                  <Text className="pt-1 text-error-500" bold size="xs">
                    {errors.coverImageUri.message}
                  </Text>
                )}
              </Flex>
            </Flex>

            {/* Title */}
            <Flex>
              <Text size="sm" bold className="pb-2 text-background-700">
                Title:
              </Text>
              <Controller
                control={control}
                name="title"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input className="h-14" variant="dark">
                    <InputField
                      variant="dark"
                      placeholder="Event Title"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      size="md"
                    />
                  </Input>
                )}
              />
              {errors.title && (
                <Text className="pt-1 text-error-500" bold size="xs">
                  {errors.title.message}
                </Text>
              )}
            </Flex>

            {/* Location (Google Places) */}
            <Flex>
              <Text size="sm" bold className="pb-2 text-background-700">
                Location:
              </Text>
              <Controller
                control={control}
                name="location"
                render={({ field }) => (
                  <Flex className="relative" style={{ zIndex: 1000 }}>
                    <GooglePlacesTextInput
                      fetchDetails={true}
                      apiKey={GOOGLE_PLACES_API_KEY}
                      placeHolderText="Search for a place"
                      scrollEnabled
                      style={{
                        input: {
                          backgroundColor: '#18191f',
                          borderColor: '#18191f',
                          borderRadius: 10,
                          fontSize: 14,
                          color: '#fff',
                        },
                        suggestionsContainer: { backgroundColor: '#18191f' },
                        suggestionText: {
                          main: { fontSize: 16, color: '#fff' },
                          secondary: { fontSize: 14, color: '#fff' },
                        },
                        loadingIndicator: { color: '#999' },
                        placeholder: { color: '#46474c' },
                      }}
                      onPlaceSelect={(p) => {
                        const locationLon = p.details?.location.longitude;
                        const locationLat = p.details?.location.latitude;

                        console.log(locationLat, locationLon);
                        const loc = {
                          locationText: p.structuredFormat.mainText.text,
                          formattedAddress: p.structuredFormat.secondaryText?.text ?? '',
                          long: locationLon,
                          lat: locationLat,
                          provider: 'google',
                          placeId: p?.placeId,
                        };

                        field.onChange(loc);
                      }}
                    />
                  </Flex>
                )}
              />
              {errors.location && (
                <Text className="pt-1 text-error-500" bold size="xs">
                  {errors.location.message}
                </Text>
              )}
            </Flex>

            {/* Age limit */}
            <Flex>
              <Text size="sm" bold className="pb-2 text-background-700">
                Age limit:
              </Text>
              <Controller
                control={control}
                name="ageLimit"
                render={({ field: { value, onChange } }) => {
                  const list = ['18 and over', '21 and over', '25 and over', '30 and over'];
                  const label = value || 'Age Limit';
                  return (
                    <MultiModal
                      data={list}
                      title={label}
                      modalType="age"
                      value={value}
                      onChange={onChange}
                    />
                  );
                }}
              />
              {errors.ageLimit && (
                <Text className="pt-1 text-error-500" bold size="xs">
                  {errors.ageLimit.message}
                </Text>
              )}
            </Flex>

            {/* Capacity */}
            <Flex>
              <Text size="sm" bold className="pb-2 text-background-700">
                Capacity:
              </Text>
              <Controller
                control={control}
                name="capacity"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input className="h-14" variant="dark">
                    <InputField
                      placeholder="Capacity"
                      keyboardType="numeric"
                      value={String(value)}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  </Input>
                )}
              />
              {errors.capacity && (
                <Text className="pt-1 text-error-500" bold size="xs">
                  {errors.capacity.message}
                </Text>
              )}
            </Flex>

            {/* Tokens */}
            <Flex>
              <Text size="sm" bold className="pb-2 text-background-700">
                Tokens:
              </Text>
              <Controller
                control={control}
                name="creditCost"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input className="h-14" variant="dark">
                    <InputField
                      placeholder="Credit Amount"
                      keyboardType="number-pad"
                      value={String(value)}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  </Input>
                )}
              />
              {errors.creditCost && (
                <Text className="pt-1 text-error-500" bold size="xs">
                  {errors.creditCost.message}
                </Text>
              )}
            </Flex>

            {/* Host */}
            <Flex>
              <Text size="sm" bold className="pb-2 text-background-700">
                Host:
              </Text>
              <Controller
                control={control}
                name="hostId"
                render={({ field: { value: hostIdValue, onChange } }) => {
                  const list = hosts ?? [];
                  const display = useWatch({ control, name: 'hostName' }) || 'Select Host';
                  return (
                    <MultiModal
                      data={list}
                      title={display}
                      modalType="host"
                      value={hostIdValue || undefined}
                      onChange={(newId) => {
                        onChange(newId);
                        const r = list.find((h) => h.id === newId);
                        const name = r ? `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() : '';
                        setValue('hostName', name, { shouldValidate: true, shouldDirty: true });
                      }}
                    />
                  );
                }}
              />
              {errors.hostId && (
                <Text className="pt-1 text-error-500" bold size="xs">
                  {errors.hostId.message}
                </Text>
              )}
            </Flex>

            {/* Description */}
            <Flex>
              <Text size="sm" bold className="pb-2 text-background-700">
                Description:
              </Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Description"
                    onBlur={onBlur}
                    multiline
                    className="h-36 rounded-xl bg-background-900 p-4 text-sm text-white"
                  />
                )}
              />
              {errors.description && (
                <Text className="pt-1 text-error-500" bold size="xs">
                  {errors.description.message}
                </Text>
              )}
            </Flex>

            {/* Interests label */}
            <Flex>
              <Text size="sm" bold className="pb-2 text-background-700">
                Interests:
              </Text>
            </Flex>
          </Flex>
        }
        // Render each interest category as a list row
        renderItem={({ item: [category, interests] }) => (
          <Flex direction="column" gap={2} className="mb-6">
            <Text size="lg" bold className="capitalize">
              {categoryEmojis[category as keyof typeof categoryEmojis]} {category}
            </Text>
            <Flex direction="row" gap={2} wrap="wrap">
              {interests.map((interest: string) => {
                const isSelected = selectedInterests?.includes(interest);
                const disabled = !isSelected && (selectedInterests?.length ?? 0) === 5;
                return (
                  <Button
                    key={interest}
                    variant="outline"
                    className={`rounded-xl ${isSelected ? 'bg-white' : ''}`}
                    onPress={() => {
                      const current = selectedInterests ?? [];
                      const next = isSelected
                        ? current.filter((i) => i !== interest)
                        : current.length < 5
                          ? [...current, interest]
                          : current;
                      toggleInterest(interest);
                      setValue('interests', next, { shouldValidate: true, shouldDirty: true });
                    }}
                    disabled={disabled}>
                    <Text className={`${isSelected ? 'text-black' : ''}`}>
                      {interestEmojis[interest]} {interest}
                    </Text>
                  </Button>
                );
              })}
            </Flex>
          </Flex>
        )}
        // Footer with submit button
        ListFooterComponent={
          <Flex>
            {errors.interests && (
              <Text className="pt-1 text-error-500" bold size="xs">
                {errors.interests.message}
              </Text>
            )}
            <Flex direction="row" justify="flex-end" align="center">
              <Flex direction="row" align="center" gap={4}>
                <Button
                  size="lg"
                  className="h-16 w-16 rounded-full"
                  onPress={handleSubmit(onSubmit)}>
                  <ChevronRight size={35} color="white" />
                </Button>
              </Flex>
            </Flex>
          </Flex>
        }
        contentContainerStyle={{ paddingBottom: 24, gap: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={7}
        extraData={{ selectedInterests, errors }} // re-render rows when interests/errors change
      />
    </Flex>
  );
}
