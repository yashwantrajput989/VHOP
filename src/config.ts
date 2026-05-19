// VHOP Frontend Configuration

export const API_BASE_URL = 'https://vhop.in';

export const IMAGE_BASE_URL = API_BASE_URL;

// Helper to format image URLs
export const getImageUrl = (url: string | null | undefined) => {
  if (!url) return 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000'; // Default fallback
  if (url.startsWith('http')) return url;
  return `${IMAGE_BASE_URL}${url}`;
};
