import mongoose from 'mongoose';

const lessonProgressSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, ref: 'User' },
  course_id: { type: String, required: true, ref: 'Course' },
  lesson_id: { type: String, required: true, ref: 'Lesson' },
  completed: { type: Boolean, default: false },
  completed_at: { type: Date },
  progress_seconds: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model('LessonProgress', lessonProgressSchema);