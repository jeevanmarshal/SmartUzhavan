const AuthFactory = require('../factories/AuthFactory');

/**
 * Middleware to authenticate requests using JWT
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Check Authorization header or cookie
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    if (!token && req.cookies) {
      token = req.cookies.authToken;
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Authentication required. Please log in.',
        timestamp: new Date().toISOString(),
      });
    }

    const user = await AuthFactory.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      code: 401,
      message: error.message || 'Unauthorized',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Middleware to authorize roles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'User not authenticated',
        timestamp: new Date().toISOString(),
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        code: 403,
        message: `Access denied. Requires one of: ${allowedRoles.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

module.exports = { 
  authenticateToken, 
  authorize,
  isAuthenticated: authenticateToken, // Alias for backward compatibility if needed
  isAdmin: authorize('ADMIN', 'SUPER_ADMIN'),
  isSuperAdmin: authorize('SUPER_ADMIN')
};
