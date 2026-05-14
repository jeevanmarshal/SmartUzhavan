const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const Driver = require('../models/Driver');
const DriverLog = require('../models/DriverLog');
const { authenticateToken, authorize } = require('../middleware/auth');
const auditLog = require('../middleware/audit');

/**
 * @route   POST /api/drivers
 * @desc    Create a new driver
 * @access  Admin/SuperAdmin
 */
router.post('/', 
  authenticateToken, 
  authorize('ADMIN', 'SUPER_ADMIN'),
  [
    body('name').trim().notEmpty().withMessage('Driver name is required'),
    body('phone').trim().matches(/^\+?[0-9]{10,14}$/).withMessage('Valid phone number is required'),
    body('village').trim().notEmpty().withMessage('Village is required'),
    body('pin').matches(/^[0-9]{4,6}$/).withMessage('PIN must be 4-6 digits'),
    body('baseRate').isNumeric().withMessage('Base rate must be a number')
  ],
  auditLog('CREATE', 'Driver'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.fail(errors.array(), 'Validation failed');

    try {
      const existingDriver = await Driver.findOne({ phone: req.body.phone });
      if (existingDriver) return res.fail({ phone: 'Driver with this phone already exists' }, 'Duplicate entry', 400);

      const driver = new Driver({
        ...req.body,
        createdBy: req.user._id
      });

      await driver.save();
      return res.success(driver, 'Driver created successfully', 201);
    } catch (error) {
      next(error);
    }
});

/**
 * @route   GET /api/drivers
 * @desc    Get all drivers with pagination
 */
router.get('/', authenticateToken, async (req, res, next) => {
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

    return res.success(drivers, 'Drivers retrieved', 200, {
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/drivers/:id
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ _id: req.params.id, isDeleted: false });
    if (!driver) return res.status(404).error('Driver not found', 404);
    return res.success(driver);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/drivers/:id
 */
router.put('/:id', authenticateToken, authorize('ADMIN', 'SUPER_ADMIN'), auditLog('UPDATE', 'Driver'), async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    delete updateData.pin;

    const driver = await Driver.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!driver) return res.status(404).error('Driver not found', 404);
    return res.success(driver, 'Driver updated');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/drivers/:id
 */
router.delete('/:id', authenticateToken, authorize('ADMIN', 'SUPER_ADMIN'), auditLog('DELETE', 'Driver'), async (req, res, next) => {
  try {
    const driver = await Driver.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!driver) return res.status(404).error('Driver not found', 404);
    return res.success({ message: 'Driver deleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/drivers/:id/salary-history
 * @desc    Get work logs and salary history for a specific driver
 */
router.get('/:id/salary-history', authenticateToken, async (req, res, next) => {
  try {
    const logs = await DriverLog.find({ 
      driver_id: req.params.id, 
      isDeleted: false 
    }).sort({ date: -1 });

    return res.success(logs, 'Driver salary history retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/drivers/salaries/all
 * @desc    Get all work logs for all drivers (Admin only)
 */
router.get('/salaries/all', authenticateToken, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const logs = await DriverLog.find({ isDeleted: false })
      .sort({ date: -1 })
      .populate('driver_id', 'name village phone');

    return res.success(logs, 'All driver salary logs retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/drivers/salaries
 * @desc    Create a new driver work log
 */
router.post('/salaries', authenticateToken, auditLog('CREATE', 'DriverLog'), async (req, res, next) => {
  try {
    const log = new DriverLog({
      ...req.body,
      createdBy: req.user._id
    });
    await log.save();
    return res.success(log, 'Driver log created', 201);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/drivers/salaries/:id
 */
router.put('/salaries/:id', authenticateToken, auditLog('UPDATE', 'DriverLog'), async (req, res, next) => {
  try {
    const log = await DriverLog.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!log) return res.status(404).error('Log not found', 404);
    return res.success(log, 'Driver log updated');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/drivers/salaries/:id
 */
router.delete('/salaries/:id', authenticateToken, auditLog('DELETE', 'DriverLog'), async (req, res, next) => {
  try {
    const log = await DriverLog.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!log) return res.status(404).error('Log not found', 404);
    return res.success(null, 'Driver log deleted');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
