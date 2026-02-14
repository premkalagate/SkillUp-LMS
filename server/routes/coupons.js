import express from 'express';
import Coupon from '../models/Coupon.js';
import CouponUsage from '../models/CouponUsage.js';
import Course from '../models/Course.js';

const router = express.Router();

// Create a new coupon
router.post('/', async (req, res) => {
  try {
    const couponData = req.body;
    const crypto = await import('crypto');
    couponData.id = crypto.default.randomBytes(16).toString('hex'); // Generate unique ID
    
    const coupon = new Coupon(couponData);
    await coupon.save();
    
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all coupons
router.get('/', async (req, res) => {
  try {
    const { isActive, courseId, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (isActive !== undefined) query.is_active = isActive === 'true';
    if (courseId) query.course_id = courseId;
    
    const coupons = await Coupon.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ created_at: -1 });
    
    const total = await Coupon.countDocuments(query);
    
    res.json({
      coupons,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get coupon by ID
router.get('/:couponId', async (req, res) => {
  try {
    const { couponId } = req.params;
    const coupon = await Coupon.findOne({ id: couponId });
    
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a coupon
router.put('/:couponId', async (req, res) => {
  try {
    const { couponId } = req.params;
    const couponData = req.body;
    
    const coupon = await Coupon.findOneAndUpdate(
      { id: couponId },
      { ...couponData, updated_at: new Date() },
      { new: true }
    );
    
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a coupon
router.delete('/:couponId', async (req, res) => {
  try {
    const { couponId } = req.params;
    
    const result = await Coupon.deleteOne({ id: couponId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate a coupon
router.post('/validate', async (req, res) => {
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
    
    res.status(200).json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      valid: false, 
      error: error.message 
    });
  }
});

export default router;