const APIResponse = require('./responseHandler');

const responseFormatter = (req, res, next) => {
  // Add helper methods to res object
  res.success = (data, message = 'Success', statusCode = 200) => {
    return res.json(APIResponse.success(data, message, statusCode));
  };

  res.fail = (data, message = 'Validation failed', statusCode = 400) => {
    return res.json(APIResponse.fail(data, message, statusCode));
  };

  res.error = (message = 'Internal error', statusCode = 500, data = null) => {
    return res.json(APIResponse.error(message, statusCode, data));
  };

  next();
};

module.exports = responseFormatter;
