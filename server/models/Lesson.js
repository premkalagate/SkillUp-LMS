import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  video_url: { type: String },
  duration_minutes: { type: Number },
  course_id: { type: String, required: true, ref: 'Course' },
  order_index: { type: Number },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Lesson', lessonSchema);