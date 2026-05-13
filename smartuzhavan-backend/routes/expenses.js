const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
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

// @route   POST /api/expenses
router.post('/', isAuthenticated, auditLog('CREATE', 'Expense'), async (req, res) => {
  try {
    const expense = new Expense({
      ...req.body,
      createdBy: req.session.userId
    });
    await expense.save();
    return sendResponse(res, 201, expense);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   GET /api/expenses
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const queryObj = { isDeleted: false };
    if (req.query.type) queryObj.type = req.query.type;
    if (req.query.category) queryObj.category = req.query.category;
    if (req.query.fromDate && req.query.toDate) {
      queryObj.date = { $gte: new Date(req.query.fromDate), $lte: new Date(req.query.toDate) };
    }

    const expenses = await Expense.find(queryObj).sort({ date: -1 }).skip(skip).limit(limit);
    const total = await Expense.countDocuments(queryObj);

    return sendResponse(res, 200, expenses, {}, { page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   GET /api/expenses/summary
router.get('/summary/aggregate', isAuthenticated, async (req, res) => {
  try {
    const matchStage = { isDeleted: false };
    if (req.query.fromDate && req.query.toDate) {
      matchStage.date = { $gte: new Date(req.query.fromDate), $lte: new Date(req.query.toDate) };
    }

    const summary = await Expense.aggregate([
      { $match: matchStage },
      { $group: {
          _id: { type: "$type", category: "$category" },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $group: {
          _id: "$_id.type",
          categories: { $push: { category: "$_id.category", amount: "$totalAmount", count: "$count" } },
          totalAmount: { $sum: "$totalAmount" }
        }
      }
    ]);

    return sendResponse(res, 200, summary);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   GET /api/expenses/report
router.get('/report', isAuthenticated, async (req, res) => {
  try {
    return sendResponse(res, 501, null, { message: "Report generation pending implementation" });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   PUT /api/expenses/:id
router.put('/:id', isAuthenticated, auditLog('UPDATE', 'Expense'), async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!expense) return sendError(res, 404, 'NOT_FOUND', 'Expense not found');
    return sendResponse(res, 200, expense);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   DELETE /api/expenses/:id
router.delete('/:id', isAuthenticated, auditLog('DELETE', 'Expense'), async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!expense) return sendError(res, 404, 'NOT_FOUND', 'Expense not found');
    return sendResponse(res, 200, { message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

module.exports = router;
