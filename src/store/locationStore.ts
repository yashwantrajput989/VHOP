import { create } from 'zustand';

interface LocationState {
  city: string | null;
  setCity: (city: string | null) => void;
  detectLocation: () => Promise<void>;
}

const SUPPORTED_CITIES = [
  { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185 },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
  { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'Delhi', lat: 28.6139, lon: 77.2090 }
];

const getNearestSupportedCity = (lat: number, lon: number): string => {
  let nearest = SUPPORTED_CITIES[0].name;
  let minDistance = Infinity;
  for (const c of SUPPORTED_CITIES) {
    const dist = Math.pow(c.lat - lat, 2) + Math.pow(c.lon - lon, 2);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = c.name;
    }
  }
  return nearest;
};

export const useLocationStore = create<LocationState>((set) => ({
  city: null,
  setCity: (city) => set({ city }),
  detectLocation: async () => {
    if (!navigator.geolocation) return;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

        let detectedCity = null;

        if (mapboxToken) {
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=place`
            );
            const data = await response.json();
            detectedCity = data.features[0]?.text;
          } catch (error) {
            console.error('Error fetching city from Mapbox:', error);
          }
        }

        if (!detectedCity) {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            detectedCity = data.address?.city || data.address?.town || data.address?.village || data.address?.state_district;
          } catch (error) {
            console.error('Error fetching city from Nominatim:', error);
          }
        }

        let finalCity = null;
        if (detectedCity) {
          const lowerCity = detectedCity.toLowerCase();
          if (lowerCity.includes('visakhapatnam') || lowerCity.includes('vizag')) {
            finalCity = 'Visakhapatnam';
          } else if (lowerCity.includes('hyderabad')) {
            finalCity = 'Hyderabad';
          } else if (lowerCity.includes('bangalore') || lowerCity.includes('bengaluru')) {
            finalCity = 'Bangalore';
          } else if (lowerCity.includes('mumbai') || lowerCity.includes('bombay')) {
            finalCity = 'Mumbai';
          } else if (lowerCity.includes('delhi') || lowerCity.includes('new delhi')) {
            finalCity = 'Delhi';
          }
        }

        if (!finalCity) {
          finalCity = getNearestSupportedCity(latitude, longitude);
        }

        set({ city: finalCity });
        resolve();
      }, (error) => {
        console.error('Error getting location:', error);
        resolve();
      });
    });
  }
}));
