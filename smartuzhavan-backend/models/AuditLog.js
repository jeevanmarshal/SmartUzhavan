const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  action: {
    type: String,
    enum: {
      values: ['CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'EXPORT'],
      message: 'Invalid action'
    },
    required: true,
    index: true
  },
  
  entity: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: ['farmers', 'fields', 'crops', 'user', 'other'],
    index: true
  },
  
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  beforeData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  afterData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  ipAddress: {
    type: String,
    required: true
  },
  
  userAgent: {
    type: String,
    default: null
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound indexes
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ entity: 1, entityId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
