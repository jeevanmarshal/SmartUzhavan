const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { isAuthenticated, isSuperAdmin } = require('../middleware/auth');
const auditLog = require('../middleware/audit');

// Middleware to standard format responses
const sendResponse = (res, statusCode, data, meta = {}) => {
  return res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: "v5.0",
      ...meta
    }
  });
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

// @route   GET /api/settings
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const settings = await Settings.find({});
    return sendResponse(res, 200, settings);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   GET /api/settings/prices
router.get('/prices', isAuthenticated, async (req, res) => {
  try {
    const prices = await Settings.find({ type: 'prices' });
    return sendResponse(res, 200, prices);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   GET /api/settings/categories
router.get('/categories', isAuthenticated, async (req, res) => {
  try {
    const categories = await Settings.find({ type: 'categories' });
    return sendResponse(res, 200, categories);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   GET /api/settings/work-types
router.get('/work-types', isAuthenticated, async (req, res) => {
  try {
    const workTypes = await Settings.find({ type: 'work_types' });
    return sendResponse(res, 200, workTypes);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

// @route   PUT /api/settings/:key
// @desc    Update setting or create if not exists
router.put('/:key', isAuthenticated, isSuperAdmin, auditLog('UPDATE', 'Settings'), async (req, res) => {
  try {
    const { key } = req.params;
    const updateData = {
      ...req.body,
      lastUpdatedBy: req.session.userId
    };

    const setting = await Settings.findOneAndUpdate(
      { key },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );
    
    return sendResponse(res, 200, setting);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'Server Error');
  }
});

module.exports = router;
