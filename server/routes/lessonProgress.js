import express from 'express';
import LessonProgress from '../models/LessonProgress.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';

const router = express.Router();

// Get lesson progress for a user in a course
router.get('/user/:userId/course/:courseId', async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    
    const progress = await LessonProgress.find({ 
      user_id: userId, 
      course_id: courseId 
    });
    
    // Manually populate lesson details since we're using custom ID
    const populatedProgress = await Promise.all(progress.map(async (prog) => {
      const lesson = await Lesson.findOne({ id: prog.lesson_id });
      return {
        ...prog.toObject(),
        lesson_details: lesson ? { id: lesson.id, title: lesson.title, order_index: lesson.order_index } : null
      };
    }));
    
    res.json(populatedProgress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get progress for a specific lesson
router.get('/user/:userId/lesson/:lessonId', async (req, res) => {
  try {
    const { userId, lessonId } = req.params;
    
    const progress = await LessonProgress.findOne({ 
      user_id: userId, 
      lesson_id: lessonId 
    });
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update or create lesson progress
router.post('/', async (req, res) => {
  try {
    const { user_id, course_id, lesson_id, completed, progress_seconds } = req.body;
    
    // Validate that user is enrolled in the course
    const enrollment = await Enrollment.findOne({ 
      user_id, 
      course_id 
    });
    
    if (!enrollment) {
      return res.status(400).json({ 
        error: 'User is not enrolled in this course' 
      });
    }

    // Validate that lesson belongs to course
    const lesson = await Lesson.findOne({ 
      id: lesson_id, 
      course_id 
    });
    
    if (!lesson) {
      return res.status(400).json({ 
        error: 'Lesson does not belong to this course' 
      });
    }

    // Create a unique ID for the progress record
    const crypto = await import('crypto');
    const progressId = crypto.default.randomBytes(16).toString('hex');

    // Find existing progress or create new one
    let lessonProgress = await LessonProgress.findOne({ 
      user_id, 
      lesson_id 
    });

    if (lessonProgress) {
      // Update existing progress
      lessonProgress.completed = completed;
      lessonProgress.progress_seconds = progress_seconds || lessonProgress.progress_seconds;
      lessonProgress.updated_at = new Date();
      
      if (completed && !lessonProgress.completed_at) {
        lessonProgress.completed_at = new Date();
      }
      
      await lessonProgress.save();
    } else {
      // Create new progress record
      lessonProgress = new LessonProgress({
        id: progressId,
        user_id,
        course_id,
        lesson_id,
        completed,
        progress_seconds: progress_seconds || 0,
        updated_at: new Date()
      });
      
      if (completed) {
        lessonProgress.completed_at = new Date();
      }
      
      await lessonProgress.save();
    }

    res.json(lessonProgress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark lesson as completed
router.put('/complete/:lessonProgressId', async (req, res) => {
  try {
    const { lessonProgressId } = req.params;
    
    const lessonProgress = await LessonProgress.findOneAndUpdate(
      { id: lessonProgressId },
      { 
        completed: true,
        completed_at: new Date(),
        updated_at: new Date()
      },
      { new: true }
    );

    if (!lessonProgress) {
      return res.status(404).json({ error: 'Lesson progress not found' });
    }

    res.json(lessonProgress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch update progress for multiple lessons
router.put('/batch-update', async (req, res) => {
  try {
    const { userId, courseId, progresses } = req.body;
    
    // Validate input
    if (!Array.isArray(progresses)) {
      return res.status(400).json({ error: 'Progresses must be an array' });
    }

    const results = [];
    for (const progress of progresses) {
      const { lesson_id, completed, progress_seconds } = progress;
      
      const result = await LessonProgress.findOneAndUpdate(
        { user_id: userId, lesson_id },
        { 
          completed,
          progress_seconds: progress_seconds || 0,
          updated_at: new Date(),
          ...(completed ? { completed_at: new Date() } : {})
        },
        { upsert: true, new: true }
      );
      
      // Manually populate lesson details
      const lesson = await Lesson.findOne({ id: result.lesson_id });
      const populatedResult = {
        ...result.toObject(),
        lesson_details: lesson ? { id: lesson.id, title: lesson.title, order_index: lesson.order_index } : null
      };
      
      results.push(populatedResult);
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;