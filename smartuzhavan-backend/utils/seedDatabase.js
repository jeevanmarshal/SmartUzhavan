const mongoose = require('mongoose');
require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const User = require('../models/User');

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    // Check if super_admin already exists
    const adminExists = await User.findOne({ role: 'super_admin' });
    if (adminExists) {
      console.log('Super admin already exists. No need to seed.');
      process.exit(0);
    }

    console.log('Creating initial super_admin user...');
    const superAdmin = new User({
      username: 'jeevanadmin',
      email: 'admin@smartuzhavan.com',
      password: 'Password@123',
      role: 'super_admin'
    });

    await superAdmin.save();
    console.log('✅ Super admin created successfully!');
    console.log('Username: jeevanadmin');
    console.log('Password: Password@123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
