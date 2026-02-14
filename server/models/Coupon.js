import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  discount_type: { 
    type: String, 
    enum: ['percentage', 'fixed_amount'], 
    required: true 
  },
  discount_value: { type: Number, required: true },
  is_active: { type: Boolean, default: true },
  valid_from: { type: Date },
  valid_until: { type: Date },
  max_uses: { type: Number },
  current_uses: { type: Number, default: 0 },
  min_purchase_amount: { type: Number },
  course_id: { type: String, ref: 'Course' }, // Optional: specific course coupon
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model('Coupon', couponSchema);