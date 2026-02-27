import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import Payment model
import Payment from './models/Payment.js';

const createSamplePayment = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create sample payment
    const payment = new Payment({
      id: 'payment_' + Date.now(),
      user_id: '600d2a70d3becf7240b0fda33fe923af', // Admin user ID
      course_id: 'sample_course_id',
      amount: 2999,
      currency: 'INR',
      status: 'completed',
      razorpay_payment_id: 'pay_' + Date.now(),
      razorpay_order_id: 'order_' + Date.now(),
      created_at: new Date(),
      updated_at: new Date()
    });
    
    await payment.save();
    console.log('✅ Sample payment created successfully!');
    console.log('Payment ID:', payment.id);
    console.log('Amount: ₹' + payment.amount);
    console.log('Status: ' + payment.status);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createSamplePayment();
