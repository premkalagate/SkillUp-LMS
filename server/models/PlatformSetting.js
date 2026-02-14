import mongoose from 'mongoose';

const platformSettingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  setting_key: { type: String, required: true, unique: true },
  setting_value: { type: mongoose.Schema.Types.Mixed, required: true },
  updated_at: { type: Date, default: Date.now },
  updated_by: { type: String, ref: 'User' }
});

export default mongoose.model('PlatformSetting', platformSettingSchema);