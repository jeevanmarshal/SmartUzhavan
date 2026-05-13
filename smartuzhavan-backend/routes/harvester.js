const express = require('express');
const router = express.Router();
const HarvesterJob = require('../models/HarvesterJob');
const DriverLog = require('../models/DriverLog');
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

// @route   POST /api/harvester-jobs
router.post('/', isAuthenticated, auditLog('CREATE', 'HarvesterJob'), async (req, res) => {
  try {
    const job = new HarvesterJob({
      ...req.body,
      createdBy: req.session.userId
    });
    await job.save();
    return sendResponse(res, 201, job);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   GET /api/harvester-jobs
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const queryObj = { isDeleted: false };
    if (req.query.status) queryObj.status = req.query.status;
    if (req.query.farmer_id) queryObj.farmer_id = req.query.farmer_id;

    const jobs = await HarvesterJob.find(queryObj)
      .populate('farmer_id', 'name village phone')
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await HarvesterJob.countDocuments(queryObj);

    return sendResponse(res, 200, jobs, {}, { page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   GET /api/harvester-jobs/:id
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const job = await HarvesterJob.findOne({ _id: req.params.id, isDeleted: false })
      .populate('farmer_id', 'name village phone')
      .populate({
        path: 'linkedLogIds',
        match: { isDeleted: false },
        select: 'date totalDuration diesel'
      });
      
    if (!job) return sendError(res, 404, 'NOT_FOUND', 'Harvester job not found');
    return sendResponse(res, 200, job);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   PUT /api/harvester-jobs/:id
router.put('/:id', isAuthenticated, auditLog('UPDATE', 'HarvesterJob'), async (req, res) => {
  try {
    const job = await HarvesterJob.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!job) return sendError(res, 404, 'NOT_FOUND', 'Harvester job not found');
    return sendResponse(res, 200, job);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   DELETE /api/harvester-jobs/:id
router.delete('/:id', isAuthenticated, auditLog('DELETE', 'HarvesterJob'), async (req, res) => {
  try {
    const job = await HarvesterJob.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!job) return sendError(res, 404, 'NOT_FOUND', 'Harvester job not found');
    return sendResponse(res, 200, { message: 'Harvester job deleted successfully' });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   POST /api/harvester-jobs/:id/link-logs
router.post('/:id/link-logs', isAuthenticated, auditLog('UPDATE', 'HarvesterJob_Link'), async (req, res) => {
  try {
    const { logIds } = req.body;
    if (!Array.isArray(logIds)) return sendError(res, 400, 'VALIDATION_ERROR', 'logIds must be an array');

    // Verify logs exist and update them
    await DriverLog.updateMany(
      { _id: { $in: logIds }, isDeleted: false },
      { $set: { linkedJobId: req.params.id } }
    );

    const job = await HarvesterJob.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $addToSet: { linkedLogIds: { $each: logIds } } },
      { new: true }
    );

    if (!job) return sendError(res, 404, 'NOT_FOUND', 'Harvester job not found');
    return sendResponse(res, 200, job);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   GET /api/harvester-jobs/:id/pdf
router.get('/:id/pdf', isAuthenticated, async (req, res) => {
  try {
    return sendResponse(res, 501, null, { message: "Report generation pending implementation" });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

module.exports = router;
