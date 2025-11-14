import { useEffect, useRef } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

interface MapScreenProps {
  location: { latitude?: number; longitude?: number };
  height?: number;
  rounded: boolean;
}

export function Map({ location, height, rounded }: MapScreenProps) {
  const mapRef = useRef<MapView>(null);

  const fallback = { latitude: 33.4571, longitude: -112.0697 };
  const deltas = { latitudeDelta: 0.02, longitudeDelta: 0.02 };

  // derive target coords
  const lat = location?.latitude ?? fallback.latitude;
  const lng = location?.longitude ?? fallback.longitude;
  const targetRegion: Region = { latitude: lat, longitude: lng, ...deltas };

  // whenever the incoming location changes, re-center the map
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(targetRegion, 400);
    }
  }, [targetRegion.latitude, targetRegion.longitude]);

  return (
    <MapView
      ref={mapRef}
      style={{ height: height ?? 500, width: '100%', borderRadius: rounded ? 15 : 0 }}
      provider={PROVIDER_GOOGLE}
      showsUserLocation
      showsMyLocationButton={false}
      initialRegion={targetRegion}>
      <Marker coordinate={{ latitude: lat, longitude: lng }} title="Event location" />
    </MapView>
  );
}
