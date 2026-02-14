import express from 'express';
import Payment from '../models/Payment.js';
import Coupon from '../models/Coupon.js';
import CouponUsage from '../models/CouponUsage.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';

const router = express.Router();

// Create a payment record
router.post('/', async (req, res) => {
  try {
    const { user_id, course_id, amount, currency, status, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Generate a unique ID for the payment
    const crypto = await import('crypto');
    const paymentId = crypto.default.randomBytes(16).toString('hex');
    
    const payment = new Payment({
      id: paymentId,
      user_id,
      course_id,
      amount,
      currency: currency || 'INR',
      status: status || 'pending',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update payment status
router.put('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, razorpay_payment_id, razorpay_signature } = req.body;
    
    const payment = await Payment.findOneAndUpdate(
      { id: paymentId },
      { 
        status,
        razorpay_payment_id,
        razorpay_signature,
        updated_at: new Date()
      },
      { new: true }
    );
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment by ID
router.get('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findOne({ id: paymentId });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const payments = await Payment.find({ user_id: userId }).sort({ created_at: -1 });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const payments = await Payment.find({ course_id: courseId }).sort({ created_at: -1 });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all payments (admin)
router.get('/', async (req, res) => {
  try {
    const { status, userId, courseId, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (userId) query.user_id = userId;
    if (courseId) query.course_id = courseId;
    
    const payments = await Payment.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ created_at: -1 });
    
    const total = await Payment.countDocuments(query);
    
    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;