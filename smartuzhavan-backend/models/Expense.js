const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['business', 'own_farm', 'home'],
    required: [true, 'Expense type is required'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
  },
  description: {
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

// Indexes
expenseSchema.index({ type: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ createdBy: 1 });
expenseSchema.index({ type: 1, date: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
