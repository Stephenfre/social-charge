import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Flex, Image, Input, InputField, Pressable, Text } from '~/components/ui';
import { Calendar } from 'react-native-calendars';
import { ScrollView, TextInput, Alert } from 'react-native';
import { useEffect, useState } from 'react';

import { ChevronDown, ChevronRight, PlusCircle } from 'lucide-react-native';
import { INTEREST_CATEGORIES } from '~/constants/interests';
import { categoryEmojis, interestEmojis } from '~/utils/const';
import { useEventCreateStore, useHosts } from '~/hooks';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { MultiModal, TimePickerModal } from '~/components';

const toMinutes12 = (t: string) => {
  // "h:mm AM/PM"
  const m = t.match(/^(\d{1,2}):([0-5]\d)\s?(AM|PM)$/i);
  if (!m) return NaN;
  let hh = Number(m[1]);
  const mm = Number(m[2]);
  const mer = m[3].toUpperCase();
  if (hh === 12) hh = 0; // 12:xx AM -> 00:xx
  if (mer === 'PM') hh += 12; // PM add 12
  return hh * 60 + mm;
};

function combine(dateISO: string, time12: string) {
  // dateISO: "YYYY-MM-DD", time12: "h:mm AM/PM"
  const parts = dateISO.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new RangeError(`Invalid date string: ${dateISO}`);
  }
  const [y, mo, d] = parts;

  const total = toMinutes12(time12);
  if (Number.isNaN(total)) {
    throw new RangeError(`Invalid time string: ${time12}`);
  }
  const h = Math.floor(total / 60);
  const m = total % 60;

  // Construct safely
  const dt = new Date(y, mo - 1, d, h, m, 0, 0);
  if (Number.isNaN(dt.getTime())) {
    throw new RangeError(`Invalid Date from (${dateISO}, ${time12})`);
  }
  return dt;
}

const eventSchema = z
  .object({
    name: z.string().min(1, 'Event name is required'),
    host: z.string().min(1, 'Host is required'),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(1000, 'Description too long (max 1000 characters)'),
    location: z.string().min(1, 'Location is required'),
    date: z.string().min(1, 'Date is required'),
    startTime: z.string().min(1, 'Start time is required'), // "h:mm AM/PM"
    endTime: z.string().min(1, 'End time is required'), // "h:mm AM/PM"
    capacity: z.string().min(1, 'Capacity is required'),
    creditCost: z.string().min(1, 'Credit is required'),
    coverImageUri: z.string().min(1, 'Image required'),
    interests: z
      .array(z.string())
      .min(1, 'Select at least one interest')
      .max(5, 'You can choose up to 5'),
  })
  .superRefine((val, ctx) => {
    const s = toMinutes12(val.startTime);
    const e = toMinutes12(val.endTime);
    if (Number.isNaN(s)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid start time',
        path: ['startTime'],
      });
    }
    if (Number.isNaN(e)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid end time', path: ['endTime'] });
    }
    if (!Number.isNaN(s) && !Number.isNaN(e) && e <= s) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End time must be after start time',
        path: ['endTime'],
      });
    }
  });

export type CreateEventFormValues = z.infer<typeof eventSchema>;

