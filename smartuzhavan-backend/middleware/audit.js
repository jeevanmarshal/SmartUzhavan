const AuditLog = require('../models/AuditLog');

const auditMiddleware = async (req, res, next) => {
  if (!req.user || !['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }
  
  // Capture response to log it
  const originalJson = res.json;
  res.json = function(data) {
    if (data.success && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
      // Log is currently created in route handlers, but this middleware 
      // can be used to extend generic audit functionality in the future.
    }
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = auditMiddleware;
