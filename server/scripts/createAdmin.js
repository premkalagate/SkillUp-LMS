import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import crypto from 'crypto';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillup';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@test.com' });
    
    if (existingAdmin) {
      // Update existing admin
      existingAdmin.password = 'test123'; // Will be hashed by pre-save hook
      existingAdmin.role = 'admin';
      existingAdmin.full_name = 'Admin User';
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully!');
      console.log('Email: admin@test.com');
      console.log('Password: test123');
    } else {
      // Create new admin
      const adminId = crypto.randomBytes(16).toString('hex');
      const admin = new User({
        id: adminId,
        email: 'admin@test.com',
        password: 'test123', // Will be hashed by pre-save hook
        full_name: 'Admin User',
        role: 'admin'
      });

      await admin.save();
      console.log('✅ Admin user created successfully!');
      console.log('Email: admin@test.com');
      console.log('Password: test123');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
