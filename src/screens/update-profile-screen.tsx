import { useForm, Controller } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Flex, InputField, Text, Input, Image, Pressable } from '~/components/ui';
import * as z from 'zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';

import { ArrowLeft, User } from 'lucide-react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import 'react-native-get-random-values';
import { cn } from '~/utils/cn';
import { DatePickerInput } from '~/components';
import { useUpdateProfile, useStorageImages } from '~/hooks';
import { useAuth } from '~/providers/AuthProvider';
import dayjs from 'dayjs';
import { RootStackParamList } from '~/types/navigation.types';

interface FormData {
  firstName: string;
  lastName: string;
  nickName: string;
  gender: string;
  birthDate: string;
}

export function UpdateProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, refreshUser } = useAuth();
  const updateProfile = useUpdateProfile();

  // Get current profile image URL
  const { data: profileImageUrls } = useStorageImages({
    bucket: 'avatars',
    paths: [user?.profile_picture ?? null],
  });
  const currentProfileImageUrl = profileImageUrls?.[0] ?? null;

  // Local state for profile image
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  // helpers
  const nonEmpty = (label: string) =>
    z.string().trim().min(1, `${label} is required`).max(50, `${label} is too long`);

  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/; // letters, accents, spaces, hyphen, apostrophe
  const genderChoices = ['Male', 'Female', 'Non-binary', 'Other'] as const;
  const today = new Date();
  const minBirthDate = new Date(today.getFullYear() - 100, 0, 1);
  const maxBirthDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

  const birthdaySchema = z
    .string()
    .min(10, 'Please enter a complete date')
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be in MM/DD/YYYY format')
    .refine((val) => {
      const [month, day, year] = val.split('/').map(Number);
      const date = new Date(year, month - 1, day);

      if (date.getMonth() + 1 !== month || date.getDate() !== day || date.getFullYear() !== year) {
        return false;
      }

      const today = new Date();
      const minDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      return date <= minDate;
    }, 'You must be at least 18 years old');

  const formSchema = z
    .object({
      firstName: nonEmpty('First name').regex(nameRegex, 'First name contains invalid characters'),
      lastName: nonEmpty('Last name').regex(nameRegex, 'Last name contains invalid characters'),
      nickName: z
        .string()
        .trim()
        .max(30, 'Nickname is too long')
        .optional()
        .or(z.literal('').transform(() => undefined)),
      gender: z
        .string()
        .refine(
          (val) => genderChoices.includes(val as (typeof genderChoices)[number]),
          'Select a gender'
        ),
      birthDate: birthdaySchema,
    })
    .required();

  // Format birth_date from database (ISO or legacy MM/DD/YYYY) to MM/DD/YYYY
  const formatBirthDateForInput = (birthDate?: string | null): string => {
    if (!birthDate) return '';
    const trimmed = birthDate.trim();
    if (!trimmed) return '';

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${month}/${day}/${year}`;
    }

    const parsedIso = dayjs(trimmed);
    if (parsedIso.isValid()) {
      return parsedIso.format('MM/DD/YYYY');
    }

    const fallbackTime = Date.parse(trimmed);
    if (!Number.isNaN(fallbackTime)) {
      return formatBirthDateValue(new Date(fallbackTime));
    }

    return '';
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user?.first_name ?? '',
      lastName: user?.last_name ?? '',
      nickName: '', // Note: nickName is not in the database schema, so we'll leave it empty
      gender: (user?.gender as string) ?? '',
      birthDate: formatBirthDateForInput(user?.birth_date),
    },
  });

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.first_name ?? '',
        lastName: user.last_name ?? '',
        nickName: '',
        gender: (user.gender as string) ?? '',
        birthDate: formatBirthDateForInput(user.birth_date),
      });
    }
  }, [user, reset]);

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
        setProfileImageUri(uri);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to pick image');
    }
  };

  const chooseImageSource = () => {
    Alert.alert('Add Photo', 'Choose image source', [
      { text: 'Library', onPress: () => handleImagePick(false) },
      { text: 'Camera', onPress: () => handleImagePick(true) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  function parseBirthDateValue(input?: string) {
    if (!input) return undefined;
    const [month, day, year] = input.split('/').map(Number);
    if (
      Number.isNaN(month) ||
      Number.isNaN(day) ||
      Number.isNaN(year) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return undefined;
    }
    return new Date(year, month - 1, day);
  }

  function formatBirthDateValue(date: Date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const captureLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'We could not access your location. Enable permissions later in Settings to get nearby events.'
        );
        return { city: user?.city ?? '', state: user?.state ?? '', country: user?.country ?? '' };
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geo] = await Location.reverseGeocodeAsync({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });

      const locationData = {
        city: geo?.city ?? user?.city ?? '',
        state: geo?.region ?? user?.state ?? '',
        country: geo?.country ?? user?.country ?? '',
      };

      return locationData;
    } catch (error) {
      console.warn('Location capture failed', error);
      Alert.alert('Location Error', 'Unable to fetch your location right now.');
      return { city: user?.city ?? '', state: user?.state ?? '', country: user?.country ?? '' };
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (isSubmitting || !user) return;
    setIsSubmitting(true);
    try {
      const locationData = await captureLocation();
      const [month, day, year] = values.birthDate.split('/').map(Number);
      const birthDateObj = dayjs(`${year}-${month}-${day}`);
      if (!birthDateObj.isValid()) {
        Alert.alert('Invalid date', 'Please select a valid birth date.');
        setIsSubmitting(false);
        return;
      }
      const birthDateISO = birthDateObj.format('YYYY-MM-DD');
      const age = dayjs().diff(birthDateObj, 'year');

      updateProfile.mutate(
        {
          userId: user.id,
          firstName: values.firstName,
          lastName: values.lastName,
          gender: values.gender || null,
          city: locationData?.city ?? user.city ?? null,
          state: locationData?.state ?? user.state ?? null,
          country: locationData?.country ?? user.country ?? null,
          birthDate: birthDateISO,
          age,
          profileImageUri: profileImageUri,
        },
        {
          onSuccess: async () => {
            await refreshUser();
            Alert.alert('Success', 'Profile updated successfully', [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]);
          },
          onError: async (err: any) => {
            Alert.alert('Error', err?.message ?? 'An unexpected error occurred. Please try again.');
            console.error('Update profile error:', err);
          },
          onSettled: () => setIsSubmitting(false),
        }
      );
    } catch (error) {
      setIsSubmitting(false);
    }
  });

  const inputClassName =
    'relative rounded-xl border border-background-500 bg-transparent px-2 pt-1 pb-1 data-[focus=true]:border-primary/50 overflow-visible';
  const floatingLabelWrapperClass = '-top-0.5';
  const floatingLabelTextClass = 'pointer-events-none bg-background-dark px-1 text-xs';
  const getLabelClasses = (fieldName: string) =>
    cn(
      floatingLabelTextClass,
      focusedField === fieldName ? 'text-primary-500' : 'text-background-500'
    );
  const inputFieldClassName =
    'text-typography-light placeholder:text-typography-light/60 bg-background-dark text-base placeholder:text-base pb-1';

  // Determine which image to show
  const displayImageUri = profileImageUri || currentProfileImageUrl;

  return (
    <SafeAreaView className="flex-1 bg-background-dark" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <Flex flex={1} justify="space-between" className="px-6 py-4">
          <ScrollView
            contentContainerStyle={{ gap: 24, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Flex gap={6}>
              <Pressable onPress={() => navigation.goBack()} className="mt-2">
                <ArrowLeft size={18} color="#FFFFFF" />
              </Pressable>

              <Flex gap={2}>
                <Text size="4xl" bold className="text-typography-light">
                  Update Profile
                </Text>
                <Text className="text-typography-light">
                  Update your profile information and photo.
                </Text>
              </Flex>

              <Flex align="center" className="w-full" gap={6}>
                {displayImageUri ? (
                  <Pressable
                    onPress={() => {
                      if (profileImageUri) {
                        setProfileImageUri('');
                      } else {
                        chooseImageSource();
                      }
                    }}>
                    <Flex align="center" gap={2}>
                      <Image
                        source={{ uri: displayImageUri }}
                        rounded="full"
                        alt="Profile picture"
                        className="h-24 w-24"
                      />
                      <Text size="sm" className="text-primary-600">
                        {profileImageUri ? 'Remove Photo' : 'Change Photo'}
                      </Text>
                    </Flex>
                  </Pressable>
                ) : (
                  <Pressable onPress={chooseImageSource}>
                    <Flex align="center" gap={2}>
                      <Flex
                        justify="center"
                        className="border-background-primary h-24 w-24 rounded-full border-2 border-dashed bg-background-900">
                        <Flex direction="column" align="center" gap={1}>
                          <User size={24} color="#6B7280" />
                        </Flex>
                      </Flex>
                      <Text size="sm" className="text-primary-600">
                        Upload Photo
                      </Text>
                    </Flex>
                  </Pressable>
                )}
              </Flex>

              <Flex className="w-full" gap={6}>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field }) => (
                    <Flex gap={2}>
                      <Input size="3xl" className={inputClassName}>
                        <Text
                          className={cn(
                            'absolute left-3 top-0 -translate-y-1/2',
                            floatingLabelWrapperClass,
                            getLabelClasses('firstName')
                          )}>
                          First Name
                        </Text>
                        <InputField
                          placeholder="First Name"
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={() => {
                            field.onBlur();
                            setFocusedField((prev) => (prev === 'firstName' ? null : prev));
                          }}
                          onFocus={() => setFocusedField('firstName')}
                          textContentType="givenName"
                          className={inputFieldClassName}
                        />
                      </Input>
                      {errors.firstName && (
                        <Text size="sm" className="text-error-500">
                          {errors.firstName.message}
                        </Text>
                      )}
                    </Flex>
                  )}
                />

                <Controller
                  control={control}
                  name="lastName"
                  render={({ field }) => (
                    <Flex gap={2}>
                      <Input size="3xl" className={inputClassName}>
                        <Text
                          className={cn(
                            'absolute left-3 top-0 -translate-y-1/2',
                            floatingLabelWrapperClass,
                            getLabelClasses('lastName')
                          )}>
                          Last Name
                        </Text>
                        <InputField
                          placeholder="Last Name"
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={() => {
                            field.onBlur();
                            setFocusedField((prev) => (prev === 'lastName' ? null : prev));
                          }}
                          onFocus={() => setFocusedField('lastName')}
                          textContentType="familyName"
                          className={inputFieldClassName}
                        />
                      </Input>
                      {errors.lastName && (
                        <Text size="sm" className="text-error-500">
                          {errors.lastName.message}
                        </Text>
                      )}
                    </Flex>
                  )}
                />

                <Controller
                  control={control}
                  name="nickName"
                  render={({ field }) => (
                    <Flex gap={2}>
                      <Input size="3xl" className={inputClassName}>
                        <Text
                          className={cn(
                            'absolute left-3 top-0 -translate-y-1/2',
                            floatingLabelWrapperClass,
                            getLabelClasses('nickName')
                          )}>
                          Nickname (optional)
                        </Text>
                        <InputField
                          placeholder="Nickname"
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={() => {
                            field.onBlur();
                            setFocusedField((prev) => (prev === 'nickName' ? null : prev));
                          }}
                          onFocus={() => setFocusedField('nickName')}
                          textContentType="nickname"
                          className={inputFieldClassName}
                        />
                      </Input>
                      {errors.nickName && (
                        <Text size="sm" className="text-error-500">
                          {errors.nickName.message}
                        </Text>
                      )}
                    </Flex>
                  )}
                />

                <Controller
                  control={control}
                  name="birthDate"
                  render={({ field }) => (
                    <DatePickerInput
                      label="Birth Date"
                      value={parseBirthDateValue(field.value)}
                      onChange={(date) => field.onChange(formatBirthDateValue(date))}
                      error={errors.birthDate?.message}
                      minimumDate={minBirthDate}
                      maximumDate={maxBirthDate}
                      inputClassName={inputClassName}
                      inputFieldClassName={inputFieldClassName}
                      labelClassName={cn(floatingLabelTextClass, 'text-background-500')}
                      activeLabelClassName="text-primary-500"
                      floatingLabelWrapperClassName={floatingLabelWrapperClass}
                      onFocus={() => setFocusedField('birthDate')}
                      onBlur={() => setFocusedField((prev) => (prev === 'birthDate' ? null : prev))}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <Flex gap={2}>
                      <Text size="sm" bold className="text-typography-light">
                        Gender
                      </Text>
                      <Flex direction="row" wrap="wrap" gap={3}>
                        {genderChoices.map((option) => {
                          const isSelected = field.value === option;
                          return (
                            <Pressable
                              key={option}
                              className={cn(
                                'border-background-primary border-background-primary w-[48%] rounded-xl border bg-background-dark px-4 py-3',
                                isSelected && 'border-primary-500'
                              )}
                              onPress={() => field.onChange(option)}>
                              <Flex direction="row" align="center" justify="space-between">
                                <Text className="text-typography-light">{option}</Text>
                                <Flex
                                  align="center"
                                  justify="center"
                                  className={cn(
                                    'h-5 w-5 rounded-full border-2 border-background-200',
                                    isSelected && 'border-primary-500'
                                  )}>
                                  <Flex
                                    className={cn(
                                      'h-2.5 w-2.5 rounded-full bg-primary-500',
                                      !isSelected && 'bg-transparent'
                                    )}
                                  />
                                </Flex>
                              </Flex>
                            </Pressable>
                          );
                        })}
                      </Flex>
                      {errors.gender && (
                        <Text size="sm" className="text-error-500">
                          {errors.gender.message}
                        </Text>
                      )}
                    </Flex>
                  )}
                />
              </Flex>
            </Flex>
            <Button
              className="h-14 w-full rounded-xl bg-primary-500"
              onPress={onSubmit}
              disabled={isSubmitting}>
              <Text size="lg" weight="600" className="text-white">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Text>
            </Button>
          </ScrollView>
        </Flex>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
