const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['harvest', 'expense', 'income', 'summary'],
    required: [true, 'Report type is required'],
  },
  period: {
    type: String,
    required: [true, 'Report period is required'],
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  startDate: Date,
  endDate: Date,
  generatedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

reportSchema.index({ userId: 1, type: 1 });
reportSchema.index({ generatedAt: -1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
