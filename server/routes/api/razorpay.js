import express from 'express';
import { createOrder, verifyPayment, validateCoupon } from '../../controllers/razorpayController.js';

const router = express.Router();

// Create a new Razorpay order
router.post('/create-order', createOrder);

// Verify payment
router.post('/verify-payment', verifyPayment);

// Validate coupon
router.post('/validate-coupon', validateCoupon);

export default router;