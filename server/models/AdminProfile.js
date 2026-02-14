import mongoose from 'mongoose';

const adminProfileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, unique: true, ref: 'User' },
  full_name: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model('AdminProfile', adminProfileSchema);