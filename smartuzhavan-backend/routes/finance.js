const express = require('express');
const router = express.Router();
const FinanceLending = require('../models/FinanceLending');
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

// @route   POST /api/finance-records
router.post('/', isAuthenticated, auditLog('CREATE', 'FinanceLending'), async (req, res) => {
  try {
    const record = new FinanceLending({
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

// @route   GET /api/finance-records
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const queryObj = { isDeleted: false };
    if (req.query.status) queryObj.status = req.query.status;
    if (req.query.type) queryObj.type = req.query.type;
    if (req.query.farmer_id) queryObj.farmer_id = req.query.farmer_id;

    const records = await FinanceLending.find(queryObj)
      .populate('farmer_id', 'name village phone')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await FinanceLending.countDocuments(queryObj);

    return sendResponse(res, 200, records, {}, { page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   GET /api/finance-records/summary
router.get('/summary/aggregate', isAuthenticated, async (req, res) => {
  try {
    const summary = await FinanceLending.aggregate([
      { $match: { isDeleted: false } },
      { $group: {
          _id: "$status",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);
    return sendResponse(res, 200, summary);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   GET /api/finance-records/overdue
router.get('/overdue', isAuthenticated, async (req, res) => {
  try {
    const now = new Date();
    const records = await FinanceLending.find({
      isDeleted: false,
      status: { $ne: 'completed' },
      dueDate: { $lt: now }
    }).populate('farmer_id', 'name village phone');

    return sendResponse(res, 200, records);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   GET /api/finance-records/:id
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const record = await FinanceLending.findOne({ _id: req.params.id, isDeleted: false })
      .populate('farmer_id', 'name village phone');
    if (!record) return sendError(res, 404, 'NOT_FOUND', 'Record not found');
    return sendResponse(res, 200, record);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   PUT /api/finance-records/:id
router.put('/:id', isAuthenticated, auditLog('UPDATE', 'FinanceLending'), async (req, res) => {
  try {
    const record = await FinanceLending.findOne({ _id: req.params.id, isDeleted: false });
    if (!record) return sendError(res, 404, 'NOT_FOUND', 'Record not found');
    
    // Assign fields except payments
    Object.assign(record, req.body);
    // Explicit save to trigger pre-save calculation logic
    await record.save();

    return sendResponse(res, 200, record);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   POST /api/finance-records/:id/payment
router.post('/:id/payment', isAuthenticated, auditLog('UPDATE', 'FinanceLending_Payment'), async (req, res) => {
  try {
    const record = await FinanceLending.findOne({ _id: req.params.id, isDeleted: false });
    if (!record) return sendError(res, 404, 'NOT_FOUND', 'Record not found');

    const payment = {
      amount: req.body.amount,
      date: req.body.date || Date.now(),
      method: req.body.method || 'cash',
      notes: req.body.notes
    };

    record.payments.push(payment);
    await record.save();

    return sendResponse(res, 200, record);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   DELETE /api/finance-records/:id
router.delete('/:id', isAuthenticated, auditLog('DELETE', 'FinanceLending'), async (req, res) => {
  try {
    const record = await FinanceLending.findOneAndUpdate(
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

module.exports = router;
