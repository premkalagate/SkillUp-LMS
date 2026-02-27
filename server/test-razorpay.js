import dotenv from 'dotenv';
dotenv.config();

import Razorpay from 'razorpay';

console.log('Testing Razorpay connection...');
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not set');
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Not set');

try {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  console.log('Razorpay instance created successfully');

  // Test creating a simple order
  const options = {
    amount: 10000, // 100 rupees in paise
    currency: 'INR',
    receipt: 'test_receipt_123',
    notes: {
      test: 'true'
    }
  };

  console.log('Attempting to create test order...');

  razorpay.orders.create(options)
    .then(order => {
      console.log('✅ Test order created successfully:', order.id);
      console.log('Order details:', order);
    })
    .catch(error => {
      console.error('❌ Error creating test order:', error);
      console.error('Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        description: error.description
      });
    });

} catch (error) {
  console.error('❌ Error initializing Razorpay:', error);
}
