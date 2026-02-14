import { useState } from 'react';
import { Tag, Loader2, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { couponApi } from '@/services/api';
import { z } from 'zod';

const couponSchema = z.string()
  .trim()
  .min(1, 'Please enter a coupon code')
  .max(50, 'Coupon code is too long')
  .regex(/^[A-Za-z0-9_-]+$/, 'Invalid coupon code format');

interface CouponData {
  valid: boolean;
  couponId?: string;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  finalPrice?: number;
  message?: string;
  error?: string;
}

interface CouponInputProps {
  courseId: string;
  coursePrice: number;
  userId?: string;
  onCouponApplied: (data: CouponData) => void;
  onCouponRemoved: () => void;
}

const CouponInput = ({ courseId, coursePrice, userId, onCouponApplied, onCouponRemoved }: CouponInputProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [error, setError] = useState('');

  const validateCoupon = async () => {
    setError('');
    
    // Client-side validation
    const result = couponSchema.safeParse(code);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    
    try {
      const validationData = {
        code: code.toUpperCase().trim(),
        courseId,
        userId,
        coursePrice
      };
      
      const data = await couponApi.validateCoupon(validationData);

      if (data.valid) {
        setAppliedCoupon(data);
        onCouponApplied(data);
      } else {
        setError(data.error || 'Invalid coupon code');
      }
    } catch (err) {
      console.error('Error validating coupon:', err);
      setError('Failed to validate coupon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCode('');
    setError('');
    onCouponRemoved();
  };

  if (appliedCoupon) {
    return (
      <div className="bg-success/10 border border-success/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <div>
              <p className="font-medium text-success">{appliedCoupon.message}</p>
              <p className="text-sm text-muted-foreground">
                Code: <span className="font-mono">{code.toUpperCase()}</span>
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={removeCoupon}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-3 pt-3 border-t border-success/20 flex justify-between text-sm">
          <span className="text-muted-foreground">Discount</span>
          <span className="font-medium text-success">-₹{appliedCoupon.discountAmount?.toLocaleString('en-IN')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            className="pl-10 uppercase"
            onKeyDown={(e) => e.key === 'Enter' && validateCoupon()}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={validateCoupon}
          disabled={loading || !code.trim()}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

export default CouponInput;
