import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Coupon from '../models/Coupon.js';
import CouponUsage from '../models/CouponUsage.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import dotenv from 'dotenv';
dotenv.config();

// Load Razorpay SDK
import Razorpay from 'razorpay';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

// Create a new Razorpay order
const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt,
      notes,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Verify payment signature
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, courseId, couponData } = req.body;

    // Verify the payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZUREPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed',
      });
    }

    // Fetch course details for payment record
    const course = await Course.findOne({ id: courseId });
    if (!course) {
      throw new Error('Course not found');
    }

    const originalAmount = course.price || 0;
    let finalAmount = originalAmount;
    let discountAmount = 0;

    // Apply coupon discount if provided
    if (couponData) {
      discountAmount = couponData.discountAmount;
      finalAmount = originalAmount - discountAmount;
    }

    // Create payment record
    const paymentId = crypto.randomBytes(16).toString('hex');
    const payment = new Payment({
      id: paymentId,
      user_id: userId,
      course_id: courseId,
      amount: finalAmount,
      currency: 'INR',
      status: 'completed',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      created_at: new Date(),
      updated_at: new Date()
    });

    await payment.save();

    // Create enrollment record
    const enrollmentId = crypto.randomBytes(16).toString('hex');
    const enrollment = new Enrollment({
      id: enrollmentId,
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date()
    });

    await enrollment.save();

    // If a coupon was used, create a coupon usage record
    if (couponData) {
      const couponUsageId = crypto.randomBytes(16).toString('hex');
      const couponUsage = new CouponUsage({
        id: couponUsageId,
        coupon_id: couponData.couponId,
        user_id: userId,
        course_id: courseId,
        discount_amount: discountAmount,
        used_at: new Date()
      });

      await couponUsage.save();

      // Update coupon usage count
      await Coupon.updateOne(
        { id: couponData.couponId },
        { $inc: { current_uses: 1 } }
      );
    }

    console.log('Payment verified successfully');

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: payment.id,
      enrollmentId: enrollment.id
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Validate coupon (similar to the existing validate endpoint but as a controller function)
const validateCoupon = async (req, res) => {
  try {
    const { code, courseId, userId, coursePrice } = req.body;
    
    if (!code || !courseId || coursePrice === undefined) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Missing required fields' 
      });
    }
    
    // Find the coupon
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase().trim(),
      is_active: true
    });
    
    if (!coupon) {
      return res.status(200).json({ 
        valid: false, 
        error: 'Invalid or inactive coupon code' 
      });
    }
    
    // Check if coupon is for a specific course and matches
    if (coupon.course_id && coupon.course_id !== courseId) {
      return res.status(200).json({ 
        valid: false, 
        error: 'Coupon is not valid for this course' 
      });
    }
    
    // Check if coupon has expired
    if (coupon.valid_until && new Date() > new Date(coupon.valid_until)) {
      return res.status(200).json({ 
        valid: false, 
        error: 'Coupon has expired' 
      });
    }
    
    // Check if coupon is valid yet
    if (coupon.valid_from && new Date() < new Date(coupon.valid_from)) {
      return res.status(200).json({ 
        valid: false, 
        error: 'Coupon is not yet valid' 
      });
    }
    
    // Check if minimum purchase amount is met
    if (coupon.min_purchase_amount && coursePrice < coupon.min_purchase_amount) {
      return res.status(200).json({ 
        valid: false, 
        error: `Minimum purchase amount of ${coupon.min_purchase_amount} not met` 
      });
    }
    
    // Check if coupon has reached max uses
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return res.status(200).json({ 
        valid: false, 
        error: 'Coupon usage limit reached' 
      });
    }
    
    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (coursePrice * coupon.discount_value) / 100;
      // Cap discount at course price
      discountAmount = Math.min(discountAmount, coursePrice);
    } else if (coupon.discount_type === 'fixed_amount') {
      discountAmount = Math.min(coupon.discount_value, coursePrice);
    }
    
    const finalPrice = coursePrice - discountAmount;
    
    res.status(200).json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount,
        final_price: finalPrice
      }
    });
  } catch (error) {
    res.status(500).json({ 
      valid: false, 
      error: error.message 
    });
  }
};

export { createOrder, verifyPayment, validateCoupon };