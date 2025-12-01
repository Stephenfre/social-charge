import { useForm, Controller } from 'react-hook-form';
import { Button, Flex, Input, InputField, InputIcon, InputSlot, Pressable, Text } from '../ui';
import { useSignupWizard } from '~/hooks/useSignupWizard';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ReactNode, useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react-native';
import { cn } from '~/utils/cn';

interface FormData {
  email: string;
  password: string;
}

interface AuthFormProps {
  onNavigate?: () => void;
  from?: string;
  showFieldLabels?: boolean;
  submitButtonLabel?: string;
  buttonClassName?: string;
  inputSize?: React.ComponentProps<typeof Input>['size'];
  inputClassName?: string;
  afterFields?: ReactNode;
}

export function AuthForm({
  onNavigate,
  from,
  showFieldLabels = false,
  submitButtonLabel,
  buttonClassName,
  inputSize,
  inputClassName,
  afterFields,
}: AuthFormProps) {
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

  const buttonText = submitButtonLabel ?? (from === 'register' ? 'Create Account' : 'Login');

  const onSubmit = handleSubmit(({ email, password }) => {
    setField('email', email);
    setField('password', password);
    onNavigate?.();
  });

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Flex className="w-full" gap={4}>
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Flex className="w-full" gap={2}>
            {showFieldLabels && (
              <Text size="sm" bold className="text-typography-light">
                Email
              </Text>
            )}
            <Input size={inputSize} className={inputClassName}>
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
          </Flex>
        )}
      />
      {errors.email && (
        <Text className="text-error-500" size="sm">
          {errors.email.message}
        </Text>
      )}

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <Flex className="w-full" gap={2}>
            {showFieldLabels && (
              <Text size="sm" bold className="text-typography-light">
                Password
              </Text>
            )}
            <Input size={inputSize} className={inputClassName}>
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
          </Flex>
        )}
      />
      {errors.password && (
        <Text className="text-error-500" size="sm">
          {errors.password.message}
        </Text>
      )}
      {afterFields}

      <Button className={cn('h-14 w-full', buttonClassName)} onPress={onSubmit}>
        <Text size="lg" weight="600" className="text-typography-light">
          {buttonText}
        </Text>
      </Button>
    </Flex>
  );
}
