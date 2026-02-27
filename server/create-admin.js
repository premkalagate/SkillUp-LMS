import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import User model
import User from './models/User.js';

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the user by email
    const user = await User.findOne({ email: 'admin@test.com' });
    
    if (!user) {
      console.log('User not found. Creating admin user...');
      
      // Create admin user
      const adminUser = new User({
        id: 'admin_' + Date.now(),
        email: 'admin@test.com',
        password: 'test123',
        full_name: 'Admin User',
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully!');
    } else {
      // Update existing user to admin role
      user.role = 'admin';
      await user.save();
      console.log('✅ User updated to admin role successfully!');
    }
    
    console.log('Email: admin@test.com');
    console.log('Password: test123');
    console.log('Role: admin');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createAdminUser();
