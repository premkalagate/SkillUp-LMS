import express from 'express';
import Certificate from '../models/Certificate.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import { populateUser, populateCourse } from '../utils/populateHelper.js';

const router = express.Router();

// Get all certificates for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const certificates = await Certificate.find({ user_id: userId })
      .sort({ issued_at: -1 });
    
    // Manually populate course data
    const certificatesWithData = await Promise.all(
      certificates.map(async (certificate) => {
        const course = await populateCourse(certificate.course_id, 'title thumbnail_url');
        return {
          ...certificate.toObject(),
          course_id: course
        };
      })
    );
    
    res.json(certificatesWithData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all certificates for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const certificates = await Certificate.find({ course_id: courseId })
      .sort({ issued_at: -1 });
    
    // Manually populate user data
    const certificatesWithData = await Promise.all(
      certificates.map(async (certificate) => {
        const user = await populateUser(certificate.user_id, 'full_name avatar_url');
        return {
          ...certificate.toObject(),
          user_id: user
        };
      })
    );
    
    res.json(certificatesWithData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific certificate
router.get('/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const certificate = await Certificate.findOne({ id: certificateId });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    // Manually populate user and course data
    const user = await populateUser(certificate.user_id, 'full_name avatar_url');
    const course = await populateCourse(certificate.course_id, 'title thumbnail_url');
    
    res.json({
      ...certificate.toObject(),
      user_id: user,
      course_id: course
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new certificate
router.post('/', async (req, res) => {
  try {
    const { user_id, course_id } = req.body;
    
    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({ 
      user_id, 
      course_id 
    });
    
    if (existingCertificate) {
      return res.status(400).json({ 
        error: 'Certificate already exists for this user and course' 
      });
    }
    
    // Generate a unique ID for the certificate
    const crypto = await import('crypto');
    const certificateId = crypto.default.randomBytes(16).toString('hex');
    const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const certificate = new Certificate({
      id: certificateId,
      user_id,
      course_id,
      certificate_number: certificateNumber,
      issued_at: new Date()
    });
    
    await certificate.save();
    
    // Manually populate user and course info for response
    const user = await populateUser(certificate.user_id, 'full_name avatar_url');
    const course = await populateCourse(certificate.course_id, 'title thumbnail_url');
    
    res.status(201).json({
      ...certificate.toObject(),
      user_id: user,
      course_id: course
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get certificate by certificate number
router.get('/number/:certificateNumber', async (req, res) => {
  try {
    const { certificateNumber } = req.params;
    const certificate = await Certificate.findOne({ certificate_number: certificateNumber });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    // Manually populate user and course data
    const user = await populateUser(certificate.user_id, 'full_name avatar_url');
    const course = await populateCourse(certificate.course_id, 'title thumbnail_url');
    
    res.json({
      ...certificate.toObject(),
      user_id: user,
      course_id: course
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a certificate
router.delete('/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    const result = await Certificate.deleteOne({ id: certificateId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;