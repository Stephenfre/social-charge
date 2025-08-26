import { useState, useRef, useEffect } from 'react';
import * as Location from 'expo-location';
import * as z from 'zod';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useForm, Controller } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Box, ButtonText, Flex, Text } from '~/components/ui';
import { useSignupWizard } from '~/hooks/useSignupWizard';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '~/types/navigation';
import { View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface FormData {
  location: string;
}

export function RegisterLocationScreen() {
  const navigation = useNavigation<NavigationProp<'RegisterUserLocation'>>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const { city, state, country, setField } = useSignupWizard();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

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

  const locationSchema = z.string();

  const onSubmit = (skip: boolean) => {
    if (skip) {
      navigation.navigate('Interest');
      return;
    }

    handleSubmit(async ({ location }) => {
      if (!userLocation) {
        setErrorMessage('Please share your location first');
        return;
      }

      const cityStateCountry = await Location.reverseGeocodeAsync({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      });

      setField('city', cityStateCountry[0].city ?? undefined);
      setField('state', cityStateCountry[0].region ?? undefined);
      setField('country', cityStateCountry[0].country ?? undefined);

      navigation.navigate('Interest');
    })();
  };

  return (
    <SafeAreaView className="h-full p-4">
      <Flex justify="space-between" className="h-full">
        <Flex gap={6}>
          <Flex>
            <Text size="4xl" bold>
              Now, where should we meet you?
            </Text>
            <Text>We’ll use your location to show you events and people near you</Text>
          </Flex>
          <Flex>
            <MapScreen
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
            <ButtonText>Skip</ButtonText>
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

interface MapScreenProps {
  latitude: number | null;
  longitude: number | null;
}

function MapScreen({ latitude, longitude }: MapScreenProps) {
  const [region, setRegion] = useState<Region | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (latitude && longitude) {
      (async () => {
        setCoords({ latitude: latitude, longitude: longitude });
        setRegion({
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      })();
    }
  }, [latitude, longitude]);

  const recenter = () => {
    if (coords && mapRef.current) {
      mapRef.current.animateToRegion({ ...coords, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 500);
    }
  };

  return (
    <MapView
      ref={mapRef}
      style={{ height: 500, width: '100%' }}
      provider={PROVIDER_GOOGLE} // optional on iOS; Android uses Google
      showsUserLocation
      showsMyLocationButton={false} // we'll add our own
      initialRegion={
        region ?? {
          latitude: 33.4571, // fallback (PHX)
          longitude: -112.0697,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }
      }
      onRegionChangeComplete={setRegion}>
      {coords && <Marker coordinate={coords} title="You are here" />}
    </MapView>
  );
}
