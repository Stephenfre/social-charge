import React from 'react';

import { useForm, Controller } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Box, ButtonText, Flex, InputField, Text, Input } from '../ui';
import { useSignupWizard } from '~/hooks/useSignupWizard';

interface FormData {
  firstName: string;
  lastName: string;
  nickName: string;
  birthDate: string;
  phoneNumber: string;
  location: string;
}

interface RegisterInfoFormProps {
  onNavigate?: () => void;
}

export function RegisterInfoForm({ onNavigate }: RegisterInfoFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  // TODO: ADD ZOD VALIDATION
  // TODO: ADD PHONE NUMBER LIBRARY
  // TODO: ADD DATE PICKER
  // TODO: ADD A LOCATION LIBRARY

  const { firstName, lastName, nickName, phoneNumber, location, birthDate, setField } =
    useSignupWizard();

  return (
    <Flex direction="column" align="center" className=" w-full px-4" gap={24}>
      <Flex direction="column" align="center" justify="center" gap={8} className="w-full">
        <Controller
          control={control}
          name="firstName"
          rules={{ required: 'First Name is required' }}
          render={({ field: { onChange, value } }) => (
            <Input>
              <InputField
                placeholder="First Name"
                value={firstName}
                onChangeText={(text) => setField('firstName', text)}
              />
            </Input>
          )}
        />
        {errors.firstName && <Text className="text-red-500">{errors.firstName.message}</Text>}
        <Controller
          control={control}
          name="lastName"
          rules={{ required: 'Last Name is required' }}
          render={({ field: { onChange, value } }) => (
            <Input>
              <InputField
                placeholder="Last Name"
                value={lastName}
                onChangeText={(text) => setField('lastName', text)}
              />
            </Input>
          )}
        />
        {errors.lastName && <Text className="text-red-500">{errors.lastName.message}</Text>}
        <Controller
          control={control}
          name="nickName"
          render={({ field: { onChange, value } }) => (
            <Input>
              <InputField
                placeholder="Nickname"
                value={nickName}
                onChangeText={(text) => setField('nickName', text)}
              />
            </Input>
          )}
        />
        {/* This will be a date picker */}
        <Controller
          control={control}
          name="birthDate"
          rules={{ required: 'Birth date is required' }}
          render={({ field: { onChange, value } }) => (
            <Input>
              <InputField
                placeholder="Birth Date"
                value={birthDate}
                onChangeText={(text) => setField('birthDate', text)}
              />
            </Input>
          )}
        />
        {errors.birthDate && <Text className="text-red-500">{errors.birthDate.message}</Text>}
        <Controller
          control={control}
          name="phoneNumber"
          rules={{ required: 'Phone number is required' }}
          render={({ field: { onChange, value } }) => (
            <Input>
              <InputField
                placeholder="Phone Number"
                value={phoneNumber}
                onChangeText={(text) => setField('phoneNumber', text)}
              />
            </Input>
          )}
        />
        {errors.phoneNumber && <Text className="text-red-500">{errors.phoneNumber.message}</Text>}
        <Controller
          control={control}
          name="location"
          rules={{ required: 'Location is required' }}
          render={({ field: { onChange, value } }) => (
            <Input>
              <InputField
                placeholder="Location"
                value={location}
                onChangeText={(text) => setField('location', text)}
              />
            </Input>
          )}
        />
        {errors.location && <Text className="text-red-500">{errors.location.message}</Text>}
      </Flex>
      <Button className="h-14 w-full bg-black" onPress={onNavigate}>
        <ButtonText size="lg" className="text-white">
          Continue
        </ButtonText>
      </Button>
    </Flex>
  );
}
