const mongoose = require('mongoose');
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const AuditLog = require('../models/AuditLog');
const ChangeHistory = require('../models/ChangeHistory');
const Driver = require('../models/Driver');
const Worker = require('../models/Worker');
const Expense = require('../models/Expense');
const HarvesterJob = require('../models/HarvesterJob');
const Rental = require('../models/Rental');
const FinanceLending = require('../models/FinanceLending');
const OwnFarmIncome = require('../models/OwnFarmIncome');
const DriverLog = require('../models/DriverLog');
const WorkerRecord = require('../models/WorkerRecord');
const Settings = require('../models/Settings');

async function createIndexes() {
  try {
    console.log('Creating MongoDB indexes...');
    
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    
    try {
      await Farmer.collection.dropIndex('name_text');
    } catch (err) {
      // Ignore if index does not exist
    }
    await Farmer.collection.createIndex({ name: 'text', village: 'text', phone: 'text' });
    
    await AuditLog.collection.createIndex({ userId: 1, timestamp: -1 });
    await AuditLog.collection.createIndex({ entity: 1, entityId: 1, timestamp: -1 });
    await ChangeHistory.collection.createIndex({ documentId: 1, version: -1 });
    
    // Sync all indexes defined in Mongoose schemas for V5 models
    await Promise.all([
      Driver.syncIndexes(),
      Worker.syncIndexes(),
      Expense.syncIndexes(),
      HarvesterJob.syncIndexes(),
      Rental.syncIndexes(),
      FinanceLending.syncIndexes(),
      OwnFarmIncome.syncIndexes(),
      DriverLog.syncIndexes(),
      WorkerRecord.syncIndexes(),
      Settings.syncIndexes()
    ]);
    
    console.log('✅ All indexes created and synced');
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
}

module.exports = createIndexes;
