import { useEffect, useRef, useState } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

interface MapScreenProps {
  latitude?: number | null;
  longitude?: number | null;
  height?: number;
}

export function Map({ latitude, longitude, height }: MapScreenProps) {
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

  // const recenter = () => {
  //   if (coords && mapRef.current) {
  //     mapRef.current.animateToRegion({ ...coords, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 500);
  //   }
  // };

  return (
    <MapView
      ref={mapRef}
      style={{ height: height ? height : 500, width: '100%', borderRadius: 10 }}
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
