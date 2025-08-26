import { useForm, Controller } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Box, ButtonText, Flex, InputField, Text, Input } from '~/components/ui';
import * as z from 'zod';
import { useSignupWizard } from '~/hooks/useSignupWizard';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { cn } from '~/utils/cn';

interface FormData {
  birthDate: string;
}

export function RegisterUserBirthDateScreen() {
  const navigation = useNavigation<NavigationProp<'RegisterUserBirthDate'>>();
  const { birthDate, setField } = useSignupWizard();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const birthdaySchema = z
    .string()
    .min(10, 'Please enter a complete date')
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be in MM/DD/YYYY format')
    .refine((val) => {
      const [month, day, year] = val.split('/').map(Number);
      const date = new Date(year, month - 1, day);

      // check validity
      if (date.getMonth() + 1 !== month || date.getDate() !== day || date.getFullYear() !== year) {
        return false;
      }

      // min age 18
      const today = new Date();
      const minDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      return date <= minDate;
    }, 'You must be at least 18 years old');

  const onSubmit = handleSubmit(({ birthDate }) => {
    setField('birthDate', birthDate);
    navigation.navigate('RegisterUserLocation');
  });

  // Watch the current birthDate input value
  const currentBirthDate = watch('birthDate');

  return (
    <SafeAreaView className="mx-4 h-full">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <Flex flex={8} direction="column" align="center" justify="center" gap={6}>
          <Flex align="center">
            <Text size="4xl" bold>
              Whats Your Birthdate?
            </Text>
            <Text size="xl">Don’t worry, we won’t judge your age.</Text>
          </Flex>
          <Flex direction="column" align="center" className=" w-full px-4" gap={8}>
            <Controller
              control={control}
              name="birthDate"
              render={({ field }) => (
                <BirthdayInput
                  value={field.value}
                  onChange={field.onChange}
                  error={errors?.birthDate?.message}
                />
              )}
            />
          </Flex>
        </Flex>
        <Flex flex={1} direction="row" justify="flex-end" align="center">
          <Button
            size="lg"
            disabled={!currentBirthDate || currentBirthDate.length !== 10}
            className={cn(
              'h-16 w-16 rounded-full',
              (!currentBirthDate || currentBirthDate.length !== 10) && 'bg-gray-400'
            )}
            onPress={onSubmit}>
            <ChevronRight size={35} color="white" />
          </Button>
        </Flex>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface BirthdayInputProps {
  value?: string;
  onChange: (val: string) => void;
  error?: string;
}

export function BirthdayInput({ value = '', onChange, error }: BirthdayInputProps) {
  const formatDate = (input: string) => {
    // remove all non-digits
    const digits = input.replace(/\D/g, '');
    let out = digits;

    if (digits.length > 2 && digits.length <= 4) {
      out = digits.slice(0, 2) + '/' + digits.slice(2);
    } else if (digits.length > 4) {
      out = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
    }
    return out;
  };

  const handleChange = (input: string) => {
    const formatted = formatDate(input);
    onChange(formatted);
  };

  return (
    <>
      <Input>
        <InputField
          placeholder="MM/DD/YYYY"
          keyboardType="number-pad"
          maxLength={10} // "MM/DD/YYYY"
          value={value}
          onChangeText={handleChange}
          textContentType="name"
        />
      </Input>
      {error && <Text className="mt-1 text-red-500">{error}</Text>}
    </>
  );
}
