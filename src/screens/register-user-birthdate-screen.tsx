import { useForm, Controller } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Box, ButtonText, Flex, InputField, Text, Input } from '~/components/ui';
import * as z from 'zod';
import { useSignupWizard } from '~/hooks/useSignupWizard';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';

interface FormData {
  birthDate: string;
  // phoneNumber: string;
  // location: string;
}

export function RegisterUserBirthDateScreen() {
  const navigation = useNavigation<NavigationProp<'RegisterUserBirthDate'>>();
  const { birthDate, setField } = useSignupWizard();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const birthdaySchema = z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be in MM/DD/YYYY format')
    .refine((val) => {
      const [month, day, year] = val.split('/').map(Number);
      const date = new Date(year, month - 1, day);

      // check validity
      if (date.getMonth() + 1 !== month || date.getDate() !== day || date.getFullYear() !== year) {
        return false;
      }

      // min age 13
      const today = new Date();
      const minDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      return date <= minDate;
    }, 'You must be at least 18 years old');

  const onSubmit = handleSubmit(({ birthDate }) => {
    setField('birthDate', birthDate);
    navigation.navigate('RegisterUserLocation');
  });

  return (
    <SafeAreaView>
      <Flex direction="column" align="center" justify="center" gap={6} className="h-full">
        <Text size="4xl" bold>
          Whats Your Birthdate?
        </Text>
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
          <Button className="h-14 w-full bg-black" onPress={onSubmit}>
            <ButtonText size="lg" className="text-white">
              Continue
            </ButtonText>
          </Button>
        </Flex>
      </Flex>
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
