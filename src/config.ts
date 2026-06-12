import { Capacitor } from '@capacitor/core';

// VHOP Frontend Configuration

export const API_BASE_URL = 
  (!Capacitor.isNativePlatform() && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:5000'
    : 'https://api.vhop.in';

export const IMAGE_BASE_URL = API_BASE_URL;

// Cashfree integration environment ('sandbox' or 'production')
export const CASHFREE_ENV = import.meta.env.VITE_CASHFREE_ENV || 'sandbox';

// Helper to format image URLs
export const getImageUrl = (url: string | null | undefined) => {
  if (!url) return 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000'; // Default fallback
  if (url.startsWith('http')) return url;
  if (url.startsWith('data:')) return url; // Support base64 data URLs!
  return `${IMAGE_BASE_URL}${url}`;
};
