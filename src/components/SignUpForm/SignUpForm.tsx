import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, Input, InputField, Text } from '../ui';

interface FormData {
  email: string;
  password: string;
}

interface SignUpFormProps {
  onSuccess?: () => void;
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    onSuccess?.();
  });

  // TODO: SET-UP ZOD

  return (
    <>
      <Controller
        control={control}
        name="email"
        rules={{ required: 'Email is required' }}
        render={({ field: { onChange, value } }) => (
          <Input>
            <InputField placeholder="Email" value={value} onChangeText={onChange} />
          </Input>
        )}
      />
      {errors.email && <Text className="text-red-500">{errors.email.message}</Text>}

      <Controller
        control={control}
        name="password"
        rules={{ required: 'Password is required' }}
        render={({ field: { onChange, value } }) => (
          <Input>
            <InputField
              placeholder="Password"
              value={value}
              onChangeText={onChange}
              secureTextEntry
            />
          </Input>
        )}
      />
      {errors.password && <Text className="text-red-500">{errors.password.message}</Text>}

      <Button className="h-14 w-full bg-black" onPress={onSubmit}>
        <Text size="lg" weight="600" className="text-white">
          Create Account
        </Text>
      </Button>
    </>
  );
}
