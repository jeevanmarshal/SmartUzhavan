const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  method: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'other'],
    default: 'cash'
  }
});

const harvesterJobSchema = new mongoose.Schema({
  farmer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: [true, 'Farmer ID is required'],
  },
  equipment: {
    type: String,
    required: [true, 'Equipment is required'],
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  area: {
    type: Number,
    required: [true, 'Area is required'],
    min: [0.01, 'Area must be greater than 0'],
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed'],
    default: 'scheduled',
  },
  linkedLogIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DriverLog'
  }],
  payments: [paymentSchema],
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

// Validation for endDate to be after startDate
harvesterJobSchema.pre('save', function(next) {
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    return next(new Error('End date must be after or equal to start date'));
  }
  next();
});

// Indexes
harvesterJobSchema.index({ farmer_id: 1 });
harvesterJobSchema.index({ status: 1 });
harvesterJobSchema.index({ startDate: -1 });

const HarvesterJob = mongoose.model('HarvesterJob', harvesterJobSchema);

module.exports = HarvesterJob;
