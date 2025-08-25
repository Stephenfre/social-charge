import { useForm, Controller } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Box, ButtonText, Flex, InputField, Text, Input } from '~/components/ui';
import * as z from 'zod';
import { useSignupWizard } from '~/hooks/useSignupWizard';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';

interface FormData {
  firstName: string;
  lastName: string;
  nickName: string;
  // birthDate: string;
  // phoneNumber: string;
  // location: string;
}

export function RegisterUserNameScreen() {
  const navigation = useNavigation<NavigationProp<'RegisterUserName'>>();
  const { firstName, lastName, nickName, phoneNumber, location, birthDate, setField } =
    useSignupWizard();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  // helpers
  const nonEmpty = (label: string) =>
    z.string().trim().min(1, `${label} is required`).max(50, `${label} is too long`);

  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/; // letters, accents, spaces, hyphen, apostrophe

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
    })
    .required();

  const onSubmit = handleSubmit(({ firstName, lastName, nickName }) => {
    setField('firstName', firstName);
    setField('lastName', lastName);
    setField('nickName', nickName);
    navigation.navigate('RegisterUserBirthDate');
  });

  return (
    <SafeAreaView>
      <Flex direction="column" align="center" justify="center" gap={6} className="h-full">
        <Text size="4xl" bold>
          Whats Your Name?
        </Text>
        <Flex direction="column" align="center" className=" w-full px-4" gap={8}>
          <Flex direction="column" align="center" justify="center" gap={8} className="w-full">
            <Controller
              control={control}
              name="firstName"
              render={({ field }) => (
                <Input>
                  <InputField
                    placeholder="First Name"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    textContentType="name"
                  />
                </Input>
              )}
            />
            {errors.firstName && <Text className="text-red-500">{errors.firstName.message}</Text>}
            <Controller
              control={control}
              name="lastName"
              rules={{ required: 'Last Name is required' }}
              render={({ field }) => (
                <Input>
                  <InputField
                    placeholder="Last Name"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    textContentType="name"
                  />
                </Input>
              )}
            />
            {errors.lastName && <Text className="text-red-500">{errors.lastName.message}</Text>}
            <Controller
              control={control}
              name="nickName"
              render={({ field }) => (
                <Input>
                  <InputField
                    placeholder="Nickname"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    textContentType="name"
                  />
                </Input>
              )}
            />
          </Flex>
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
