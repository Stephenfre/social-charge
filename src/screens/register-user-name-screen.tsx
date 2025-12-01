import { useForm, Controller } from 'react-hook-form';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Flex, InputField, Text, Input, Image, Pressable } from '~/components/ui';
import * as z from 'zod';
import { useSignupWizard } from '~/hooks/useSignupWizard';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';

import { ArrowLeft, User } from 'lucide-react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values';
import { cn } from '~/utils/cn';
import { DatePickerInput } from '~/components';

interface FormData {
  firstName: string;
  lastName: string;
  nickName: string;
  gender: string;
  birthDate: string;
}

export function RegisterUserNameScreen() {
  const navigation = useNavigation<NavigationProp<'RegisterUserName'>>();
  const { firstName, lastName, nickName, profileImageUri, gender, birthDate, setField } =
    useSignupWizard();

  // helpers
  const nonEmpty = (label: string) =>
    z.string().trim().min(1, `${label} is required`).max(50, `${label} is too long`);

  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/; // letters, accents, spaces, hyphen, apostrophe
  const genderChoices = ['Female', 'Male', 'Non-binary', 'Other'] as const;
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

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName,
      lastName,
      nickName: nickName ?? '',
      gender: gender ?? '',
      birthDate,
    },
  });

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
        setField('profileImageUri', uri);
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

  const parseBirthDateValue = (input?: string) => {
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
  };

  const formatBirthDateValue = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const onSubmit = handleSubmit(({ firstName, lastName, nickName, gender, birthDate }) => {
    setField('firstName', firstName);
    setField('lastName', lastName);
    setField('nickName', nickName);
    setField('gender', gender);
    setField('birthDate', birthDate);
    navigation.navigate('RegisterUserLocation');
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const inputClassName =
    'relative rounded-xl border border-background-500 bg-transparent px-2 pt-1 pb-1 data-[focus=true]:border-secondary/50 overflow-visible';
  const floatingLabelWrapperClass = '-top-0.5';
  const floatingLabelTextClass = 'pointer-events-none bg-background-dark px-1 text-xs';
  const getLabelClasses = (fieldName: string) =>
    cn(
      floatingLabelTextClass,
      focusedField === fieldName ? 'text-secondary-500' : 'text-background-500'
    );
  const inputFieldClassName =
    'text-typography-light placeholder:text-typography-light/60 bg-background-dark text-base placeholder:text-base pb-1';

  return (
    <SafeAreaView className="flex-1 bg-background-dark" edges={['top', 'bottom']}>
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
                  Tell us about you
                </Text>
                <Text className="text-typography-light">
                  Add a photo and a few details so friends can find you.
                </Text>
              </Flex>

              <Flex align="center" className="w-full" gap={6}>
                {profileImageUri ? (
                  <Pressable onPress={() => setField('profileImageUri', '')}>
                    <Flex align="center" gap={2}>
                      <Image
                        source={{ uri: profileImageUri }}
                        rounded="full"
                        alt="Profile picture"
                        className="h-24 w-24"
                      />
                      <Text size="sm" className="text-secondary-600">
                        Remove Photo
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
                      <Text size="sm" className="text-secondary-600">
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
                      <Input size="xl" className={inputClassName}>
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
                      <Input size="xl" className={inputClassName}>
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
                      <Input size="xl" className={inputClassName}>
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
                      activeLabelClassName="text-secondary-500"
                      floatingLabelWrapperClassName={floatingLabelWrapperClass}
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
                                isSelected && 'border-secondary-500'
                              )}
                              onPress={() => field.onChange(option)}>
                              <Flex direction="row" align="center" justify="space-between">
                                <Text className="text-typography-light">{option}</Text>
                                <Flex
                                  align="center"
                                  justify="center"
                                  className={cn(
                                    'h-5 w-5 rounded-full border-2 border-background-200',
                                    isSelected && 'border-secondary-500'
                                  )}>
                                  <Flex
                                    className={cn(
                                      'h-2.5 w-2.5 rounded-full bg-secondary-500',
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
          </ScrollView>
          <Button className="h-14 w-full rounded-xl bg-secondary-500" onPress={onSubmit}>
            <Text size="lg" weight="600" className="text-white">
              Continue
            </Text>
          </Button>
        </Flex>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
