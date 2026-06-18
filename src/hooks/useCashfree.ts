import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { CASHFREE_ENV } from '../config';

interface CashfreeOptions {
  paymentSessionId: string;
  paymentEnv?: 'sandbox' | 'production';
  redirectTarget?: '_modal' | '_self' | '_blank' | '_top';
}

declare global {
  interface Window {
    Cashfree: any;
  }
}

/**
 * Dynamically loads the Cashfree JS SDK script if it hasn't been loaded yet.
 * On native Android/iOS (Capacitor), we can't use the _modal checkout because
 * the SDK relies on browser DOM/popup APIs that don't work in a WebView.
 * We fall back to _self redirect mode on native platforms.
 */
const loadCashfreeScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (window.Cashfree) {
      resolve();
      return;
    }

    // Check if script tag already exists but SDK hasn't initialized
    const existingScript = document.querySelector('script[src*="cashfree.com/js"]');
    if (existingScript) {
      // Wait for it to finish loading
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Cashfree SDK script failed to load.')));
      return;
    }

    // Inject script dynamically
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK. Check internet connection.'));
    document.head.appendChild(script);
  });
};

export const useCashfree = () => {
  const openCheckout = useCallback(async (options: CashfreeOptions) => {
    // Determine if running inside Capacitor native shell (Android / iOS)
    const isNative = Capacitor.isNativePlatform();

    // On native platforms, Cashfree modal mode doesn't work in WebView.
    // We redirect within the same webview tab instead.
    const redirectTarget = isNative ? '_self' : (options.redirectTarget || '_modal');

    // Attempt to ensure SDK is loaded
    try {
      await loadCashfreeScript();
    } catch (loadErr) {
      console.error('[Cashfree] SDK load error:', loadErr);
      throw new Error('Payment gateway could not be loaded. Please check your internet connection and try again.');
    }

    if (!window.Cashfree) {
      throw new Error('Cashfree SDK not available. Please try again.');
    }

    const env = options.paymentEnv || CASHFREE_ENV;

    console.log(`[Cashfree] Initializing checkout | env=${env} | isNative=${isNative} | target=${redirectTarget}`);

    const cashfree = window.Cashfree({ mode: env });

    return cashfree.checkout({
      paymentSessionId: options.paymentSessionId,
      redirectTarget
    });
  }, []);

  return { openCheckout };
};
