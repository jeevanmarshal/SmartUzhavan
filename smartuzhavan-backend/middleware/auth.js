const User = require('../models/User');
const logger = require('../utils/logger');

// Check if user is authenticated
const isAuthenticated = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please login first.'
      }
    });
  }
  
  try {
    const user = await User.findById(req.session.userId);
    if (!user || user.isDeleted) {
      req.session.destroy();
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found or has been deleted'
        }
      }
    );
  }
    
    req.user = user;
    next();
  } catch (error) {
    logger.error(`Auth error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
};

// Check if user has required role
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action'
        }
      });
    }
    next();
  };
};

const isAdmin = checkRole(['admin', 'super_admin']);
const isSuperAdmin = checkRole(['super_admin']);

module.exports = { isAuthenticated, checkRole, isAdmin, isSuperAdmin };
