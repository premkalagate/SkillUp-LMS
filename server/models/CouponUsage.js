import mongoose from 'mongoose';

const couponUsageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  coupon_id: { type: String, required: true, ref: 'Coupon' },
  user_id: { type: String, required: true, ref: 'User' },
  course_id: { type: String, required: true, ref: 'Course' },
  discount_amount: { type: Number, required: true },
  used_at: { type: Date, default: Date.now }
});

export default mongoose.model('CouponUsage', couponUsageSchema);