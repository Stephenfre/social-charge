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

export interface AuthFormProps {
  onNavigate?: () => void;
  from?: string;
  showFieldLabels?: boolean;
  submitButtonLabel?: string;
  buttonClassName?: string;
  inputSize?: React.ComponentProps<typeof Input>['size'];
  inputClassName?: string;
  inputFieldClassName?: string;
  afterFields?: ReactNode;
  floatingLabel?: boolean;
  floatingLabelWrapperClassName?: string;
  floatingLabelTextClassName?: string;
  floatingLabelActiveTextClassName?: string;
}

export function AuthForm({
  onNavigate,
  from,
  showFieldLabels = false,
  submitButtonLabel,
  buttonClassName,
  inputSize,
  inputClassName,
  inputFieldClassName,
  afterFields,
  floatingLabel = false,
  floatingLabelWrapperClassName,
  floatingLabelTextClassName,
  floatingLabelActiveTextClassName,
}: AuthFormProps) {
  const [showPassword, setShowPassword] = useState<Boolean>(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
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
    <Flex className="w-full" gap={8}>
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Flex className="w-full" gap={floatingLabel && showFieldLabels ? 0 : 2}>
            {showFieldLabels && !floatingLabel && (
              <Text size="sm" bold className="text-typography-light">
                Email
              </Text>
            )}
            <Input size={inputSize} className={inputClassName}>
              {showFieldLabels && floatingLabel && (
                <Text
                  size="xs"
                  bold
                  className={cn(
                    'absolute left-3 top-0 -translate-y-1/2 bg-background-dark px-1 text-xs text-background-500',
                    floatingLabelWrapperClassName,
                    floatingLabelTextClassName,
                    focusedField === 'email' && floatingLabelActiveTextClassName
                  )}>
                  Email
                </Text>
              )}
              <InputField
                placeholder="Email"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={() => {
                  field.onBlur();
                  setFocusedField((prev) => (prev === 'email' ? null : prev));
                }}
                onFocus={() => setFocusedField('email')}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                className={inputFieldClassName}
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
          <Flex className="w-full" gap={floatingLabel && showFieldLabels ? 0 : 2}>
            {showFieldLabels && !floatingLabel && (
              <Text size="sm" bold className="text-typography-light">
                Password
              </Text>
            )}
            <Input size={inputSize} className={inputClassName}>
              {showFieldLabels && floatingLabel && (
                <Text
                  size="xs"
                  bold
                  className={cn(
                    'absolute left-3 top-0 -translate-y-1/2 bg-background-dark px-1 text-xs text-background-500',
                    floatingLabelWrapperClassName,
                    floatingLabelTextClassName,
                    focusedField === 'password' && floatingLabelActiveTextClassName
                  )}>
                  Password
                </Text>
              )}
              <InputField
                placeholder="Password"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={() => {
                  field.onBlur();
                  setFocusedField((prev) => (prev === 'password' ? null : prev));
                }}
                onFocus={() => setFocusedField('password')}
                secureTextEntry={showPassword ? false : true}
                textContentType="password"
                className={inputFieldClassName}
              />
              <Pressable
                className={cn('p-2', floatingLabel ? 'bg-transparent' : 'bg-white')}
                onPress={handleShowPassword}>
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
