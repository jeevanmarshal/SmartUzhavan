const express = require('express');
const { body, query, validationResult } = require('express-validator');
const router = express.Router();
const Worker = require('../models/Worker');
const WorkerRecord = require('../models/WorkerRecord');
const { isAuthenticated } = require('../middleware/auth');
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

// @route   POST /api/workers
router.post('/', 
  isAuthenticated, 
  [
    body('name').trim().notEmpty().withMessage('Worker name is required'),
    body('village').trim().notEmpty().withMessage('Village is required')
  ],
  auditLog('CREATE', 'Worker'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid inputs', errors.array());

    try {
      const worker = new Worker({
        ...req.body,
        createdBy: req.session.userId
      });

      await worker.save();
      return sendResponse(res, 201, worker);
    } catch (error) {
      console.error(error);
      return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
    }
});

// @route   GET /api/workers
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const queryObj = { isDeleted: false };
    if (req.query.village) queryObj.village = req.query.village;
    if (req.query.active !== undefined) queryObj.active = req.query.active === 'true';

    const workers = await Worker.find(queryObj).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Worker.countDocuments(queryObj);

    return sendResponse(res, 200, workers, {}, { page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// --- WORKER RECORDS ---

// @route   POST /api/workers/records
router.post('/records', isAuthenticated, auditLog('CREATE', 'WorkerRecord'), async (req, res) => {
    try {
      const record = new WorkerRecord({
        ...req.body,
        createdBy: req.session.userId
      });
      await record.save();
      return sendResponse(res, 201, record);
    } catch (error) {
      console.error(error);
      return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
    }
});

// @route   GET /api/workers/records/all
router.get('/records/all', isAuthenticated, async (req, res) => {
  try {
    const queryObj = { isDeleted: false };
    if (req.query.worker_id) queryObj.worker_id = req.query.worker_id;
    if (req.query.work_type) queryObj.work_type = req.query.work_type;
    if (req.query.status) queryObj.status = req.query.status;
    if (req.query.fromDate && req.query.toDate) {
      queryObj.date = { $gte: new Date(req.query.fromDate), $lte: new Date(req.query.toDate) };
    }

    const records = await WorkerRecord.find(queryObj).sort({ date: -1 }).populate('worker_id', 'name village');
    return sendResponse(res, 200, records);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   PUT /api/workers/records/:id
router.put('/records/:id', isAuthenticated, auditLog('UPDATE', 'WorkerRecord'), async (req, res) => {
    try {
      const record = await WorkerRecord.findOneAndUpdate(
        { _id: req.params.id, isDeleted: false },
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!record) return sendError(res, 404, 'NOT_FOUND', 'Record not found');
      return sendResponse(res, 200, record);
    } catch (error) {
      console.error(error);
      return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
    }
});

// @route   DELETE /api/workers/records/:id
router.delete('/records/:id', isAuthenticated, auditLog('DELETE', 'WorkerRecord'), async (req, res) => {
    try {
      const record = await WorkerRecord.findOneAndUpdate(
        { _id: req.params.id, isDeleted: false },
        { isDeleted: true },
        { new: true }
      );
      if (!record) return sendError(res, 404, 'NOT_FOUND', 'Record not found');
      return sendResponse(res, 200, { message: 'Record deleted successfully' });
    } catch (error) {
      console.error(error);
      return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
    }
});

// @route   GET /api/workers/:id
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const worker = await Worker.findOne({ _id: req.params.id, isDeleted: false });
    if (!worker) return sendError(res, 404, 'NOT_FOUND', 'Worker not found');
    return sendResponse(res, 200, worker);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   PUT /api/workers/:id
router.put('/:id', isAuthenticated, auditLog('UPDATE', 'Worker'), async (req, res) => {
    try {
      const worker = await Worker.findOneAndUpdate(
        { _id: req.params.id, isDeleted: false },
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!worker) return sendError(res, 404, 'NOT_FOUND', 'Worker not found');
      return sendResponse(res, 200, worker);
    } catch (error) {
      console.error(error);
      return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
    }
});

// @route   DELETE /api/workers/:id
router.delete('/:id', isAuthenticated, auditLog('DELETE', 'Worker'), async (req, res) => {
    try {
      const worker = await Worker.findOneAndUpdate(
        { _id: req.params.id, isDeleted: false },
        { isDeleted: true },
        { new: true }
      );
      if (!worker) return sendError(res, 404, 'NOT_FOUND', 'Worker not found');
      return sendResponse(res, 200, { message: 'Worker deleted successfully' });
    } catch (error) {
      console.error(error);
      return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
    }
});

module.exports = router;
