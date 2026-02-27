import express from 'express';
import Settings from '../models/Settings.js';

const router = express.Router();

// Get platform settings
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = new Settings({
        platformName: 'SkillUp',
        platformEmail: 'support@skillup.com',
        maintenanceMode: false,
        registrationEnabled: true,
        instructorSignupEnabled: true,
        emailNotifications: true,
        paymentGateway: 'razorpay'
      });
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update platform settings
router.put('/', async (req, res) => {
  try {
    const updates = req.body;
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create settings if they don't exist
      settings = new Settings(updates);
    } else {
      // Update existing settings
      Object.assign(settings, updates);
      settings.updated_at = new Date();
    }
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset settings to defaults
router.post('/reset', async (req, res) => {
  try {
    await Settings.deleteMany({});
    
    const defaultSettings = new Settings({
      platformName: 'SkillUp',
      platformEmail: 'support@skillup.com',
      maintenanceMode: false,
      registrationEnabled: true,
      instructorSignupEnabled: true,
      emailNotifications: true,
      paymentGateway: 'razorpay'
    });
    
    await defaultSettings.save();
    res.json(defaultSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
