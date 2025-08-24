import { useForm, Controller } from 'react-hook-form';
import { Button, Input, InputField, Text } from '../ui';
import { useSignupWizard } from '~/hooks/useSignupWizard';
import { cn } from '~/utils/cn';

interface FormData {
  email: string;
  password: string;
}

interface AuthFormProps {
  onNavigate?: () => void;
  from?: string;
}

export function AuthForm({ onNavigate, from }: AuthFormProps) {
  const { email, password, setField } = useSignupWizard();

  // TODO: ADD ZOD VALIDATION

  const {
    control,
    formState: { errors },
  } = useForm<FormData>();

  const isDisabled = !email && !password;

  const buttonText = from === 'register' ? 'Create Account' : 'Login';

  return (
    <>
      <Controller
        control={control}
        name="email"
        rules={{ required: 'Email is required' }}
        render={({ field: { onChange, value } }) => (
          <Input>
            <InputField
              placeholder="Email"
              value={email}
              onChangeText={(text) => setField('email', text)}
            />
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
              value={password}
              onChangeText={(text) => setField('password', text)}
              // secureTextEntry
            />
          </Input>
        )}
      />
      {errors.password && <Text className="text-red-500">{errors.password.message}</Text>}

      <Button className="h-14 w-full bg-black" onPress={onNavigate} disabled={isDisabled}>
        <Text size="lg" weight="600" className="text-white">
          {buttonText}
        </Text>
      </Button>
    </>
  );
}
