const express = require('express');
const router = express.Router();
const OwnFarmIncome = require('../models/OwnFarmIncome');
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

// @route   POST /api/own-farm-income
router.post('/', isAuthenticated, auditLog('CREATE', 'OwnFarmIncome'), async (req, res) => {
  try {
    // Normalization Layer for V3.1 Frontend Mapping
    const mappedData = {
      ...req.body,
      type: req.body.type || req.body.incomeSource,
      quantity: req.body.quantity || req.body.numberOfBags || req.body.numberOfBundles || 0,
      price_per_unit: req.body.price_per_unit || req.body.pricePerBag || req.body.pricePerBundle || 0,
      total_amount: req.body.total_amount || req.body.totalIncome || 0,
      createdBy: req.user?._id || req.session?.userId
    };

    const income = new OwnFarmIncome(mappedData);
    
    // Fallback calculation
    if (!income.total_amount && income.quantity && income.price_per_unit) {
        income.total_amount = income.quantity * income.price_per_unit;
    }
    
    await income.save();
    return sendResponse(res, 201, income);
  } catch (error) {
    console.error(`Create own-farm error: ${error.message}`);
    return sendError(res, 500, 'SERVER_ERROR', error.message || 'Server Error');
  }
});

// @route   GET /api/own-farm-income
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const queryObj = { isDeleted: false };
    if (req.query.type) queryObj.type = req.query.type;
    if (req.query.fromDate && req.query.toDate) {
      queryObj.date = { $gte: new Date(req.query.fromDate), $lte: new Date(req.query.toDate) };
    }

    const records = await OwnFarmIncome.find(queryObj)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await OwnFarmIncome.countDocuments(queryObj);

    return sendResponse(res, 200, records, {}, { page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   GET /api/own-farm-income/summary
router.get('/summary/aggregate', isAuthenticated, async (req, res) => {
  try {
    const matchStage = { isDeleted: false };
    if (req.query.fromDate && req.query.toDate) {
      matchStage.date = { $gte: new Date(req.query.fromDate), $lte: new Date(req.query.toDate) };
    }

    const summary = await OwnFarmIncome.aggregate([
      { $match: matchStage },
      { $group: {
          _id: "$type",
          totalQuantity: { $sum: "$quantity" },
          totalAmount: { $sum: "$total_amount" },
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

// @route   PUT /api/own-farm-income/:id
router.put('/:id', isAuthenticated, auditLog('UPDATE', 'OwnFarmIncome'), async (req, res) => {
  try {
    const record = await OwnFarmIncome.findOne({ _id: req.params.id, isDeleted: false });
    if (!record) return sendError(res, 404, 'NOT_FOUND', 'Record not found');

    Object.assign(record, req.body);
    await record.save(); // triggers total_amount calculation

    return sendResponse(res, 200, record);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   DELETE /api/own-farm-income/:id
router.delete('/:id', isAuthenticated, auditLog('DELETE', 'OwnFarmIncome'), async (req, res) => {
  try {
    const record = await OwnFarmIncome.findOneAndUpdate(
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
