import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    const adminExists = await Admin.findOne({ username: 'admin' });
    
    if (adminExists) {
      console.log('✅ Admin already exists');
      console.log('📋 Credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      process.exit(0);
    }

    // Create admin
    const admin = new Admin({
      username: 'admin',
      password: 'admin123'
    });

    await admin.save();
    console.log('✅ Admin created successfully!');
    console.log('📋 Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();