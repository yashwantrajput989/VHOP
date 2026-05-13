import { create } from 'zustand';

interface LocationState {
  city: string | null;
  setCity: (city: string | null) => void;
  detectLocation: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set) => ({
  city: null,
  setCity: (city) => set({ city }),
  detectLocation: async () => {
    if (!navigator.geolocation) return;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

        if (mapboxToken) {
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=place`
            );
            const data = await response.json();
            const city = data.features[0]?.text;
            if (city) {
              set({ city });
              resolve();
            }
          } catch (error) {
            console.error('Error fetching city from Mapbox:', error);
            resolve();
          }
        } else {
          resolve();
        }
      }, (error) => {
        console.error('Error getting location:', error);
        resolve();
      });
    });
  }
}));
