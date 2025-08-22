import React from 'react';

import { useForm, Controller } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Box, ButtonText, Flex, InputField, Text, Input } from '../ui';

interface FormData {
  firstName: string;
  lastName: string;
  nickName: string;
  birthDate: string;
  phoneNumber: string;
  location: string;
}

interface RegisterInfoFormProps {
  onSuccess?: () => void;
}

export function RegisterInfoForm({ onSuccess }: RegisterInfoFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    onSuccess?.();
  });

  return (
    <Flex direction="column" align="center" className=" w-full px-4" gap={24}>
      <Flex direction="column" align="center" justify="center" gap={8} className="w-full">
        <Controller
          control={control}
          name="firstName"
          rules={{ required: 'First Name is required' }}
          render={({ field: { onChange, value } }) => (
            <Input>
              <InputField placeholder="First Name" value={value} onChangeText={onChange} />
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
              <InputField placeholder="Last Name" value={value} onChangeText={onChange} />
            </Input>
          )}
        />
        {errors.lastName && <Text className="text-red-500">{errors.lastName.message}</Text>}
        <Controller
          control={control}
          name="nickName"
          rules={{ required: 'Nickname is required' }}
          render={({ field: { onChange, value } }) => (
            <Input>
              <InputField placeholder="Nickname" value={value} onChangeText={onChange} />
            </Input>
          )}
        />
        {errors.nickName && <Text className="text-red-500">{errors.nickName.message}</Text>}
        {/* This will be a date picker */}
        <Controller
          control={control}
          name="birthDate"
          rules={{ required: 'Birth date is required' }}
          render={({ field: { onChange, value } }) => (
            <Input>
              <InputField placeholder="Birth Date" value={value} onChangeText={onChange} />
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
              <InputField placeholder="Phone Number" value={value} onChangeText={onChange} />
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
              <InputField placeholder="Location" value={value} onChangeText={onChange} />
            </Input>
          )}
        />
        {errors.location && <Text className="text-red-500">{errors.location.message}</Text>}
      </Flex>
      <Button className="h-14 w-full bg-black" onPress={onSubmit}>
        <ButtonText size="lg" className="text-white">
          Continue
        </ButtonText>
      </Button>
    </Flex>
  );
}
