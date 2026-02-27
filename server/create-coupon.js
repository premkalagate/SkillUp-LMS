import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import Coupon model
import Coupon from './models/Coupon.js';

const createSampleCoupon = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if coupon already exists
    const existingCoupon = await Coupon.findOne({ code: 'WELCOME20' });
    
    if (existingCoupon) {
      console.log('Coupon WELCOME20 already exists');
    } else {
      // Create sample coupon
      const coupon = new Coupon({
        id: 'coupon_' + Date.now(),
        code: 'WELCOME20',
        discount_type: 'percentage',
        discount_value: 20,
        min_purchase_amount: 100,
        max_uses: 100,
        current_uses: 0,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        is_active: true,
        course_id: null // Apply to all courses
      });
      
      await coupon.save();
      console.log('✅ Sample coupon created successfully!');
      console.log('Code: WELCOME20');
      console.log('Discount: 20%');
      console.log('Min Purchase: ₹100');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createSampleCoupon();
