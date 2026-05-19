// VHOP Frontend Configuration

export const API_BASE_URL = 'https://api.vhop.in';

export const IMAGE_BASE_URL = API_BASE_URL;

// Replace this with your actual Razorpay Key ID (Test Key or Live Key) in production
export const RAZORPAY_KEY_ID = 'rzp_test_r9D7602T22FhJ5';

// Helper to format image URLs
export const getImageUrl = (url: string | null | undefined) => {
  if (!url) return 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000'; // Default fallback
  if (url.startsWith('http')) return url;
  return `${IMAGE_BASE_URL}${url}`;
};
