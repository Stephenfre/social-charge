import { useEffect, useRef, useState } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

interface MapScreenProps {
  location: { latitude?: number; longitude?: number };
  height?: number;
}

export function Map({ location, height }: MapScreenProps) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);

  const fallback = { latitude: 33.4571, longitude: -112.0697 };
  const deltas = { latitudeDelta: 0.02, longitudeDelta: 0.02 };

  // derive target coords
  const lat = location?.latitude ?? fallback.latitude;
  const lng = location?.longitude ?? fallback.longitude;

  // initialize region once (on mount)
  useEffect(() => {
    setRegion({ latitude: lat, longitude: lng, ...deltas });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // whenever the incoming location changes, re-center the map
  useEffect(() => {
    const next = { latitude: lat, longitude: lng, ...deltas };
    setRegion(next);
    if (mapRef.current) {
      mapRef.current.animateToRegion(next, 400);
    }
  }, [lat, lng]);

  const markerCoord = region ? { latitude: region.latitude, longitude: region.longitude } : null;

  return (
    <MapView
      ref={mapRef}
      style={{ height: height ?? 500, width: '100%' }}
      provider={PROVIDER_GOOGLE}
      showsUserLocation
      showsMyLocationButton={false}
      // Use controlled region when ready; fall back to a sane initialRegion for first paint
      region={region ?? undefined}
      initialRegion={{
        latitude: fallback.latitude,
        longitude: fallback.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }}
      onRegionChangeComplete={setRegion}>
      {markerCoord && <Marker coordinate={markerCoord} title="Event location" />}
    </MapView>
  );
}
