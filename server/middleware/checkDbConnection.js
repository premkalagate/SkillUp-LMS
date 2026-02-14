// Middleware to check if MongoDB is connected before processing requests
import mongoose from 'mongoose';

export const checkDbConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      error: 'Database not connected',
      message: 'MongoDB is not connected. Please check your database connection and try again.',
      readyState: mongoose.connection.readyState,
      states: {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      }
    });
  }
  next();
};
