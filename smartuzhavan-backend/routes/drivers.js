const express = require('express');
const { body, query, validationResult } = require('express-validator');
const router = express.Router();
const Driver = require('../models/Driver');
const DriverLog = require('../models/DriverLog');
const { isAuthenticated, isSuperAdmin } = require('../middleware/auth');
const auditLog = require('../middleware/audit');

// Middleware to standard format responses
const sendResponse = (res, statusCode, data, meta = {}, pagination = null) => {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: "v5.0",
      ...meta
    }
  };
  if (pagination) response.pagination = pagination;
  return res.status(statusCode).json(response);
};

const sendError = (res, statusCode, code, message, details = {}) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  });
};

// @route   POST /api/drivers
// @desc    Create a new driver
// @access  Admin/SuperAdmin
router.post('/', 
  isAuthenticated, 
  [
    body('name').trim().notEmpty().withMessage('Driver name is required'),
    body('phone').trim().matches(/^\+?[0-9]{10,14}$/).withMessage('Valid phone number is required'),
    body('village').trim().notEmpty().withMessage('Village is required'),
    body('pin').matches(/^[0-9]{4,6}$/).withMessage('PIN must be 4-6 digits'),
    body('baseRate').isNumeric().withMessage('Base rate must be a number')
  ],
  auditLog('CREATE', 'Driver'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid inputs', errors.array());

    try {
      const existingDriver = await Driver.findOne({ phone: req.body.phone });
      if (existingDriver) {
        return sendError(res, 400, 'DUPLICATE_ERROR', 'Driver with this phone already exists');
      }

      const driver = new Driver({
        ...req.body,
        createdBy: req.session.userId
      });

      await driver.save();
      // Ensure PIN is not returned in response via toJSON method
      return sendResponse(res, 201, driver);
    } catch (error) {
      console.error(error);
      return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
    }
});

