const mongoose = require('mongoose');

const changeHistorySchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  documentType: {
    type: String,
    required: [true, 'Document type is required'],
    enum: ['farmers', 'fields', 'crops'],
    index: true
  },
  
  version: {
    type: Number,
    required: true,
    index: true
  },
  
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  changedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound indexes
changeHistorySchema.index({ documentId: 1, version: -1 });
changeHistorySchema.index({ documentId: 1, documentType: 1 });

module.exports = mongoose.model('ChangeHistory', changeHistorySchema);
