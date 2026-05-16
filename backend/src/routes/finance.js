const express = require('express');
const FinanceLending = require('../models/FinanceLending');
const Expense = require('../models/Expense');
const { authenticateToken } = require('../middleware/auth');
const auditLog = require('../middleware/audit');

const router = express.Router();

/**
 * @route   GET /api/finance/summary
 * @desc    Get financial summary (Income, Expense, Profit)
 */
router.get('/summary', authenticateToken, async (req, res, next) => {
  try {
    const HarvesterJob = require('../models/HarvesterJob');
    
    // 1. Get lending income (repayments)
    const records = await FinanceLending.find({ isDeleted: false });
    const lendingIncome = records.reduce((sum, r) => {
        const paid = (r.payments || []).reduce((pSum, p) => pSum + p.amount, 0);
        return sum + paid;
    }, 0);

    // 2. Get harvest income
    const jobs = await HarvesterJob.find({ isDeleted: false });
    const harvestIncome = jobs.reduce((sum, j) => sum + (j.finalAmount || 0), 0);

    // 3. Get total expenses (Business Expenses + Lending Outflow)
    const expenses = await Expense.find({ isDeleted: false });
    const businessExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const lendingOutflow = records.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    const totalExpense = businessExpenses + lendingOutflow;
    const totalIncome = lendingIncome + harvestIncome;

    res.success({
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      lendingIncome,
      harvestIncome,
      lastUpdated: new Date()
    }, 'Financial summary retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/finance
 * @desc    Get all lending records (V3.1 Compatibility)
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const records = await FinanceLending.find({ isDeleted: false })
      .sort({ date: -1 })
      .populate('farmer_id', 'name village phone');

    return res.success(records, 'Financial records retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/finance
 * @desc    Create a new lending record (V3.1 Compatibility)
 */
router.post('/', authenticateToken, auditLog('CREATE', 'FinanceLending'), async (req, res, next) => {
  try {
    const { personName, amount, description, date, type, farmer_id } = req.body;

    // Normalization Layer
    const financeData = {
      personName,
      farmer_id,
      amount: parseFloat(amount),
      purpose: description, // Map description to purpose
      date: date || new Date(),
      type: type || 'loan',
      createdBy: req.user._id
    };

    if (!financeData.amount || (!financeData.personName && !financeData.farmer_id)) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Amount and either Person Name or Farmer ID are required' 
      });
    }

    const record = new FinanceLending(financeData);
    await record.save();

    return res.success(record, 'Financial record created', 201);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/finance/:id/payments
 * @desc    Add a repayment to a lending record
 */
router.post('/:id/payments', authenticateToken, auditLog('UPDATE', 'FinanceLending'), async (req, res, next) => {
  try {
    const { amount, date, method, notes } = req.body;
    
    const record = await FinanceLending.findById(req.params.id);
    if (!record) return res.status(404).error('Record not found', 404);

    record.payments.push({
      amount: parseFloat(amount),
      date: date || new Date(),
      method: method || 'cash',
      notes
    });

    await record.save();
    return res.success(record, 'Payment added successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/finance/:id
 */
router.delete('/:id', authenticateToken, auditLog('DELETE', 'FinanceLending'), async (req, res, next) => {
  try {
    const record = await FinanceLending.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!record) return res.status(404).error('Record not found', 404);
    return res.success(null, 'Financial record deleted');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