// @route   GET /api/drivers
// @desc    Get all drivers with pagination and filters
// @access  Authenticated
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const queryObj = { isDeleted: false };
    if (req.query.village) queryObj.village = req.query.village;
    if (req.query.active !== undefined) queryObj.active = req.query.active === 'true';

    const drivers = await Driver.find(queryObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Driver.countDocuments(queryObj);

    return sendResponse(res, 200, drivers, {}, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   GET /api/drivers/:id
// @desc    Get driver by ID
// @access  Authenticated
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const driver = await Driver.findOne({ _id: req.params.id, isDeleted: false });
    if (!driver) return sendError(res, 404, 'NOT_FOUND', 'Driver not found');
    return sendResponse(res, 200, driver);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   PUT /api/drivers/:id
// @desc    Update driver
// @access  Admin/SuperAdmin
router.put('/:id', 
  isAuthenticated,
  auditLog('UPDATE', 'Driver'),
  async (req, res) => {
    try {
      // Prevent updating PIN through this route
      const updateData = { ...req.body };
      delete updateData.pin;

      const driver = await Driver.findOneAndUpdate(
        { _id: req.params.id, isDeleted: false },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!driver) return sendError(res, 404, 'NOT_FOUND', 'Driver not found');
      return sendResponse(res, 200, driver);
    } catch (error) {
      console.error(error);
      if (error.code === 11000) return sendError(res, 400, 'DUPLICATE_ERROR', 'Phone number already exists');
      return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
    }
});

// @route   DELETE /api/drivers/:id
// @desc    Soft delete driver
// @access  Admin/SuperAdmin
router.delete('/:id', 
  isAuthenticated,
  auditLog('DELETE', 'Driver'),
  async (req, res) => {
    try {
      const driver = await Driver.findOneAndUpdate(
        { _id: req.params.id, isDeleted: false },
        { isDeleted: true },
        { new: true }
      );
      if (!driver) return sendError(res, 404, 'NOT_FOUND', 'Driver not found');
      return sendResponse(res, 200, { message: 'Driver deleted successfully' });
    } catch (error) {
      console.error(error);
      return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
    }
});

// @route   POST /api/drivers/:id/change-pin
// @desc    Admin changes driver PIN
// @access  Admin/SuperAdmin
router.post('/:id/change-pin', 
  isAuthenticated,
  isSuperAdmin,
  [body('newPin').matches(/^[0-9]{4,6}$/).withMessage('PIN must be 4-6 digits')],
  auditLog('UPDATE', 'Driver_PIN'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid inputs', errors.array());

    try {
      const driver = await Driver.findOne({ _id: req.params.id, isDeleted: false });
      if (!driver) return sendError(res, 404, 'NOT_FOUND', 'Driver not found');

      driver.pin = req.body.newPin;
      await driver.save(); // This triggers the pre-save hook to hash the PIN

      return sendResponse(res, 200, { message: 'PIN updated successfully' });
    } catch (error) {
      console.error(error);
      return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
    }
});

// @route   GET /api/drivers/:id/salary-history
// @desc    Get driver salary history (logs)
// @access  Authenticated
router.get('/:id/salary-history', isAuthenticated, async (req, res) => {
  try {
    const logs = await DriverLog.find({ driver_id: req.params.id, isDeleted: false })
      .sort({ date: -1 });
    return sendResponse(res, 200, logs);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   GET /api/drivers/salary/all
// @desc    Get all driver salaries
// @access  Authenticated
router.get('/salary/all', isAuthenticated, async (req, res) => {
  try {
    // Only get DriverLogs that have salary-related fields > 0 to separate them from just basic work logs if needed
    // or just return all DriverLogs as they represent the salary history.
    const query = { isDeleted: false };
    
    // Optional filtering
    if (req.query.driverId) query.driver_id = req.query.driverId;
    if (req.query.fromDate && req.query.toDate) {
      query.date = { $gte: new Date(req.query.fromDate), $lte: new Date(req.query.toDate) };
    }

    const logs = await DriverLog.find(query).sort({ date: -1 });
    return sendResponse(res, 200, logs);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   POST /api/drivers/:id/salary
// @desc    Add a salary record for a driver
// @access  Admin/SuperAdmin
router.post('/:id/salary', isAuthenticated, auditLog('CREATE', 'DriverSalary'), async (req, res) => {
  try {
    const salary = new DriverLog({
      ...req.body,
      driver_id: req.params.id,
      createdBy: req.session.userId
    });
    await salary.save();
    return sendResponse(res, 201, salary);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   PUT /api/drivers/salary/:salaryId
// @desc    Update a salary record
// @access  Admin/SuperAdmin
router.put('/salary/:salaryId', isAuthenticated, auditLog('UPDATE', 'DriverSalary'), async (req, res) => {
  try {
    const salary = await DriverLog.findOneAndUpdate(
      { _id: req.params.salaryId, isDeleted: false },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!salary) return sendError(res, 404, 'NOT_FOUND', 'Salary record not found');
    return sendResponse(res, 200, salary);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   DELETE /api/drivers/salary/:salaryId
// @desc    Delete a salary record
// @access  Admin/SuperAdmin
router.delete('/salary/:salaryId', isAuthenticated, auditLog('DELETE', 'DriverSalary'), async (req, res) => {
  try {
    const salary = await DriverLog.findOneAndUpdate(
      { _id: req.params.salaryId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!salary) return sendError(res, 404, 'NOT_FOUND', 'Salary record not found');
    return sendResponse(res, 200, { message: 'Salary deleted successfully' });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   POST /api/drivers/salary/:salaryId/payment
// @desc    Add payment to salary record
// @access  Admin/SuperAdmin
router.post('/salary/:salaryId/payment', isAuthenticated, auditLog('UPDATE', 'DriverSalaryPayment'), async (req, res) => {
  try {
    const salary = await DriverLog.findOne({ _id: req.params.salaryId, isDeleted: false });
    if (!salary) return sendError(res, 404, 'NOT_FOUND', 'Salary record not found');

    salary.payments.push({
      amount: req.body.amount,
      date: req.body.date || Date.now(),
      method: req.body.method || 'cash'
    });
    
    await salary.save();
    return sendResponse(res, 200, salary);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   GET /api/drivers/:id/pdf/salary
// @desc    Generate driver salary PDF
// @access  Authenticated
router.get('/:id/pdf/salary', isAuthenticated, async (req, res) => {
  try {
    // Placeholder for Phase 3/4 PDF implementation
    // Will integrate with PDF generation service later
    return sendResponse(res, 501, null, { message: "PDF generation pending implementation" });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   POST /api/drivers/login
// @desc    Authenticate driver
// @access  Public
router.post('/login', [
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('pin').notEmpty().withMessage('PIN is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid inputs', errors.array());

  try {
    const { phone, pin } = req.body;
    const driver = await Driver.findOne({ phone, isDeleted: false });
    
    if (!driver || !(await driver.verifyPIN(pin))) {
      logger.warn(`Failed driver login attempt for phone: ${phone}`);
      return sendError(res, 401, 'UNAUTHORIZED', 'தவறான விவரங்கள் (Invalid Credentials)');
    }

    if (!driver.active) {
      return sendError(res, 403, 'FORBIDDEN', 'Account is deactivated');
    }

    // Set session (same as user login)
    req.session.userId = driver._id;
    req.session.role = 'driver';

    logger.info(`Driver logged in: ${driver.name} (${phone})`);
    
    return sendResponse(res, 200, {
      id: driver._id,
      name: driver.name,
      role: 'driver'
    });
  } catch (error) {
    logger.error(`Driver login error: ${error.message}`);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

module.exports = router;
