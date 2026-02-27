import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  platformName: { type: String, default: 'SkillUp' },
  platformEmail: { type: String, default: 'support@skillup.com' },
  maintenanceMode: { type: Boolean, default: false },
  registrationEnabled: { type: Boolean, default: true },
  instructorSignupEnabled: { type: Boolean, default: true },
  emailNotifications: { type: Boolean, default: true },
  paymentGateway: { type: String, default: 'razorpay' },
  razorpayKeyId: { type: String },
  razorpayKeySecret: { type: String },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.pre('save', async function() {
  const count = await this.constructor.countDocuments();
  if (count > 0) {
    throw new Error('Only one settings document is allowed');
  }
});

export default mongoose.model('Settings', settingsSchema);
