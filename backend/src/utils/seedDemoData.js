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
    console.log('Connecting to MongoDB for full demo seeding...');
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

    console.log('Seeding Settings...');
    await Settings.insertMany([
      {
        key: 'harvester_prices',
        type: 'prices',
        category: 'machinery',
        value: { track: 2500, wheel: 2200 },
        description: 'Standard harvesting rates per hour',
        lastUpdatedBy: adminId
      },
      {
        key: 'rental_prices',
        type: 'prices',
        category: 'machinery',
        value: { tiller: 500, rotavator: 300 },
        description: 'Machinery rental rates',
        lastUpdatedBy: adminId
      }
    ]);

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

    console.log('Seeding Harvester Jobs...');
    await HarvesterJob.insertMany([
      {
        farmer_id: farmers[0]._id,
        equipment: 'Track Harvester',
        location: 'Kunnathur East',
        area: 2.5,
        startDate: new Date('2024-05-01'),
        status: 'completed',
        billId: 'HB-001',
        totalHours: 4.5,
        finalAmount: 11000,
        userId: adminId,
        payments: [{ amount: 11000, date: new Date('2024-05-01'), method: 'cash' }]
      }
    ]);

    console.log('Seeding Rentals...');
    await Rental.insertMany([
      {
        farmer_id: farmers[0]._id,
        equipment: 'Power Tiller',
        startDate: new Date(),
        ratePerHour: 500,
        totalAmount: 2500,
        hours: 5,
        status: 'completed',
        createdBy: adminId,
        payments: [{ amount: 2500, date: new Date(), method: 'upi' }]
      }
    ]);

    console.log('Seeding Expenses...');
    await Expense.insertMany([
      { type: 'business', category: 'Diesel', amount: 5000, date: new Date(), description: 'Diesel for Track', userId: adminId },
      { type: 'business', category: 'Maintenance', amount: 1200, date: new Date(), description: 'Oil change', userId: adminId }
    ]);

    console.log('Seeding Finance Records...');
    await Finance.insertMany([
      { userId: adminId, type: 'income', category: 'Harvester', amount: 11000, date: new Date('2024-05-01'), description: 'Job HB-001 Payment' },
      { userId: adminId, type: 'expense', category: 'Diesel', amount: 5000, date: new Date(), description: 'Bulk Diesel Purchase' }
    ]);

    console.log('Seeding Own Farm Income...');
    await OwnFarmIncome.insertMany([
      { type: 'paddy', quantity: 1000, price_per_unit: 25, total_amount: 25000, date: new Date(), notes: 'Sample paddy harvest', createdBy: adminId },
      { type: 'straw', quantity: 50, price_per_unit: 100, total_amount: 5000, date: new Date(), notes: 'Sample straw sale', createdBy: adminId }
    ]);

    console.log('Seeding Workers...');
    const workers = await Worker.insertMany([
      { name: 'Karthik', phone: '9000011111', village: 'Perundurai', active: true, createdBy: adminId }
    ]);

    console.log('Seeding Worker Records...');
    await WorkerRecord.insertMany([
      {
        worker_id: workers[0]._id,
        date: new Date(),
        work_type: 'Cleaning',
        units: 1,
        rate_per_unit: 500,
        total_amount: 500,
        baseSalary: 500,
        status: 'paid',
        createdBy: adminId
      }
    ]);

    console.log('✅ Full Demo data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo data:', error.message);
    process.exit(1);
  }
};

seedDemoData();
