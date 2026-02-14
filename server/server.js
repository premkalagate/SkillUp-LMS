import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Increase body size limit to handle base64 images (50MB limit)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillup';
console.log('Attempting to connect to MongoDB at:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials in logs

// Set up connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB successfully');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

// Connect with better error handling
mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 10s
  socketTimeoutMS: 45000,
  // Additional options for Atlas connection
  ssl: true,
  tls: true,
  tlsInsecure: true, // This bypasses certificate validation (for development only)
  retryWrites: true,
  maxPoolSize: 10, // Maintain up to 10 socket connections
})
.then(() => {
  console.log('✅ MongoDB connection established');
})
.catch((error) => {
  console.error('❌ MongoDB connection failed:', error.message);
  console.error('\n📋 Troubleshooting steps:');
  console.error('1. Make sure MongoDB is installed and running');
  console.error('2. For local MongoDB: Check if the service is running');
  console.error('3. For Docker: Run "docker run -d -p 27017:27017 --name mongodb mongo"');
  console.error('4. For MongoDB Atlas: Check your connection string and network access');
  console.error('5. Verify MONGODB_URI in your .env file');
  console.error('6. Check if your IP address is whitelisted in MongoDB Atlas');
  console.error('\n⚠️  Server will continue but database operations will fail until MongoDB is connected.\n');
});

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import courseRoutes from './routes/courses.js';
import paymentRoutes from './routes/payments.js';
import couponRoutes from './routes/coupons.js';
import reviewRoutes from './routes/reviews.js';
import enrollmentRoutes from './routes/enrollments.js';
import lessonRoutes from './routes/lessons.js';
import lessonProgressRoutes from './routes/lessonProgress.js';
import certificateRoutes from './routes/certificates.js';
import adminRoutes from './routes/admin.js';
import razorpayRoutes from './routes/api/razorpay.js';

// Import database connection check middleware
import { checkDbConnection } from './middleware/checkDbConnection.js';

// Use routes (with database connection check for data routes)
app.use('/api/auth', authRoutes);
app.use('/api/users', checkDbConnection, userRoutes);
app.use('/api/courses', checkDbConnection, courseRoutes);
app.use('/api/payments', checkDbConnection, paymentRoutes);
app.use('/api/coupons', checkDbConnection, couponRoutes);
app.use('/api/reviews', checkDbConnection, reviewRoutes);
app.use('/api/enrollments', checkDbConnection, enrollmentRoutes);
app.use('/api/lessons', checkDbConnection, lessonRoutes);
app.use('/api/lesson-progress', checkDbConnection, lessonProgressRoutes);
app.use('/api/certificates', checkDbConnection, certificateRoutes);
app.use('/api/admin', checkDbConnection, adminRoutes);
app.use('/api/razorpay', checkDbConnection, razorpayRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({ 
    status: dbStatus === 1 ? 'OK' : 'WARNING',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStates[dbStatus] || 'unknown',
      readyState: dbStatus
    }
  });
});

// Test error endpoint to verify error handling
app.get('/api/test-error', (req, res, next) => {
  const testError = new Error('This is a test error message');
  testError.status = 500;
  next(testError);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error middleware caught:', err);
  console.error('Error message:', err?.message);
  console.error('Error name:', err?.name);
  console.error('Error stack:', err?.stack);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);
  console.error('Error type:', typeof err);
  console.error('Error keys:', err ? Object.keys(err) : 'No error object');
  
  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Always send the actual error message for debugging
  // Extract error message from various possible formats
  let errorMessage = 'Unknown error occurred';
  
  // Try multiple ways to extract error message
  if (err?.message) {
    errorMessage = err.message;
  } else if (err?.error && typeof err.error === 'string') {
    errorMessage = err.error;
  } else if (err?.toString && typeof err.toString === 'function') {
    const str = err.toString();
    if (str !== '[object Object]') {
      errorMessage = str;
    }
  } else if (typeof err === 'string') {
    errorMessage = err;
  }
  
  // If we still don't have a good message, try to stringify with all properties
  if (errorMessage === 'Unknown error occurred' && err) {
    try {
      const errorStr = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
      if (errorStr && errorStr !== '{}' && errorStr !== '[]') {
        errorMessage = errorStr.length < 500 ? errorStr : `Error: ${err.constructor?.name || 'Unknown'}`;
      } else {
        errorMessage = `Error: ${err.constructor?.name || 'Unknown'} - Check server logs for details`;
      }
    } catch (e) {
      errorMessage = String(err) || 'Unknown error occurred';
    }
  }
  
  // FORCE: Always show actual error for debugging
  const isProduction = process.env.NODE_ENV === 'production';
  const showError = true; // Set to false to hide errors in production
  
  if (isProduction && !showError) {
    console.error('Production error (not shown to client):', errorMessage);
    console.error('Full error object:', err);
  }
  
  res.status(err?.status || 500).json({ 
    error: (isProduction && !showError) ? 'Something went wrong!' : errorMessage,
    ...((!isProduction || showError) && { 
      details: err?.stack,
      originalError: err?.message,
      errorName: err?.name,
      errorCode: err?.code,
      errorType: typeof err,
      errorConstructor: err?.constructor?.name,
      fullError: err
    })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});