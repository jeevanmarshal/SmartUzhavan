const mongoose = require('mongoose');
require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const User = require('../models/User');

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    // Check if super_admin already exists
    const adminExists = await User.findOne({ 
      $or: [
        { role: 'SUPER_ADMIN' },
        { role: 'ADMIN' },
        { username: 'jeevanadmin' },
        { email: 'admin@smartuzhavan.com' }
      ]
    });

    if (adminExists) {
      console.log('Admin account found. Resetting for V6 compatibility...');
      await User.deleteOne({ _id: adminExists._id });
    }

    console.log('Creating initial V6 super_admin user...');
    const superAdmin = new User({
      username: 'jeevanadmin',
      email: 'admin@smartuzhavan.com',
      phoneNumber: '9000000000',
      password: 'Password@123',
      firstName: 'Jeevan',
      lastName: 'Marshal',
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true
    });

    await superAdmin.save();
    console.log('✅ V6 Super admin created successfully!');
    console.log('Username: jeevanadmin');
    console.log('Email: admin@smartuzhavan.com');
    console.log('Phone: 9000000000');
    console.log('Password: Password@123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
