import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { full_name, avatar_url } = req.body;
    
    const user = await User.findOneAndUpdate(
      { id: userId },
      { 
        full_name,
        avatar_url,
        updated_at: new Date()
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (for admin)
router.get('/', async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const query = role ? { role } : {};
    
    const users = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ created_at: -1 });
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user role
router.get('/role/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ id: userId }, { role: 1 });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ role: user.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all user roles (for admin dashboard)
router.get('/roles', async (req, res) => {
  try {
    const users = await User.find({}, { role: 1, email: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;