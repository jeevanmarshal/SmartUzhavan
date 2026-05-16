const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const User = require('../models/User');
const Driver = require('../models/Driver');
const Farmer = require('../models/Farmer');
const HarvesterJob = require('../models/HarvesterJob');
const Rental = require('../models/Rental');
const Expense = require('../models/Expense');

const checkData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const counts = {
      users: await User.countDocuments({}),
      drivers: await Driver.countDocuments({}),
      farmers: await Farmer.countDocuments({}),
      jobs: await HarvesterJob.countDocuments({}),
      rentals: await Rental.countDocuments({}),
      expenses: await Expense.countDocuments({})
    };

    console.log('Data Counts:', counts);

    if (counts.users > 0) {
      const sampleUser = await User.findOne({ username: 'jeevanadmin' });
      console.log('Admin User:', JSON.stringify(sampleUser, null, 2));
    }

    if (counts.jobs > 0) {
      const sampleJob = await HarvesterJob.findOne({}).populate('farmer_id');
      console.log('Sample Job:', JSON.stringify(sampleJob, null, 2));
    }

    if (counts.farmers > 0) {
      const sampleFarmer = await Farmer.findOne({});
      console.log('Sample Farmer:', JSON.stringify(sampleFarmer, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking data:', error.message);
    process.exit(1);
  }
};

checkData();
