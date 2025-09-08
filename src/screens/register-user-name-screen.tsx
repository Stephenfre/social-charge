import { useForm, Controller } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  ButtonText,
  Flex,
  InputField,
  Text,
  Input,
  Image,
  Pressable,
} from '~/components/ui';
import * as z from 'zod';
import { useSignupWizard } from '~/hooks/useSignupWizard';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { KeyboardAvoidingView, Platform, Alert } from 'react-native';

import { Image as ImageIcon } from 'lucide-react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

console.log('uuid()', uuid());

interface FormData {
  firstName: string;
  lastName: string;
  nickName: string;
}

export function RegisterUserNameScreen() {
  const navigation = useNavigation<NavigationProp<'RegisterUserName'>>();
  const { firstName, lastName, nickName, profileImageUri, setField } = useSignupWizard();

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

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName,
      lastName,
      nickName,
    },
  });

  const handleImagePick = async (useCamera: boolean = false) => {
    try {
      // Request permissions
      const { status } = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please allow access to continue');
        return;
      }

      // Pick image
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
          });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setField('profileImageUri', uri);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to pick image');
    } finally {
    }
  };

  const chooseImageSource = () => {
    Alert.alert('Add Photo', 'Choose image source', [
      { text: 'Library', onPress: () => handleImagePick(false) },
      { text: 'Camera', onPress: () => handleImagePick(true) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onSubmit = handleSubmit(({ firstName, lastName, nickName }) => {
    setField('firstName', firstName);
    setField('lastName', lastName);
    setField('nickName', nickName);
    navigation.navigate('RegisterUserBirthDate');
  });

  return (
    <SafeAreaView className=" h-full bg-background-dark px-4">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <Flex direction="column" align="center" justify="center" gap={6} className="h-full">
          <Flex align="center" gap={1}>
            <Text size="4xl" bold>
              Who do we have here?
            </Text>
            <Text className="text-center">
              Add your best pic and share your name to get started.
            </Text>
          </Flex>
          <Flex direction="column" align="center" className=" w-full px-4" gap={6}>
            {/* Profile pic upload */}
            <Flex direction="column" align="center" justify="center" gap={4} className="w-full">
              {profileImageUri ? (
                <Pressable onPress={() => setField('profileImageUri', '')}>
                  <Flex align="center" gap={2}>
                    <Image source={{ uri: profileImageUri }} rounded="full" alt="Profile picture" />
                    <Text size="sm" className="text-gray-500">
                      Remove Photo
                    </Text>
                  </Flex>
                </Pressable>
              ) : (
                <Pressable onPress={chooseImageSource}>
                  <Flex align="center" gap={2}>
                    <Flex
                      justify="center"
                      className="h-24 w-24 rounded-full border-2 border-dashed border-gray-300">
                      <Flex direction="column" align="center" gap={1}>
                        <ImageIcon size={24} color="#6B7280" />
                      </Flex>
                    </Flex>
                    <Text size="sm" className="text-gray-500">
                      Upload Photo
                    </Text>
                  </Flex>
                </Pressable>
              )}
            </Flex>
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
            <Button className="h-14 w-full " onPress={onSubmit}>
              <ButtonText size="lg" className="text-white">
                Continue
              </ButtonText>
            </Button>
          </Flex>
        </Flex>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
