import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ButtonText, Flex, Text } from '~/components/ui';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { supabase } from '~/lib/supabase';
import { useSignupWizard } from '~/hooks/useSignupWizard';
import { Alert } from 'react-native';
import dayjs from 'dayjs';

import { ChevronRight } from 'lucide-react-native';
import { cn } from '~/utils/cn';
import { INTEREST_CATEGORIES } from '~/constants/interests';

import { uploadProfileImage } from '~/lib/uploadImage';

export function InterestScreen() {
  const navigation = useNavigation<NavigationProp<'Interest'>>();
  const [selectedInterests, setSelectedInterests] = useState<String[]>([]);

  const categoryEmojis = {
    active: '🏃‍♂️',
    creative: '🎨',
    social: '🍻',
    relaxed: '📚',
  };

  const interestEmojis: Record<string, string> = {
    // Active
    Sports: '⚽',
    Outdoors: '🏔️',
    Fitness: '💪',
    Hiking: '🥾',
    Yoga: '🧘‍♀️',
    Dancing: '💃',
    // Creative
    Music: '🎵',
    Art: '🎨',
    Photography: '📸',
    Movies: '🎬',
    Gaming: '🎮',
    Fashion: '👗',
    // Social
    Travel: '✈️',
    Nightlife: '🌙',
    Foodie: '🍕',
    Coffee: '☕',
    Volunteering: '🤝',
    // Relaxed
    Reading: '📖',
    Tech: '💻',
    Pets: '🐕',
  };

  const handleSelectInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests((prev) => prev.filter((item) => item !== interest));
      return;
    }

    if (selectedInterests.length === 5) return;
    setSelectedInterests((prev) => [...prev, interest]);
  };

  const {
    email,
    password,
    firstName,
    lastName,
    city,
    state,
    country,
    birthDate,
    profileImageUri,
    reset,
  } = useSignupWizard();

  const [month, day, year] = birthDate?.split('/').map(Number) || [];
  const birthDateObj = dayjs(`${year}-${month}-${day}`);
  const getAge = dayjs().diff(birthDateObj, 'year');

  const onFinish = async (skip: boolean) => {
    try {
      // 1) Create auth user (session may be null if email confirmation required)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: firstName + ' ' + lastName,
          },
        },
      });

      if (signUpError) {
        Alert.alert(signUpError.message);
        return;
      }

      // 2) If session exists now, create profile + interests immediately
      const userId = signUpData.user?.id ?? signUpData.session?.user.id;
      if (userId) {
        const userInfo = {
          id: userId,
          first_name: firstName,
          last_name: lastName,
          email,
          city,
          state,
          country,
          age: getAge,
          birth_date: birthDate,
        };

        // Create user profile
        const { error: upsertError } = await supabase.from('users').upsert(userInfo);
        if (upsertError) {
          // If user profile creation fails, sign out and show error
          await supabase.auth.signOut();
          Alert.alert('Failed to create profile. Please try again.');
          return;
        }

        // Upload profile image if exists
        if (profileImageUri) {
          try {
            const imageResult = await uploadProfileImage(userId, profileImageUri);
            // Update user profile with image URL
            await supabase
              .from('users')
              .update({ profile_image_url: imageResult.url })
              .eq('id', userId);
          } catch (imageError) {
            console.error('Failed to upload profile image:', imageError);
            // Don't fail the entire signup process if image upload fails
            // Just log the error and continue
          }
        }

        // Save user interests if any selected
        if (selectedInterests.length && !skip) {
          const { error: interestsError } = await supabase
            .from('user_interests')
            .upsert(selectedInterests.map((i) => ({ user_id: userId, interest: i })));

          if (interestsError) {
            // If interests creation fails, sign out and show error
            Alert.alert('Failed to save interests. Please try again.');
            return;
          }
        }

        // Success - reset form and navigate to main
        reset();
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else {
        // Email confirmation flow: wait for SIGNED_IN, then finish profile there
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      }
    } catch (error) {
      // Catch any unexpected errors and clean up
      await supabase.auth.signOut();
      Alert.alert('An unexpected error occurred. Please try again.');
      console.error('Signup error:', error);
    }
  };

  return (
    <SafeAreaView className="mx-4 h-full">
      <Flex flex={1} direction="column" justify="space-between">
        <Flex flex={1} justify="center" gap={10}>
          <Flex direction="column" align="center" gap={2}>
            <Text size="4xl" bold>
              Choose 5 things worth showing up for
            </Text>
            <Text>Choose what excites you and meet people who feel the same.</Text>
          </Flex>
          {Object.entries(INTEREST_CATEGORIES).map(([category, interests]) => (
            <Flex key={category} direction="column" gap={2}>
              <Text size="lg" bold className="capitalize">
                {categoryEmojis[category as keyof typeof categoryEmojis]} {category}
              </Text>
              <Flex direction="row" gap={2} wrap="wrap">
                {interests.map((interest: string) => (
                  <Button
                    key={interest}
                    variant="outline"
                    className={`rounded-xl ${selectedInterests.includes(interest) && 'bg-black'}`}
                    onPress={() => handleSelectInterest(interest)}
                    disabled={
                      !selectedInterests.includes(interest) && selectedInterests.length === 5
                    }>
                    <ButtonText
                      className={`${selectedInterests.includes(interest) ? 'text-white' : 'text-black'}`}>
                      {interestEmojis[interest]} {interest}
                    </ButtonText>
                  </Button>
                ))}
              </Flex>
            </Flex>
          ))}
        </Flex>
        <Flex direction="row" justify="space-between" align="center">
          <Button variant="link" onPress={() => onFinish(true)}>
            <ButtonText>Skip</ButtonText>
          </Button>
          <Flex direction="row" align="center" gap={4}>
            <Text weight="500">Selected {selectedInterests.length}/5</Text>
            <Button
              size="lg"
              disabled={selectedInterests.length < 5}
              className={cn(
                'h-16 w-16 rounded-full',
                selectedInterests.length < 5 && 'bg-gray-400'
              )}
              onPress={() => onFinish(false)}>
              <ChevronRight size={35} color="white" />
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
}
