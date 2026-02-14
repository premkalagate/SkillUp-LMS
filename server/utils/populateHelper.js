// Helper functions to manually populate references since we're using string IDs instead of ObjectIds

import User from '../models/User.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';

/**
 * Manually populate user reference
 */
export const populateUser = async (userId, fields = 'full_name avatar_url email') => {
  if (!userId) return null;
  const user = await User.findOne({ id: userId });
  if (!user) return null;
  
  const fieldArray = fields.split(' ');
  const populated = {};
  fieldArray.forEach(field => {
    if (user[field] !== undefined) {
      populated[field] = user[field];
    }
  });
  return populated;
};

/**
 * Manually populate course reference
 */
export const populateCourse = async (courseId, fields = 'id title thumbnail_url price') => {
  if (!courseId) return null;
  const course = await Course.findOne({ id: courseId });
  if (!course) return null;
  
  const fieldArray = fields.split(' ');
  const populated = {};
  fieldArray.forEach(field => {
    if (course[field] !== undefined) {
      populated[field] = course[field];
    }
  });
  // Always include id field for reference matching
  if (!populated.id && course.id) {
    populated.id = course.id;
  }
  return populated;
};

/**
 * Manually populate lesson reference
 */
export const populateLesson = async (lessonId, fields = 'title description video_url') => {
  if (!lessonId) return null;
  const lesson = await Lesson.findOne({ id: lessonId });
  if (!lesson) return null;
  
  const fieldArray = fields.split(' ');
  const populated = {};
  fieldArray.forEach(field => {
    if (lesson[field] !== undefined) {
      populated[field] = lesson[field];
    }
  });
  return populated;
};

/**
 * Populate multiple user references in an array
 */
export const populateUsers = async (userIds, fields = 'full_name avatar_url email') => {
  if (!userIds || userIds.length === 0) return [];
  const users = await User.find({ id: { $in: userIds } });
  
  const fieldArray = fields.split(' ');
  return users.map(user => {
    const populated = {};
    fieldArray.forEach(field => {
      if (user[field] !== undefined) {
        populated[field] = user[field];
      }
    });
    return populated;
  });
};

/**
 * Populate multiple course references in an array
 */
export const populateCourses = async (courseIds, fields = 'title thumbnail_url price') => {
  if (!courseIds || courseIds.length === 0) return [];
  const courses = await Course.find({ id: { $in: courseIds } });
  
  const fieldArray = fields.split(' ');
  return courses.map(course => {
    const populated = {};
    fieldArray.forEach(field => {
      if (course[field] !== undefined) {
        populated[field] = course[field];
      }
    });
    return populated;
  });
};
