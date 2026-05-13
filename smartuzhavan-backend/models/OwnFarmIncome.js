const mongoose = require('mongoose');

const ownFarmIncomeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['paddy', 'straw'],
    required: [true, 'Income type is required (paddy or straw)'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0'],
  },
  price_per_unit: {
    type: Number,
    required: [true, 'Price per unit is required'],
    min: [0.01, 'Price must be greater than 0'],
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
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
ownFarmIncomeSchema.pre('save', function(next) {
  if (this.quantity && this.price_per_unit && !this.isModified('total_amount')) {
    this.total_amount = this.quantity * this.price_per_unit;
  }
  next();
});

// Indexes
ownFarmIncomeSchema.index({ type: 1, date: -1 });
ownFarmIncomeSchema.index({ date: -1 });

const OwnFarmIncome = mongoose.model('OwnFarmIncome', ownFarmIncomeSchema);

module.exports = OwnFarmIncome;
