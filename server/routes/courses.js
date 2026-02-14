import express from 'express';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Review from '../models/Review.js';
import Enrollment from '../models/Enrollment.js';
import { populateUser } from '../utils/populateHelper.js';

const router = express.Router();

// Get all courses
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      instructorId, 
      instructor_id,
      isPublished, 
      is_published,
      page = 1, 
      limit = 10,
      sort 
    } = req.query;
    
    const query = {};
    
    // Handle both camelCase and snake_case parameter names
    if (category) query.category = category;
    if (instructorId) query.instructor_id = instructorId;
    if (instructor_id) query.instructor_id = instructor_id;
    
    // Handle is_published parameter (both formats)
    const publishedValue = isPublished !== undefined ? isPublished : is_published;
    if (publishedValue !== undefined) {
      query.is_published = publishedValue === 'true' || publishedValue === true;
    }
    
    // Build sort object
    let sortObj = { created_at: -1 }; // Default sort
    if (sort) {
      // Handle sort string like "-created_at" or "created_at"
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      sortObj = { [sortField]: sortOrder };
    }
    
    const limitNum = parseInt(limit) || 10;
    const pageNum = parseInt(page) || 1;
    
    const courses = await Course.find(query)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort(sortObj);
    
    // Get average ratings for each course
    const coursesWithRatings = await Promise.all(
      courses.map(async (course) => {
        // Calculate average rating for the course
        const ratingResult = await Review.aggregate([
          { $match: { course_id: course.id } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: "$rating" },
              totalReviews: { $sum: 1 }
            }
          }
        ]);
        
        const instructor = await populateUser(course.instructor_id, 'full_name avatar_url');
        
        return {
          ...course.toObject(),
          averageRating: ratingResult.length > 0 ? parseFloat(ratingResult[0].averageRating.toFixed(2)) : 0,
          totalReviews: ratingResult.length > 0 ? ratingResult[0].totalReviews : 0,
          instructor_name: instructor?.full_name,
          instructor_avatar_url: instructor?.avatar_url
        };
      })
    );
    
    const total = await Course.countDocuments(query);
    
    res.json({
      courses: coursesWithRatings,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch courses',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// IMPORTANT: Specific routes must come before dynamic routes like /:courseId

// Get featured/published courses
router.get('/featured', async (req, res) => {
  try {
    const courses = await Course.find({ is_published: true })
      .sort({ created_at: -1 })
      .limit(10);
    
    // Get average ratings and lessons count for each course
    const coursesWithRatings = await Promise.all(
      courses.map(async (course) => {
        // Calculate average rating for the course
        const ratingResult = await Review.aggregate([
          { $match: { course_id: course.id } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: "$rating" },
              totalReviews: { $sum: 1 }
            }
          }
        ]);
        
        // Get lessons count for the course
        const lessons = await Lesson.find({ course_id: course.id });
        
        const instructor = await populateUser(course.instructor_id, 'full_name avatar_url');
        
        return {
          ...course.toObject(),
          lessons_count: lessons.length,
          averageRating: ratingResult.length > 0 ? parseFloat(ratingResult[0].averageRating.toFixed(2)) : 0,
          totalReviews: ratingResult.length > 0 ? ratingResult[0].totalReviews : 0,
          instructor_name: instructor?.full_name,
          instructor_avatar_url: instructor?.avatar_url
        };
      })
    );
    
    res.json(coursesWithRatings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending courses (not published)
router.get('/pending', async (req, res) => {
  try {
    const courses = await Course.find({ is_published: false })
      .sort({ created_at: -1 });
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get courses by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const courses = await Course.find({ 
      category: category, 
      is_published: true 
    }).sort({ created_at: -1 });
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single course (must come after specific routes)
router.get('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findOne({ id: courseId });
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Calculate average rating for the course
    const ratingResult = await Review.aggregate([
      { $match: { course_id: course.id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);
    
    const instructor = await populateUser(course.instructor_id, 'full_name avatar_url');
    
    // Get lessons count for the course
    const lessons = await Lesson.find({ course_id: courseId });
    
    const courseWithRating = {
      ...course.toObject(),
      lessons_count: lessons.length,
      averageRating: ratingResult.length > 0 ? parseFloat(ratingResult[0].averageRating.toFixed(2)) : 0,
      totalReviews: ratingResult.length > 0 ? ratingResult[0].totalReviews : 0,
      instructor_name: instructor?.full_name,
      instructor_avatar_url: instructor?.avatar_url
    };
    
    res.json(courseWithRating);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get course lessons
router.get('/:courseId/lessons', async (req, res) => {
  try {
    const { courseId } = req.params;
    const lessons = await Lesson.find({ course_id: courseId }).sort({ order_index: 1 });
    
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new course
router.post('/', async (req, res) => {
  try {
    console.log('Creating course with data:', JSON.stringify(req.body, null, 2));
    const courseData = req.body;
    
    // Validate required fields
    if (!courseData.title || !courseData.title.trim()) {
      return res.status(400).json({ error: 'Course title is required' });
    }
    
    if (!courseData.instructor_id || !courseData.instructor_id.trim()) {
      return res.status(400).json({ error: 'Instructor ID is required' });
    }
    
    // Generate unique ID
    const crypto = await import('crypto');
    courseData.id = crypto.default.randomBytes(16).toString('hex');
    
    // Set default values
    if (courseData.price === undefined || courseData.price === null) {
      courseData.price = 0;
    }
    if (courseData.is_published === undefined) {
      courseData.is_published = false;
    }
    
    // Ensure dates are set
    courseData.created_at = new Date();
    courseData.updated_at = new Date();
    
    console.log('Course data before save:', JSON.stringify(courseData, null, 2));
    
    // Create course
    const course = new Course(courseData);
    await course.save();
    
    console.log('Course created successfully:', course.id);
    res.status(201).json(course);
  } catch (error) {
    console.error('❌ Error creating course:');
    console.error('Error object:', error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Error stack:', error?.stack);
    console.error('Error type:', typeof error);
    console.error('Error keys:', Object.keys(error || {}));
    
    // Handle validation errors
    if (error?.name === 'ValidationError') {
      const errors = Object.values(error.errors || {}).map((e) => e.message);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors
      });
    }
    
    // Handle duplicate key errors
    if (error?.code === 11000) {
      return res.status(400).json({ 
        error: 'Course with this ID already exists' 
      });
    }
    
    // Generic error - always include the actual error message
    const errorMessage = error?.message || error?.toString() || 'Failed to create course';
    console.error('Sending error response:', errorMessage);
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV !== 'production' ? error?.stack : undefined
    });
  }
});

// Update a course
router.put('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const courseData = req.body;
    
    const course = await Course.findOneAndUpdate(
      { id: courseId },
      { ...courseData, updated_at: new Date() },
      { new: true }
    );
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a course
router.delete('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Delete associated lessons first
    await Lesson.deleteMany({ course_id: courseId });
    
    // Then delete the course
    const result = await Course.deleteOne({ id: courseId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json({ message: 'Course and associated lessons deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish a course (approve for admin) - must come before /:courseId PUT
router.put('/:courseId/publish', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findOneAndUpdate(
      { id: courseId },
      { is_published: true, updated_at: new Date() },
      { new: true }
    );
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;