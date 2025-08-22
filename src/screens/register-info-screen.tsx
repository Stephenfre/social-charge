import { useForm, Controller } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RegisterInfoForm } from '~/components';
import { Button, ButtonText, Flex, Text } from '~/components/ui';
import { CircleUser } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';

interface FormData {
  firstName: string;
  lastName: string;
  nickName: string;
  birthDate: string;
  phoneNumber: string;
  location: string;
}

export function RegisterInfoScreen() {
  const navigation = useNavigation<NavigationProp<'RegisterInfo'>>();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    navigation.navigate('Interest');
  });

  return (
    <SafeAreaView>
      <Flex direction="column" align="center" justify="center" gap={6}>
        <Flex direction="column" align="center">
          <Text size="4xl" bold>
            Let's Get to Know You
          </Text>
          <Text>Complete your profile so others can connect with you.</Text>
        </Flex>
        <Flex direction="column" align="center" gap={1}>
          <CircleUser size={82} color={'lightgrey'} />
          <Button variant="link">
            <ButtonText>Upload Image</ButtonText>
          </Button>
        </Flex>
        <RegisterInfoForm onSuccess={() => navigation.navigate('Interest')} />
      </Flex>
    </SafeAreaView>
  );
}
