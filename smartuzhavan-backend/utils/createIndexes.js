const mongoose = require('mongoose');
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const AuditLog = require('../models/AuditLog');
const ChangeHistory = require('../models/ChangeHistory');

async function createIndexes() {
  try {
    console.log('Creating MongoDB indexes...');
    
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    
    try {
      await Farmer.collection.dropIndex('name_text');
      console.log('Dropped old text index on farmers collection.');
    } catch (err) {
      // Ignore if index does not exist
    }
    
    await Farmer.collection.createIndex({ name: 'text', village: 'text', phone: 'text' });
    
    await AuditLog.collection.createIndex({ userId: 1, timestamp: -1 });
    await AuditLog.collection.createIndex({ entity: 1, entityId: 1, timestamp: -1 });
    
    await ChangeHistory.collection.createIndex({ documentId: 1, version: -1 });
    
    console.log('✅ All indexes created');
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
}

module.exports = createIndexes;
