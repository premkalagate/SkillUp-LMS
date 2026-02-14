import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  thumbnail_url: { type: String },
  price: { type: Number },
  category: { type: String },
  level: { type: String },
  duration_hours: { type: Number },
  instructor_id: { type: String, required: true },
  is_published: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model('Course', courseSchema);