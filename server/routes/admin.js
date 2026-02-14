import express from 'express';
import AdminProfile from '../models/AdminProfile.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Payment from '../models/Payment.js';
import Enrollment from '../models/Enrollment.js';

const router = express.Router();

// Get or create admin profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists and is an admin
    const user = await User.findOne({ id: userId });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. User is not an admin.' });
    }
    
    let adminProfile = await AdminProfile.findOne({ user_id: userId });
    
    if (!adminProfile) {
      // Create a new admin profile if it doesn't exist
      const crypto = await import('crypto');
      const adminProfileId = crypto.default.randomBytes(16).toString('hex');
      adminProfile = new AdminProfile({
        id: adminProfileId,
        user_id: userId,
        full_name: user.full_name || `Admin ${userId}`
      });
      await adminProfile.save();
    }
    
    res.json(adminProfile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update admin profile
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { full_name } = req.body;
    
    const adminProfile = await AdminProfile.findOneAndUpdate(
      { user_id: userId },
      { full_name, updated_at: new Date() },
      { new: true }
    );
    
    if (!adminProfile) {
      return res.status(404).json({ error: 'Admin profile not found' });
    }
    
    res.json(adminProfile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get admin dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalCourses,
      totalPayments,
      totalEnrollments
    ] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Payment.countDocuments(),
      Enrollment.countDocuments()
    ]);
    
    // Get recent activity
    const recentUsers = await User.find()
      .sort({ created_at: -1 })
      .limit(5)
      .select('full_name email created_at role');
      
    const recentCourses = await Course.find()
      .sort({ created_at: -1 })
      .limit(5)
      .select('title instructor_id created_at is_published');
    
    const recentPayments = await Payment.find()
      .sort({ created_at: -1 })
      .limit(5)
      .populate('user_id', 'full_name')
      .populate('course_id', 'title');
    
    // Get revenue stats
    const revenueStats = await Payment.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          averageOrderValue: { $avg: "$amount" },
          completedPayments: { $sum: 1 }
        }
      }
    ]);
    
    const revenue = revenueStats[0] || {
      totalRevenue: 0,
      averageOrderValue: 0,
      completedPayments: 0
    };
    
    res.json({
      totalUsers,
      totalCourses,
      totalPayments,
      totalEnrollments,
      revenue: {
        totalRevenue: revenue.totalRevenue,
        averageOrderValue: parseFloat(revenue.averageOrderValue.toFixed(2)),
        completedPayments: revenue.completedPayments
      },
      recentActivity: {
        recentUsers,
        recentCourses,
        recentPayments
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get admin dashboard analytics for a specific period
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchCondition = {};
    if (startDate || endDate) {
      matchCondition.created_at = {};
      if (startDate) matchCondition.created_at.$gte = new Date(startDate);
      if (endDate) matchCondition.created_at.$lte = new Date(endDate);
    }
    
    const [
      userGrowth,
      courseGrowth,
      paymentGrowth,
      enrollmentGrowth
    ] = await Promise.all([
      User.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Course.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Payment.aggregate([
        { $match: { ...matchCondition, status: 'completed' } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
            count: { $sum: 1 },
            revenue: { $sum: "$amount" }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);
    
    res.json({
      userGrowth,
      courseGrowth,
      paymentGrowth,
      enrollmentGrowth
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;