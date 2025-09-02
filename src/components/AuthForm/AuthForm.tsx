import { useForm, Controller } from 'react-hook-form';
import { Button, Flex, Input, InputField, InputIcon, InputSlot, Pressable, Text } from '../ui';
import { useSignupWizard } from '~/hooks/useSignupWizard';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react-native';

interface FormData {
  email: string;
  password: string;
}

interface AuthFormProps {
  onNavigate?: () => void;
  from?: string;
}

export function AuthForm({ onNavigate, from }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState<Boolean>(false);
  const { email: storedEmail, password: storedPassword, setField } = useSignupWizard();

  const formSchema = z
    .object({
      email: z.email('Invalid email address'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    })
    .required();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: storedEmail ?? '',
      password: storedPassword ?? '',
    },
  });

  const buttonText = from === 'register' ? 'Create Account' : 'Login';

  const onSubmit = handleSubmit(({ email, password }) => {
    setField('email', email);
    setField('password', password);
    onNavigate?.();
  });

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Input>
            <InputField
              placeholder="Email"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
          </Input>
        )}
      />
      {errors.email && <Text className="text-error-500">{errors.email.message}</Text>}

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <Input>
            <InputField
              placeholder="Password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry={showPassword ? false : true}
              textContentType="password"
            />
            <Pressable className="bg-white p-2" onPress={handleShowPassword}>
              {showPassword ? (
                <EyeOffIcon size={24} color={'grey'} />
              ) : (
                <EyeIcon size={24} color={'grey'} />
              )}
            </Pressable>
          </Input>
        )}
      />
      {errors.password && <Text className="text-error-500">{errors.password.message}</Text>}

      <Button className="h-14 w-full " onPress={onSubmit}>
        <Text size="lg" weight="600" className="text-typography-light">
          {buttonText}
        </Text>
      </Button>
    </>
  );
}
