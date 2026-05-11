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
    required: [true, 'Land area is required'],
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
  }
});

// Create text indexes
farmerSchema.index({ name: 'text', village: 'text', phone: 'text' });

// Exclude deleted from queries
farmerSchema.pre(/^find/, function(next) {
  if (this.options._recursed) return next();
  this.find({ isDeleted: false });
  next();
});

module.exports = mongoose.model('Farmer', farmerSchema);
