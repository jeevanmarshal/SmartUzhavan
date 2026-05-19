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

const financeLendingSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['loan', 'advance', 'credit'],
    default: 'loan',
    required: [true, 'Finance type is required'],
  },
  personName: {
    type: String,
    trim: true,
  },
  farmer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: false,
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
    enum: ['pending', 'partial', 'completed', 'active'],
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
    if (totalPaid >= this.amount) {
      this.status = 'completed';
    } else if (totalPaid > 0) {
      this.status = 'partial';
    } else {
      this.status = 'pending';
    }
  } else {
    // Keep 'active' if set by frontend
    if (this.status !== 'active') {
       this.status = 'pending';
    }
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
