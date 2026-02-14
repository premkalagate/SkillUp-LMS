import express from 'express';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';

const router = express.Router();

// Get all lessons for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const lessons = await Lesson.find({ course_id: courseId })
      .sort({ order_index: 1 });
    
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific lesson
router.get('/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findOne({ id: lessonId });
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new lesson
router.post('/', async (req, res) => {
  try {
    const lessonData = req.body;
    
    // Generate a unique ID for the lesson
    const crypto = await import('crypto');
    const lessonId = crypto.default.randomBytes(16).toString('hex');
    
    const lesson = new Lesson({
      ...lessonData,
      id: lessonId,
      created_at: new Date()
    });
    
    await lesson.save();
    
    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a lesson
router.put('/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lessonData = req.body;
    
    const lesson = await Lesson.findOneAndUpdate(
      { id: lessonId },
      { ...lessonData, created_at: new Date() },
      { new: true }
    );
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a lesson
router.delete('/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    const result = await Lesson.deleteOne({ id: lessonId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all lessons for a course
router.delete('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Delete all lessons associated with the course
    const result = await Lesson.deleteMany({ course_id: courseId });
    
    res.json({ message: `Deleted ${result.deletedCount} lessons for course ${courseId}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder lessons in a course
router.put('/course/:courseId/reorder', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lessons } = req.body; // Array of { lessonId, orderIndex }
    
    if (!Array.isArray(lessons)) {
      return res.status(400).json({ error: 'Lessons must be an array' });
    }
    
    // Update each lesson's order_index
    const updates = lessons.map(lesson => 
      Lesson.updateOne(
        { id: lesson.lessonId, course_id: courseId },
        { order_index: lesson.orderIndex }
      )
    );
    
    await Promise.all(updates);
    
    // Return the updated lessons
    const updatedLessons = await Lesson.find({ course_id: courseId })
      .sort({ order_index: 1 });
    
    res.json(updatedLessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;