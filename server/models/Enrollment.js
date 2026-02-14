import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, ref: 'User' },
  course_id: { type: String, required: true, ref: 'Course' },
  enrolled_at: { type: Date, default: Date.now },
  completed_at: { type: Date }
});

export default mongoose.model('Enrollment', enrollmentSchema);