export default function CreateEventScreen() {
  const navigation = useNavigation<NavigationProp<'Review Event'>>();
  const [showActionsheet, setShowActionsheet] = useState(false);

  const { data: hosts, isLoading: loadingHost } = useHosts();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateEventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      host: '',
      description: '',
      location: '',
      date: '', // YYYY-MM-DD
      startTime: '',
      endTime: '',
      capacity: '',
      creditCost: '',
      coverImageUri: '',
      interests: [],
    },
  });

  const {
    name,
    host,
    description,
    location,
    date,
    startTime,
    endTime,
    capacity,
    creditCost,
    selectedInterests,
    coverImageUri,
    setField,
    setName,
    setHost,
    setDescription,
    setLocation,
    setDate,
    setStartTime,
    setEndTime,
    setCapacity,
    setCreditCost,
    setCoverImageUri,
    setInterests,
    toggleInterest,
  } = useEventCreateStore();

  // (1) Hydrate RHF defaults from store once
  useEffect(() => {
    reset({
      name,
      host,
      description,
      location,
      date,
      startTime,
      endTime,
      capacity: capacity,
      creditCost: creditCost,
      coverImageUri,
      interests: selectedInterests ?? [],
    });
  }, []);

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
        const uri = result.assets[0].uri;
        setField('coverImageUri', uri);
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
    console.log('here');
    try {
      console.log('[onSubmit] received values', values);

      // Defensive checks
      if (!values.date || !values.startTime || !values.endTime) {
        console.error('Missing date or time fields');
        return;
      }

      const startAt = combine(values.date, values.startTime);
      const endAt = combine(values.date, values.endTime);

      // Update store safely
      setName(values.name?.trim() ?? '');
      setHost(values.host?.trim() ?? '');
      setDescription(values.description?.trim() ?? '');
      setLocation(values.location?.trim() ?? '');
      setDate(values.date);

      setStartTime(startAt.toISOString());
      setEndTime(endAt.toISOString());

      setCapacity(values.capacity ?? '');
      setCreditCost(values.creditCost ?? '');
      setCoverImageUri(values.coverImageUri ?? '');

      setInterests(
        (values.interests ?? []).filter((i): i is string => typeof i === 'string' && i.length > 0)
      );

      console.log('[onSubmit] navigating to ReviewCreateEvent');
      navigation.navigate('Review Event');
    } catch (err) {
      console.error('[onSubmit] failed', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  useEffect(() => {
    const sub = watch((vals) => {
      setName(vals.name ?? '');
      setDescription(vals.description ?? '');
      setLocation(vals.location ?? '');
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
    return () => sub.unsubscribe();
  }, [watch]);

  return (
    <Flex flex className="bg-background-dark p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Flex gap={8}>
          <Flex align="center">
            {/* <Text bold size="2xl">
              Create New Event
            </Text> */}
            <Text className="text-background-700">
              Fill in the details below to create your event.
            </Text>
          </Flex>
          <Flex>
            <Controller
              control={control}
              name="date"
              render={({ field: { value, onChange } }) => (
                <Calendar
                  style={{
                    borderWidth: 1,
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
                    selectedDayBackgroundColor: '#0ea5e9',
                    selectedDayTextColor: '#FFFFFF',
                  }}
                  onDayPress={(day) => onChange(day.dateString)} // <-- set form string 'YYYY-MM-DD'
                  markedDates={
                    value ? { [value]: { selected: true, disableTouchEvent: true } } : undefined
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

          <Flex direction="row" className="w-full" justify="space-between" align="center">
            <Controller
              control={control}
              name="startTime" // string 'HH:mm' in your schema
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <>
                  <MultiModal
                    title="Start Time"
                    modalType="time"
                    value={value}
                    onChange={onChange}
                  />
                  {error && (
                    <Text className="pt-1 text-error-500" bold size="xs">
                      {error.message}
                    </Text>
                  )}
                </>
              )}
            />

            <Text>To</Text>

            <Controller
              control={control}
              name="endTime"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <>
                  <MultiModal title="End Time" modalType="time" value={value} onChange={onChange} />
                  {error && (
                    <Text className="pt-1 text-error-500" bold size="xs">
                      {error.message}
                    </Text>
                  )}
                </>
              )}
            />
          </Flex>

          <Flex direction="column" align="center" className=" w-full px-4" gap={6}>
            {/* Profile pic upload */}
            <Flex direction="column" justify="center" gap={4} className="w-full">
              {coverImageUri ? (
                <Pressable onPress={chooseImageSource}>
                  <Flex align="center" gap={2}>
                    <Image
                      source={{ uri: coverImageUri }}
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
            </Flex>
          </Flex>
          <Flex>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input className="h-14" variant="dark">
                  <InputField
                    variant="dark"
                    placeholder="Event Name"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    size="md"
                  />
                </Input>
              )}
            />
            {errors.name && (
              <Text className="pt-1 text-error-500" bold size="xs">
                {errors.name.message}
              </Text>
            )}
          </Flex>

          <Flex>
            <Controller
              control={control}
              name="location"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input className="h-14" variant="dark">
                  <InputField
                    placeholder="Address"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                  />
                </Input>
              )}
            />
            {errors.location && (
              <Text className="pt-1 text-error-500" bold size="xs">
                {errors.location.message}
              </Text>
            )}
          </Flex>
          <Flex>
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
                    onChangeText={(t) => onChange(t)}
                  />
                </Input>
              )}
            />
            {errors.capacity && (
              <Text className="pt-1 text-error-500" bold size="xs">
                errors.capacity.message
              </Text>
            )}
          </Flex>
          <Flex>
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
                    onChangeText={(t) => onChange(t)}
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

          <Controller
            control={control}
            name="host" // this stores the host id
            render={({ field: { value, onChange } }) => {
              // value is the host id string (or undefined)
              const list = hosts ?? [];
              const user = list.find((h) => h.id === value);
              const display = user
                ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
                : 'Select Host';

              return (
                <MultiModal
                  data={list}
                  title={display} // show the name in the trigger
                  modalType="select"
                  value={value ?? undefined} // keep sending the id to the selector
                  onChange={onChange} // selector returns id -> stored in form
                />
              );
            }}
          />

          <Flex>
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

          {Object.entries(INTEREST_CATEGORIES).map(([category, interests]) => (
            <Flex key={category} direction="column" gap={2}>
              <Text size="lg" bold className="capitalize">
                {categoryEmojis[category as keyof typeof categoryEmojis]} {category}
              </Text>
              <Flex direction="row" gap={2} wrap="wrap">
                {interests.map((interest: string) => {
                  const isSelected = selectedInterests?.includes(interest);
                  const disabled = !isSelected && selectedInterests?.length === 5;

                  return (
                    <Button
                      key={interest}
                      variant="outline"
                      className={`rounded-xl ${isSelected && 'bg-white'}`}
                      onPress={() => {
                        const current = selectedInterests ?? [];
                        const next = isSelected
                          ? current.filter((i) => i !== interest)
                          : current.length < 5
                            ? [...current, interest]
                            : current;

                        toggleInterest(interest); // update store
                        setValue('interests', next, { shouldValidate: true, shouldDirty: true }); // update RHF
                      }}
                      disabled={disabled}>
                      <Text className={`${isSelected && 'text-black'}`}>
                        {interestEmojis[interest]} {interest}
                      </Text>
                    </Button>
                  );
                })}
              </Flex>
            </Flex>
          ))}

          <Flex direction="row" justify="flex-end" align="center">
            <Flex direction="row" align="center" gap={4}>
              <Button
                size="lg"
                className={'h-16 w-16 rounded-full'}
                onPress={handleSubmit(onSubmit)}>
                <ChevronRight size={35} color="white" />
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </ScrollView>
    </Flex>
  );
}
