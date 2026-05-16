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
const Worker = require('../models/Worker');
const WorkerRecord = require('../models/WorkerRecord');
const Finance = require('../models/Finance');
const OwnFarmIncome = require('../models/OwnFarmIncome');
const Settings = require('../models/Settings');

const seedDemoData = async () => {
  try {
    console.log('Connecting to MongoDB for unified demo seeding...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    console.log('Cleaning existing demo data...');
    await Promise.all([
      User.deleteMany({ username: { $ne: 'jeevanadmin' } }),
      Driver.deleteMany({}),
      Farmer.deleteMany({}),
      HarvesterJob.deleteMany({}),
      Rental.deleteMany({}),
      Expense.deleteMany({}),
      Worker.deleteMany({}),
      WorkerRecord.deleteMany({}),
      Finance.deleteMany({}),
      OwnFarmIncome.deleteMany({}),
      Settings.deleteMany({})
    ]);

    let admin = await User.findOne({ username: 'jeevanadmin' });
    if (!admin) {
      console.log('Creating Admin...');
      admin = new User({
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
      await admin.save();
    }
    const adminId = admin._id;

    console.log('Seeding Unified Pricing Settings...');
    await Settings.create({
      key: 'pricing',
      type: 'configs',
      category: 'general',
      value: {
        harvester: {
          tyre_standard: 2200,
          tyre_wet_field: 2500,
          track: 2500
        },
        rental: {
          tractor: 800,
          plough_tractor: 1200,
          trailer: 500
        },
        diesel: {
          pricePerLitre: 95
        }
      },
      description: 'Unified pricing configuration for the whole system',
      lastUpdatedBy: adminId
    });

    console.log('Seeding Drivers...');
    const drivers = await Driver.insertMany([
      { name: 'Arjun Kumar', phone: '9876543210', village: 'Perundurai', pin: '1234', baseRate: 500, createdBy: adminId },
      { name: 'Senthil Raj', phone: '9876543211', village: 'Erode', pin: '5678', baseRate: 450, createdBy: adminId }
    ]);

    console.log('Seeding Farmers...');
    const farmers = await Farmer.insertMany([
      { name: 'Ramasamy', phone: '9443322110', village: 'Kunnathur', landArea: 5.5, crops: ['Paddy'], soilType: 'black soil', createdBy: adminId },
      { name: 'Palanisamy', phone: '9443322111', village: 'Chennimalai', landArea: 3.2, crops: ['Turmeric'], soilType: 'red soil', createdBy: adminId }
    ]);

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    console.log('Seeding Harvester Jobs (Current Month)...');
    await HarvesterJob.insertMany([
      {
        farmer_id: farmers[0]._id,
        equipment: 'Track Harvester',
        location: 'Kunnathur East',
        area: 2.5,
        startDate: yesterday,
        status: 'completed',
        billId: 'HB-001',
        totalHours: 4.5,
        finalAmount: 11000,
        userId: adminId,
        payments: [{ amount: 11000, date: yesterday, method: 'cash' }]
      },
      {
        farmer_id: farmers[1]._id,
        equipment: 'Wheel Harvester',
        location: 'Chennimalai North',
        area: 1.5,
        startDate: today,
        status: 'in-progress',
        billId: 'HB-002',
        totalHours: 2.0,
        finalAmount: 4400,
        userId: adminId,
        payments: []
      }
    ]);

    console.log('Seeding Rentals (Current Month)...');
    await Rental.insertMany([
      {
        farmer_id: farmers[0]._id,
        equipment: 'Power Tiller',
        startDate: today,
        ratePerHour: 500,
        totalAmount: 2500,
        hours: 5,
        status: 'completed',
        createdBy: adminId,
        payments: [{ amount: 2500, date: today, method: 'upi' }]
      }
    ]);

    console.log('Seeding Expenses (Current Month)...');
    await Expense.insertMany([
      { type: 'business', category: 'Diesel', amount: 5000, date: today, description: 'Diesel for Track', userId: adminId },
      { type: 'business', category: 'Maintenance', amount: 1200, date: yesterday, description: 'Oil change', userId: adminId }
    ]);

    console.log('Seeding Finance Records (Current Month)...');
    await Finance.insertMany([
      { userId: adminId, type: 'income', category: 'Harvester', amount: 11000, date: yesterday, description: 'Job HB-001 Payment' },
      { userId: adminId, type: 'expense', category: 'Diesel', amount: 5000, date: today, description: 'Bulk Diesel Purchase' }
    ]);

    console.log('Seeding Own Farm Income (Current Month)...');
    await OwnFarmIncome.insertMany([
      { type: 'paddy', quantity: 1000, price_per_unit: 25, total_amount: 25000, date: today, notes: 'Sample paddy harvest', createdBy: adminId },
      { type: 'straw', quantity: 50, price_per_unit: 100, total_amount: 5000, date: yesterday, notes: 'Sample straw sale', createdBy: adminId }
    ]);

    console.log('Seeding Workers...');
    const workers = await Worker.insertMany([
      { name: 'Karthik', phone: '9000011111', village: 'Perundurai', active: true, createdBy: adminId }
    ]);

    console.log('Seeding Worker Records (Current Month)...');
    await WorkerRecord.insertMany([
      {
        worker_id: workers[0]._id,
        date: today,
        work_type: 'Cleaning',
        units: 1,
        rate_per_unit: 500,
        total_amount: 500,
        baseSalary: 500,
        status: 'paid',
        createdBy: adminId
      }
    ]);

    console.log('✅ Unified Demo data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo data:', error.message);
    process.exit(1);
  }
};

seedDemoData();
