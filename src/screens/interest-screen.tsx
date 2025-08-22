import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ButtonText, Flex, Text } from '~/components/ui';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';

export function InterestScreen() {
  const navigation = useNavigation<NavigationProp<'Interest'>>();
  const [selectedInterest, setSelectedInterest] = useState<String[]>([]);
  const interests = [
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
          {interests.map((interest) => {
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
          onPress={() => navigation.navigate('Main')}>
          <ButtonText className={`${selectedInterest.length >= 3 ? 'text-white' : 'text-white'}`}>
            Continue
          </ButtonText>
        </Button>
      </Flex>
    </Flex>
  );
}
