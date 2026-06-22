import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export type Coords = { lat: number; lng: number };

/**
 * Foreground GPS location helper. Works in Expo Go (expo-location is bundled).
 * Call `request()` to prompt for permission and fetch the current position.
 */
export function useUserLocation() {
  const [location, setLocation] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (): Promise<Coords | null> => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLocation(coords);
      return coords;
    } catch (e: any) {
      setError(e?.message || 'Could not get location');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { location, loading, error, request };
}
