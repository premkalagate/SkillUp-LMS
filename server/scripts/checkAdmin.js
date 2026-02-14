import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const checkAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillup';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check if admin user exists
    const admin = await User.findOne({ email: 'admin@test.com' });
    
    if (!admin) {
      console.log('❌ Admin user NOT FOUND');
      console.log('Email: admin@test.com');
      console.log('\nTo create the admin user, run:');
      console.log('  npm run create-admin\n');
    } else {
      console.log('✅ Admin user FOUND');
      console.log('Email:', admin.email);
      console.log('Full Name:', admin.full_name);
      console.log('Role:', admin.role);
      console.log('User ID:', admin.id);
      console.log('Created:', admin.created_at);
      
      if (admin.role !== 'admin') {
        console.log('\n⚠️  WARNING: User exists but role is NOT "admin"');
        console.log('Current role:', admin.role);
        console.log('\nTo fix this, run:');
        console.log('  npm run create-admin\n');
      } else {
        console.log('\n✅ Admin user is correctly configured!\n');
      }
    }

    // List all users with admin role
    const allAdmins = await User.find({ role: 'admin' });
    console.log(`\nTotal admin users in database: ${allAdmins.length}`);
    if (allAdmins.length > 0) {
      console.log('Admin users:');
      allAdmins.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.full_name})`);
      });
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking admin user:', error);
    process.exit(1);
  }
};

checkAdmin();
