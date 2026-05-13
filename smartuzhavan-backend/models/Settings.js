const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'Settings key is required'],
    unique: true,
    trim: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed, // Can be object, array, string, number
    required: [true, 'Settings value is required'],
  },
  type: {
    type: String,
    enum: ['prices', 'configs', 'categories', 'work_types', 'general'],
    required: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true // This covers lastUpdated via updatedAt
});

// Indexes
settingsSchema.index({ type: 1 });
settingsSchema.index({ category: 1 });

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
