import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

interface MapScreenProps {
  location: { latitude?: number | null; longitude?: number | null };
  height?: number;
  rounded: boolean;
  showsUserLocation?: boolean;
  liteMode?: boolean;
}

export function Map({
  location,
  height,
  rounded,
  showsUserLocation = false,
  liteMode = false,
}: MapScreenProps) {
  const mapRef = useRef<MapView>(null);

  const fallback = { latitude: 33.4571, longitude: -112.0697 };
  const deltas = { latitudeDelta: 0.02, longitudeDelta: 0.02 };
  const provider = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;
  const safeCoord = (value: number | null | undefined, fallbackValue: number) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallbackValue;

  const lat = safeCoord(location?.latitude, fallback.latitude);
  const lng = safeCoord(location?.longitude, fallback.longitude);
  const targetRegion: Region = { latitude: lat, longitude: lng, ...deltas };

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(targetRegion, 400);
    }
  }, [targetRegion.latitude, targetRegion.longitude]);

  return (
    <MapView
      ref={mapRef}
      style={{ height: height ?? 500, width: '100%', borderRadius: rounded ? 15 : 0 }}
      provider={provider}
      liteMode={Platform.OS === 'android' ? liteMode : false}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={false}
      initialRegion={targetRegion}>
      <Marker coordinate={{ latitude: lat, longitude: lng }} title="Event location" />
    </MapView>
  );
}
