const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Farmer name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name must not exceed 100 characters'],
    index: 'text'
  },
  
  phone: {
    type: String,
    trim: true,
    match: [/^(\+91)?[6-9]\d{9}$/, 'Please provide a valid Indian phone number']
  },
  
  village: {
    type: String,
    required: [true, 'Village name is required'],
    trim: true,
    minlength: [2, 'Village name must be at least 2 characters'],
    maxlength: [50, 'Village name must not exceed 50 characters'],
    index: true
  },
  
  landArea: {
    type: Number,
    default: 1.0,
    min: [0.01, 'Land area must be greater than 0'],
    set: (val) => Math.round(val * 100) / 100
  },
  
  crops: {
    type: [String],
    default: [],
    index: true
  },
  
  soilType: {
    type: String,
    enum: {
      values: ['black soil', 'red soil', 'loamy soil', 'clay soil', 'alluvial soil', 'laterite soil', 'other'],
      message: 'Invalid soil type'
    },
    default: 'other'
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  
  farmerId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    index: true
  },
  
  description: {
    type: String,
    trim: true,
    default: ''
  }
});

// Create text indexes
farmerSchema.index({ name: 'text', village: 'text', phone: 'text', farmerId: 'text' });

// Exclude deleted from queries
farmerSchema.pre(/^find/, function(next) {
  if (this.options._recursed) return next();
  this.find({ isDeleted: false });
  next();
});

// Pre-save hook to automatically generate farmerId
farmerSchema.pre('save', async function(next) {
  if (!this.farmerId) {
    try {
      // 1. Get first three letters of uppercase village name, clean any special characters
      const cleanedVillage = (this.village || '').trim().replace(/[^a-zA-Z]/g, '').toUpperCase();
      const prefix = cleanedVillage.substring(0, 3).padEnd(3, 'X');
      const searchPattern = new RegExp(`^F-${prefix}-\\d{3}$`);

      // 2. Query the DB to find the highest existing suffix for this pattern
      const highestFarmer = await this.constructor.findOne(
        { farmerId: searchPattern },
        { farmerId: 1 },
        { sort: { farmerId: -1 } }
      ).exec();

      let nextNumber = 1;
      if (highestFarmer && highestFarmer.farmerId) {
        const parts = highestFarmer.farmerId.split('-');
        const lastNum = parseInt(parts[2], 10);
        if (!isNaN(lastNum)) {
          nextNumber = lastNum + 1;
        }
      }

      const suffix = String(nextNumber).padStart(3, '0');
      this.farmerId = `F-${prefix}-${suffix}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Farmer', farmerSchema);
