import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, ref: 'User' },
  course_id: { type: String, required: true, ref: 'Course' },
  certificate_number: { type: String, required: true, unique: true },
  issued_at: { type: Date, default: Date.now }
});

export default mongoose.model('Certificate', certificateSchema);