import { useState } from 'react';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ButtonText, Flex, Text } from '~/components/ui';
import { useSignupWizard } from '~/hooks/useSignupWizard';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { ChevronRight } from 'lucide-react-native';
import { Map } from '~/components';

export function RegisterLocationScreen() {
  const navigation = useNavigation<NavigationProp<'RegisterUserLocation'>>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const { setField } = useSignupWizard();

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMessage('Permission to access location was denied');
      return;
    }

    let current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    setUserLocation(current);

    if (current) {
    }
  };

  const onSubmit = async (skip: boolean) => {
    if (skip) {
      navigation.navigate('Interest');
      return;
    }

    if (!userLocation) {
      setErrorMessage('Please share your location first');
      return;
    }

    const cityStateCountry = await Location.reverseGeocodeAsync({
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
    });

    setField('city', cityStateCountry[0].city ?? '');
    setField('state', cityStateCountry[0].region ?? '');
    setField('country', cityStateCountry[0].country ?? '');

    navigation.navigate('Interest');
  };

  return (
    <SafeAreaView className="h-full bg-background-dark p-4">
      <Flex justify="space-between" className="h-full">
        <Flex gap={6}>
          <Flex>
            <Text size="4xl" bold>
              Now, where should we meet you?
            </Text>
            <Text>We’ll use your location to show you events and people near you</Text>
          </Flex>
          <Flex>
            <Map
              latitude={userLocation && userLocation.coords.latitude}
              longitude={userLocation && userLocation.coords.longitude}
            />

            <Button variant="link" onPress={getLocation}>
              <ButtonText> Share My Location</ButtonText>
            </Button>
          </Flex>
        </Flex>
        <Flex direction="row" justify="space-between" align="center">
          <Button variant="link" onPress={() => onSubmit(true)}>
            <Text>Skip</Text>
          </Button>
          <Flex direction="row" align="center" gap={4}>
            <Button size="lg" className={'h-16 w-16 rounded-full'} onPress={() => onSubmit(false)}>
              <ChevronRight size={35} color="white" />
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
}
