const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const Worker = require('../models/Worker');
const WorkerRecord = require('../models/WorkerRecord');
const { authenticateToken, authorize } = require('../middleware/auth');
const auditLog = require('../middleware/audit');

/**
 * @route   POST /api/workers/records
 * @desc    Create a new worker record
 */
router.post('/records', authenticateToken, auditLog('CREATE', 'WorkerRecord'), async (req, res, next) => {
    try {
      // Normalization for V3.1 Salary-based Entries
      const mappedData = {
        ...req.body,
        work_type: req.body.work_type || req.body.workType,
        // If V3.1 sends baseSalary/bonus/advance, the model now accepts them directly
      };

      if (!mappedData.worker_id || !mappedData.work_type) {
        return res.status(400).json({ status: 'fail', message: 'Worker ID and Work Type are required' });
      }

      const record = new WorkerRecord({
        ...mappedData,
        createdBy: req.user._id
      });
      await record.save();
      return res.success(record, 'Worker record created', 201);
    } catch (error) {
      next(error);
    }
});

/**
 * @route   GET /api/workers/records/all
 */
router.get('/records/all', authenticateToken, async (req, res, next) => {
  try {
    const queryObj = { isDeleted: false };
    if (req.query.worker_id) queryObj.worker_id = req.query.worker_id;
    if (req.query.fromDate && req.query.toDate) {
      queryObj.date = { $gte: new Date(req.query.fromDate), $lte: new Date(req.query.toDate) };
    }

    const records = await WorkerRecord.find(queryObj).sort({ date: -1 }).populate('worker_id', 'name village');
    return res.success(records, 'Worker records retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/workers
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const queryObj = { isDeleted: false };
    const workers = await Worker.find(queryObj).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Worker.countDocuments(queryObj);

    return res.success(workers, 'Workers retrieved', 200, {
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/workers
 */
router.post('/', 
  authenticateToken, 
  authorize('ADMIN', 'SUPER_ADMIN'),
  [
    body('name').trim().notEmpty().withMessage('Worker name is required'),
    body('village').trim().notEmpty().withMessage('Village is required')
  ],
  auditLog('CREATE', 'Worker'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.fail(errors.array(), 'Validation failed');

    try {
      const worker = new Worker({
        ...req.body,
        createdBy: req.user._id
      });

      await worker.save();
      return res.success(worker, 'Worker created', 201);
    } catch (error) {
      next(error);
    }
});

/**
 * @route   GET /api/workers/:id
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const worker = await Worker.findOne({ _id: req.params.id, isDeleted: false });
    if (!worker) return res.status(404).error('Worker not found', 404);
    return res.success(worker);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
