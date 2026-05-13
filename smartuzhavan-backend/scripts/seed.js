const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Farmer = require('../models/Farmer');
const path = require('path');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Force Google DNS to resolve Atlas SRV records
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 1. Create Default Admin
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        email: 'admin@smartuzhavan.com',
        password: 'password123',
        role: 'super_admin'
      });
      await admin.save();
      console.log('✅ Default Admin created: admin / password123');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // 2. Create Sample Drivers
    const driverCount = await Driver.countDocuments();
    if (driverCount === 0) {
      const sampleDrivers = [
        { name: 'Arun Kumar', phone: '9876543210', pin: '1234', active: true },
        { name: 'Muthu Vellai', phone: '9876543211', pin: '1111', active: true }
      ];
      // Note: PINs will be hashed by the pre-save hook in Driver model
      await Driver.insertMany(sampleDrivers);
      console.log('✅ Sample Drivers created');
    }

    // 3. Create Sample Farmers
    const farmerCount = await Farmer.countDocuments();
    if (farmerCount === 0) {
      const sampleFarmers = [
        { name: 'Sivalingam', phone: '9000000001', village: 'Kudavasal' },
        { name: 'Rajendran', phone: '9000000002', village: 'Nannilam' }
      ];
      await Farmer.insertMany(sampleFarmers);
      console.log('✅ Sample Farmers created');
    }

    console.log('✨ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
