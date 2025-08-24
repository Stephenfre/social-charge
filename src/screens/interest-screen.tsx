import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ButtonText, Flex, Text } from '~/components/ui';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { supabase } from '~/lib/supabase';
import { useSignupWizard } from '~/hooks/useSignupWizard';
import { Alert } from 'react-native';
import dayjs from 'dayjs';

export function InterestScreen() {
  const navigation = useNavigation<NavigationProp<'Interest'>>();
  const [selectedInterest, setSelectedInterest] = useState<String[]>([]);
  const interestList = [
    'Music',
    'Sports',
    'Technology',
    'Art & Design',
    'Food & Drink',
    'Fitness & Wellness',
    'Travel & Adventure',
    'Gaming',
    'Movies & TV',
    'Photography',
    'Books & Literature',
    'Networking',
    'Entrepreneurship',
    'Fashion & Style',
    'Health & Mindfulness',
    'Outdoor Activities',
    'Science',
    'Theater & Performing Arts',
    'Volunteering',
    'Culture & Community',
  ];

  const handleSelectInterest = (interest: string) => {
    if (selectedInterest.includes(interest)) {
      setSelectedInterest((prev) => prev.filter((item) => item !== interest));
      return;
    }

    if (selectedInterest.length === 5) return;
    setSelectedInterest((prev) => [...prev, interest]);
  };

  const {
    email,
    password,
    firstName,
    lastName,
    phoneNumber,
    location,
    birthDate,
    age,
    interests,
    setInterests,
    reset,
  } = useSignupWizard();

  const onFinish = async () => {
    // 1) Create auth user (session may be null if email confirmation required)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    // TODO: change from native Alert to alert message
    if (signUpError) Alert.alert(signUpError.message);
    // if (!session) Alert.alert('Please check your inbox for email verification!')

    // 2) If session exists now, create profile + interests immediately
    const getAge = birthDate && dayjs().diff(dayjs(birthDate), 'year');
    const userId = signUpData.user?.id ?? signUpData.session?.user.id;
    console.log(userId);
    if (userId) {
      const { error: upsertError } = await supabase.from('users').upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phoneNumber,
        location,
        age: getAge,
        birth_date: birthDate,
      });

      if (selectedInterest.length) {
        // assume you have interests by name -> need IDs:
        const { data: all } = await supabase
          .from('interests')
          .select('id, name')
          .in('name', interests);
        const rows = (all ?? []).map((i) => ({ user_id: userId, interest_id: i.id }));
        if (rows.length) await supabase.from('user_interests').insert(rows).select();
      }

      reset();
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } else {
      // Email confirmation flow: wait for SIGNED_IN, then finish profile there
      // (See hook below)
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    }
  };

  return (
    <Flex direction="column" justify="center" className=" h-full" gap={10}>
      <Flex direction="column" gap={10}>
        <Flex direction="column" align="center" gap={2}>
          <Text size="4xl" bold>
            Choose Your Interests
          </Text>
          <Text>
            Choose a few interests so we can show you events that match. (Select at least 3)
          </Text>
        </Flex>
        <Flex direction="row" gap={2} wrap="wrap" className="px-4">
          {interestList.map((interest) => {
            return (
              <Button
                key={interest}
                className={`rounded-xl ${selectedInterest.includes(interest) ? 'bg-black' : 'bg-gray-300'}`}
                onPress={() => handleSelectInterest(interest)}
                disabled={!selectedInterest.includes(interest) && selectedInterest.length === 5}>
                <ButtonText
                  className={`${selectedInterest.includes(interest) ? 'text-white' : 'text-white'}`}>
                  {interest}
                </ButtonText>
              </Button>
            );
          })}
          {selectedInterest.length === 5 ? (
            <Text className="text-center text-red-500" bold>
              Limit reached: 5 selected
            </Text>
          ) : null}
        </Flex>
      </Flex>
      <Flex className="p-4">
        <Button
          className={`rounded-xl ${selectedInterest.length >= 3 ? 'bg-black' : 'bg-gray-300'} h-14 w-full`}
          disabled={selectedInterest.length < 3}
          onPress={onFinish}>
          <ButtonText className={`${selectedInterest.length >= 3 ? 'text-white' : 'text-white'}`}>
            Continue
          </ButtonText>
        </Button>
      </Flex>
    </Flex>
  );
}
