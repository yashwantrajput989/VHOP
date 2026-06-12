import { useCallback } from 'react';
import { CASHFREE_ENV } from '../config';

interface CashfreeOptions {
  paymentSessionId: string;
  redirectTarget?: '_modal' | '_self' | '_blank' | '_top';
}

declare global {
  interface Window {
    Cashfree: any;
  }
}

export const useCashfree = () => {
  const openCheckout = useCallback(async (options: CashfreeOptions) => {
    if (!window.Cashfree) {
      console.error('Cashfree SDK not loaded');
      throw new Error('Cashfree SDK not loaded. Please verify index.html script tag.');
    }
    
    const cashfree = window.Cashfree({
      mode: CASHFREE_ENV
    });
    
    return cashfree.checkout({
      paymentSessionId: options.paymentSessionId,
      redirectTarget: options.redirectTarget || '_modal'
    });
  }, []);

  return { openCheckout };
};
