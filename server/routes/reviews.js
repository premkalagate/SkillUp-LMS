import express from 'express';
import Review from '../models/Review.js';
import Course from '../models/Course.js';
import { populateUser, populateCourse } from '../utils/populateHelper.js';

const router = express.Router();

// Get all reviews for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const reviews = await Review.find({ course_id: courseId })
      .sort({ created_at: -1 });
    
    // Manually populate user data
    const reviewsWithData = await Promise.all(
      reviews.map(async (review) => {
        const user = await populateUser(review.user_id, 'full_name avatar_url');
        return {
          ...review.toObject(),
          user_id: user
        };
      })
    );
    
    res.json(reviewsWithData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all reviews by a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await Review.find({ user_id: userId })
      .sort({ created_at: -1 });
    
    // Manually populate course data
    const reviewsWithData = await Promise.all(
      reviews.map(async (review) => {
        const course = await populateCourse(review.course_id, 'title thumbnail_url');
        return {
          ...review.toObject(),
          course_id: course
        };
      })
    );
    
    res.json(reviewsWithData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific review
router.get('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findOne({ id: reviewId });
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Manually populate user and course data
    const user = await populateUser(review.user_id, 'full_name avatar_url');
    const course = await populateCourse(review.course_id, 'title thumbnail_url');
    
    res.json({
      ...review.toObject(),
      user_id: user,
      course_id: course
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new review
router.post('/', async (req, res) => {
  try {
    const { user_id, course_id, rating, review_text } = req.body;
    
    // Check if user already reviewed this course
    const existingReview = await Review.findOne({ 
      user_id, 
      course_id 
    });
    
    if (existingReview) {
      return res.status(400).json({ 
        error: 'User has already reviewed this course' 
      });
    }
    
    // Generate a unique ID for the review
    const crypto = await import('crypto');
    const reviewId = crypto.default.randomBytes(16).toString('hex');
    
    const review = new Review({
      id: reviewId,
      user_id,
      course_id,
      rating,
      review_text,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    await review.save();
    
    // Manually populate user and course info for response
    const user = await populateUser(review.user_id, 'full_name avatar_url');
    const course = await populateCourse(review.course_id, 'title thumbnail_url');
    
    res.status(201).json({
      ...review.toObject(),
      user_id: user,
      course_id: course
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a review
router.put('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, review_text } = req.body;
    
    const review = await Review.findOneAndUpdate(
      { id: reviewId },
      { 
        rating,
        review_text,
        updated_at: new Date()
      },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Manually populate user and course data
    const user = await populateUser(review.user_id, 'full_name avatar_url');
    const course = await populateCourse(review.course_id, 'title thumbnail_url');
    
    res.json({
      ...review.toObject(),
      user_id: user,
      course_id: course
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a review
router.delete('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const result = await Review.deleteOne({ id: reviewId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get average rating for a course
router.get('/course/:courseId/average', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const result = await Review.aggregate([
      { $match: { course_id: courseId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);
    
    if (result.length > 0) {
      res.json({
        averageRating: parseFloat(result[0].averageRating.toFixed(2)),
        totalReviews: result[0].totalReviews
      });
    } else {
      res.json({
        averageRating: 0,
        totalReviews: 0
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;