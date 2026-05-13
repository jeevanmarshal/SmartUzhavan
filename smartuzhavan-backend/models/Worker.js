const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Worker name is required'],
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[0-9]{10,14}$/, 'Please provide a valid phone number'],
  },
  village: {
    type: String,
    required: [true, 'Village is required'],
    trim: true,
  },
  workTypes: [{
    type: String,
    trim: true,
  }],
  rates: {
    type: Map,
    of: Number,
    default: {},
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true
});

// Indexes
workerSchema.index({ village: 1 });
workerSchema.index({ active: 1 });

const Worker = mongoose.model('Worker', workerSchema);

module.exports = Worker;
