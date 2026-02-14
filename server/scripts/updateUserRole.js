import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const updateUserRole = async () => {
  try {
    // Get email from command line arguments or use default
    const email = process.argv[2] || 'test@test.com';
    const role = process.argv[3] || 'admin';

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillup';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User NOT FOUND with email: ${email}`);
      console.log('\nAvailable users:');
      const allUsers = await User.find({}).select('email full_name role').limit(10);
      allUsers.forEach((u, index) => {
        console.log(`  ${index + 1}. ${u.email} (${u.full_name}) - Role: ${u.role}`);
      });
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('📋 Current user info:');
    console.log('  Email:', user.email);
    console.log('  Full Name:', user.full_name);
    console.log('  Current Role:', user.role);
    console.log('  User ID:', user.id);
    console.log('');

    // Update the role
    user.role = role;
    await user.save();

    console.log(`✅ User role updated successfully!`);
    console.log(`  Email: ${user.email}`);
    console.log(`  New Role: ${user.role}`);
    console.log('');

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    process.exit(1);
  }
};

updateUserRole();
