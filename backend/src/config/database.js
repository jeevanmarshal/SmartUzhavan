const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('./env');

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(config.mongodbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes
    if (config.nodeEnv !== 'test') {
      const createIndexes = require('../utils/createIndexes');
      await createIndexes();
    }
    
    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
