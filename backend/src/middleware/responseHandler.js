/**
 * JSend-compliant Response Wrapper
 * All API responses MUST follow this structure
 */

class APIResponse {
  static success(data, message = 'Operation successful', statusCode = 200) {
    return {
      status: 'success',
      code: statusCode,
      data: data,
      message: message,
      timestamp: new Date().toISOString(),
    };
  }

  static fail(data, message = 'Validation failed', statusCode = 400) {
    return {
      status: 'fail',
      code: statusCode,
      data: data || null,
      message: message,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message = 'Internal server error', statusCode = 500, data = null) {
    return {
      status: 'error',
      code: statusCode,
      data: data,
      message: message,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = APIResponse;
