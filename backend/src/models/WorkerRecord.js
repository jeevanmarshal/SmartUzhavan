const mongoose = require('mongoose');

const workerRecordSchema = new mongoose.Schema({
  worker_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: [true, 'Worker ID is required'],
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  work_type: {
    type: String,
    required: [true, 'Work type is required'],
    trim: true,
  },
  units: {
    type: Number,
    required: false,
    min: [0, 'Units must be at least 0'],
  },
  rate_per_unit: {
    type: Number,
    required: false,
    min: [0, 'Rate cannot be negative'],
  },
  total_amount: {
    type: Number,
    required: false,
    min: 0,
  },
  baseSalary: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  extraAmount: { type: Number, default: 0 },
  advance: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['submitted', 'approved', 'paid'],
    default: 'submitted',
  },
  notes: {
    type: String,
    trim: true,
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

// Calculate total_amount automatically
workerRecordSchema.pre('save', function(next) {
  if (this.units && this.rate_per_unit && !this.isModified('total_amount')) {
    this.total_amount = this.units * this.rate_per_unit;
  }
  next();
});

// Indexes
workerRecordSchema.index({ worker_id: 1, date: -1 });
workerRecordSchema.index({ work_type: 1 });
workerRecordSchema.index({ date: -1 });

const WorkerRecord = mongoose.model('WorkerRecord', workerRecordSchema);

module.exports = WorkerRecord;
