import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { paymentApi } from '@/services/api';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface UseRazorpayOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface CouponData {
  couponId?: string;
  discountAmount?: number;
}

export const useRazorpay = (options?: UseRazorpayOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const initiatePayment = useCallback(async (
    courseId: string,
    courseTitle: string,
    amount: number,
    userId: string,
    userEmail?: string,
    userName?: string,
    couponData?: CouponData
  ) => {
    setIsLoading(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Create order
      const data = await paymentApi.createOrder({
        amount: Math.round(amount),
        currency: 'INR',
        receipt: `receipt_${courseId}_${Date.now()}`,
        notes: {
          courseId,
          courseTitle,
        },
      });

      if (!data.success) {
        throw new Error(data.error || 'Failed to create order');
      }

      // Open Razorpay checkout
      const razorpayOptions: RazorpayOptions = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'LearnHub',
        description: courseTitle,
        order_id: data.orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            // Verify payment
            const verifyData = await paymentApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId,
              courseId,
              couponData,
            });

            if (!verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }

            toast({
              title: 'Payment successful!',
              description: 'You are now enrolled in the course.',
            });

            options?.onSuccess?.();
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Payment verification failed';
            toast({
              title: 'Payment Error',
              description: message,
              variant: 'destructive',
            });
            options?.onError?.(message);
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initiate payment';
      toast({
        title: 'Payment Error',
        description: message,
        variant: 'destructive',
      });
      options?.onError?.(message);
      setIsLoading(false);
    }
  }, [loadRazorpayScript, toast, options]);

  return { initiatePayment, isLoading };
};
