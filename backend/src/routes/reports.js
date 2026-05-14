const express = require('express');
const Report = require('../models/Report');
const HarvesterJob = require('../models/HarvesterJob');
const Expense = require('../models/Expense');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/reports
 * List all reports for current user
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const query = {};
    
    // Role-based filtering
    if (req.user.role === 'FARMER') {
      query.farmer_id = req.user._id;
    } else if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      query.userId = req.user._id;
    }

    if (req.query.type) query.type = req.query.type;

    const reports = await Report.find(query).sort({ createdAt: -1 }).lean();
    return res.success(reports, 'Reports retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/reports
 * Generate new report
 */
router.post('/', authenticateToken, authorize('ADMIN', 'FARMER'), async (req, res, next) => {
  try {
    const { type, period, startDate, endDate } = req.body;

    if (!type || !period) {
      return res.fail({ type: !type ? 'required' : null, period: !period ? 'required' : null }, 'Missing required fields', 400);
    }

    const validTypes = ['harvest', 'expense', 'summary'];
    if (!validTypes.includes(type)) {
      return res.fail({ type: `must be one of: ${validTypes.join(', ')}` }, 'Invalid report type', 400);
    }

    let reportData = {};
    if (type === 'harvest') {
      reportData = await generateHarvestReport(req.user._id, period, startDate, endDate, req.user.role);
    } else if (type === 'expense') {
      reportData = await generateExpenseReport(req.user._id, period, startDate, endDate, req.user.role);
    } else if (type === 'summary') {
      reportData = await generateSummaryReport(req.user._id, period, startDate, endDate, req.user.role);
    }

    const report = new Report({
      userId: req.user._id,
      type,
      period,
      data: reportData,
      startDate,
      endDate,
    });

    await report.save();
    return res.success(report, 'Report generated successfully', 201);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/:id
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, userId: req.user._id });
    if (!report) return res.status(404).error('Report not found', 404);
    return res.success(report);
  } catch (error) {
    next(error);
  }
});

/**
 * Helper: Generate harvest report
 */
async function generateHarvestReport(userId, period, startDate, endDate, role) {
  const query = { isDeleted: false };
  
  if (role === 'FARMER') {
    query.farmer_id = userId;
  } else {
    query.userId = userId;
  }

  if (startDate && endDate) {
    query.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const jobs = await HarvesterJob.find(query).lean();
  return {
    totalJobs: jobs.length,
    totalArea: jobs.reduce((sum, j) => sum + (j.area || 0), 0),
    averageArea: jobs.length > 0 ? (jobs.reduce((sum, j) => sum + (j.area || 0), 0) / jobs.length).toFixed(2) : 0,
    byLocation: groupBy(jobs, 'location'),
  };
}

/**
 * Helper: Generate expense report
 */
async function generateExpenseReport(userId, period, startDate, endDate, role) {
  const query = { isDeleted: false };
  
  if (role === 'DRIVER') {
    query.driver_id = userId;
  } else {
    query.userId = userId;
  }

  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const expenses = await Expense.find(query).lean();
  return {
    totalExpenses: expenses.length,
    totalAmount: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    byCategory: groupBy(expenses, 'category'),
  };
}

/**
 * Helper: Generate summary report
 */
async function generateSummaryReport(userId, period, startDate, endDate, role) {
  const harvestData = await generateHarvestReport(userId, period, startDate, endDate, role);
  const expenseData = await generateExpenseReport(userId, period, startDate, endDate, role);

  return {
    period,
    harvest: harvestData,
    expenses: expenseData,
    balance: (harvestData.totalArea * 1000 - expenseData.totalAmount).toFixed(2), // Dummy calculation for area to money
  };
}

function groupBy(array, property) {
  return array.reduce((groups, item) => {
    const key = item[property] || 'unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
}

module.exports = router;
