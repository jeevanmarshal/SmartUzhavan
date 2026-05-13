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
  },
  notes: String
});

const financeLendingSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['loan', 'advance', 'credit'],
    required: [true, 'Finance type is required'],
  },
  farmer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: [true, 'Farmer ID is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
  },
  purpose: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dueDate: {
    type: Date,
  },
  interestRate: {
    type: Number,
    default: 0,
    min: 0,
  },
  payments: [paymentSchema],
  status: {
    type: String,
    enum: ['pending', 'partial', 'completed'],
    default: 'pending',
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

// Calculate status based on payments
financeLendingSchema.pre('save', function(next) {
  if (this.payments && this.payments.length > 0) {
    const totalPaid = this.payments.reduce((sum, p) => sum + p.amount, 0);
    // Note: This simple calculation doesn't include interest compound over time.
    // Real-world scenarios might need a more complex interest calculation here.
    if (totalPaid >= this.amount) {
      this.status = 'completed';
    } else if (totalPaid > 0) {
      this.status = 'partial';
    } else {
      this.status = 'pending';
    }
  } else {
    this.status = 'pending';
  }
  
  if (this.dueDate && this.dueDate < this.date) {
    return next(new Error('Due date must be after or equal to start date'));
  }
  next();
});

// Indexes
financeLendingSchema.index({ farmer_id: 1, dueDate: 1 });
financeLendingSchema.index({ status: 1 });
financeLendingSchema.index({ date: -1 });

const FinanceLending = mongoose.model('FinanceLending', financeLendingSchema);

module.exports = FinanceLending;
