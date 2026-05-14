const APIResponse = require('./responseHandler');

const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.entries(err.errors).reduce((acc, [field, error]) => {
      acc[field] = error.message;
      return acc;
    }, {});
    return res.status(400).json(APIResponse.fail(errors, 'Validation failed', 400));
  }

  // Duplicate key errors (unique constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json(
      APIResponse.fail({ [field]: `${field} already exists` }, 'Duplicate entry', 409)
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(APIResponse.error('Invalid token', 401));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(APIResponse.error('Token expired', 401));
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return res.status(statusCode).json(APIResponse.error(message, statusCode));
};

module.exports = errorHandler;
