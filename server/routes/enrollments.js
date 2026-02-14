import express from 'express';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Certificate from '../models/Certificate.js';
import { populateUser, populateCourse } from '../utils/populateHelper.js';

const router = express.Router();

// Get all enrollments for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const enrollments = await Enrollment.find({ user_id: userId })
      .sort({ enrolled_at: -1 });
    
    // Manually populate course data
    const enrollmentsWithData = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Always include the original course_id string for reference matching
        const originalCourseId = enrollment.course_id;
        const course = await populateCourse(enrollment.course_id, 'id title thumbnail_url price');
        
        // If course was found and populated, merge it with the original course_id
        // This ensures we always have the course_id available for matching
        if (course) {
          return {
            ...enrollment.toObject(),
            course_id: {
              ...course,
              // Ensure id is always present
              id: course.id || originalCourseId
            },
            // Also keep original course_id as a separate field for easier access
            original_course_id: originalCourseId
          };
        } else {
          // If course not found, return enrollment with original course_id as string
          return {
            ...enrollment.toObject(),
            course_id: originalCourseId,
            original_course_id: originalCourseId
          };
        }
      })
    );
    
    res.json(enrollmentsWithData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all enrollments for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const enrollments = await Enrollment.find({ course_id: courseId })
      .sort({ enrolled_at: -1 });
    
    // Manually populate user data
    const enrollmentsWithData = await Promise.all(
      enrollments.map(async (enrollment) => {
        const user = await populateUser(enrollment.user_id, 'full_name avatar_url email');
        return {
          ...enrollment.toObject(),
          user_id: user
        };
      })
    );
    
    res.json(enrollmentsWithData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get enrollment by ID
router.get('/:enrollmentId', async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const enrollment = await Enrollment.findOne({ id: enrollmentId });
    
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    
    // Manually populate user and course data
    const user = await populateUser(enrollment.user_id, 'full_name avatar_url');
    const course = await populateCourse(enrollment.course_id, 'title thumbnail_url');
    
    res.json({
      ...enrollment.toObject(),
      user_id: user,
      course_id: course
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new enrollment
router.post('/', async (req, res) => {
  try {
    const { user_id, course_id } = req.body;
    
    // Check if user is already enrolled in this course
    const existingEnrollment = await Enrollment.findOne({ 
      user_id, 
      course_id 
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ 
        error: 'User is already enrolled in this course' 
      });
    }
    
    // Generate a unique ID for the enrollment
    const crypto = await import('crypto');
    const enrollmentId = crypto.default.randomBytes(16).toString('hex');
    
    const enrollment = new Enrollment({
      id: enrollmentId,
      user_id,
      course_id,
      enrolled_at: new Date()
    });
    
    await enrollment.save();
    
    // Manually populate user and course info for response
    const user = await populateUser(enrollment.user_id, 'full_name avatar_url');
    const course = await populateCourse(enrollment.course_id, 'title thumbnail_url');
    
    res.status(201).json({
      ...enrollment.toObject(),
      user_id: user,
      course_id: course
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark enrollment as completed
router.put('/:enrollmentId/complete', async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    
    const enrollment = await Enrollment.findOneAndUpdate(
      { id: enrollmentId },
      { completed_at: new Date() },
      { new: true }
    );
    
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    
    // Manually populate user and course data
    const user = await populateUser(enrollment.user_id, 'full_name avatar_url');
    const course = await populateCourse(enrollment.course_id, 'title thumbnail_url');
    
    // Create a certificate if it doesn't exist
    const existingCertificate = await Certificate.findOne({
      user_id: enrollment.user_id,
      course_id: enrollment.course_id
    });
    
    if (!existingCertificate) {
      const crypto = await import('crypto');
      const certificateId = crypto.default.randomBytes(16).toString('hex');
      const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const certificate = new Certificate({
        id: certificateId,
        user_id: enrollment.user_id,
        course_id: enrollment.course_id,
        certificate_number: certificateNumber,
        issued_at: new Date()
      });
      
      await certificate.save();
    }
    
    res.json({
      ...enrollment.toObject(),
      user_id: user,
      course_id: course
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an enrollment
router.delete('/:enrollmentId', async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    
    const result = await Enrollment.deleteOne({ id: enrollmentId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    
    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get enrollment count for a course
router.get('/course/:courseId/count', async (req, res) => {
  try {
    const { courseId } = req.params;
    const count = await Enrollment.countDocuments({ course_id: courseId });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get enrollment count for a user
router.get('/user/:userId/count', async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await Enrollment.countDocuments({ user_id: userId });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;