const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: false
  },
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
    enum: ['cash', 'upi', 'bank_transfer', 'other', 'bank'],
    default: 'cash'
  },
  mode: {
    type: String,
    default: 'cash'
  },
  notes: {
    type: String,
    default: ''
  }
}, { _id: false });

const rentalSchema = new mongoose.Schema({
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
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
  },
  hours: {
    type: Number,
    required: false,
    min: [0, 'Hours must be at least 0'],
  },
  quantity: {
    type: Number,
    required: false,
  },
  ratePerUnit: {
    type: Number,
    required: false,
  },
  date: {
    type: Date,
  },
  ratePerHour: {
    type: Number,
    required: [true, 'Rate per hour is required'],
    min: [0, 'Rate cannot be negative'],
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed'],
    default: 'scheduled',
  },
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

// Pre-save calculation
rentalSchema.pre('save', function(next) {
  if (this.hours && this.ratePerHour && !this.isModified('totalAmount')) {
    this.totalAmount = this.hours * this.ratePerHour;
  }
  
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    return next(new Error('End date must be after or equal to start date'));
  }
  next();
});

// Indexes
rentalSchema.index({ farmer_id: 1 });
rentalSchema.index({ status: 1 });
rentalSchema.index({ startDate: -1 });

const Rental = mongoose.model('Rental', rentalSchema);

module.exports = Rental;
