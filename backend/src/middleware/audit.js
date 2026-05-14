const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Audit Middleware Factory
 * @param {string} action - Action type (CREATE, UPDATE, DELETE)
 * @param {string} entity - Entity name (Driver, Farmer, etc.)
 */
const auditLog = (action, entity) => {
  return async (req, res, next) => {
    // We don't log GET requests or unauthenticated requests
    if (!req.user || req.method === 'GET') {
      return next();
    }

    // Wrap res.json to capture successful operations
    const originalJson = res.json;
    res.json = function(data) {
      if (data.success) {
        // Create audit log entry asynchronously
        const logEntry = new AuditLog({
          userId: req.user._id,
          action,
          entity,
          entityId: req.params.id || data.data?._id || data.data?.id,
          details: {
            method: req.method,
            path: req.originalUrl,
            body: action === 'DELETE' ? null : req.body
          },
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        logEntry.save().catch(err => {
          logger.error(`Audit logging failed: ${err.message}`);
        });
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = auditLog;
