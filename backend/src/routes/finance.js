const express = require('express');
const Finance = require('../models/Finance');
const Expense = require('../models/Expense');
const HarvesterJob = require('../models/HarvesterJob');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/finance/summary
 */
router.get('/summary', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [finances, expenses, harvests] = await Promise.all([
      Finance.find({ userId, isDeleted: false }).lean(),
      Expense.find({ userId, isDeleted: false }).lean(),
      HarvesterJob.find({ userId, isDeleted: false }).lean(),
    ]);

    const totalIncome = finances
      .filter(f => f.type === 'income')
      .reduce((sum, f) => sum + (f.amount || 0), 0);

    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalArea = harvests.reduce((sum, h) => sum + (h.area || 0), 0);

    const netProfit = totalIncome - totalExpense;

    const summary = {
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpense: parseFloat(totalExpense.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2)),
      totalArea,
      profitMargin: totalIncome > 0
        ? parseFloat(((netProfit / totalIncome) * 100).toFixed(2))
        : 0,
      lastUpdated: new Date(),
    };

    return res.success(summary, 'Financial summary retrieved', 200);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/finance
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const finances = await Finance.find({ userId: req.user._id, isDeleted: false })
      .sort({ date: -1 })
      .lean();

    return res.success(finances, 'Financial records retrieved', 200);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/finance
 */
router.post('/', authenticateToken, authorize('ADMIN', 'FARMER'), async (req, res, next) => {
  try {
    const { type, amount, description, category, date } = req.body;

    if (!type || !amount || !description) {
      return res.fail({
        type: !type ? 'required' : null,
        amount: !amount ? 'required' : null,
        description: !description ? 'required' : null,
      }, 'Missing required fields', 400);
    }

    const validTypes = ['income', 'expense', 'loan', 'investment'];
    if (!validTypes.includes(type)) {
      return res.fail({ type: `must be one of: ${validTypes.join(', ')}` }, 'Invalid transaction type', 400);
    }

    if (amount <= 0) {
      return res.fail({ amount: 'must be positive' }, 'Invalid amount', 400);
    }

    const finance = new Finance({
      userId: req.user._id,
      type,
      amount,
      description,
      category: category || 'general',
      date: date || new Date(),
    });

    await finance.save();
    return res.success(finance, 'Financial record created', 201);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/finance/:id
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const finance = await Finance.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isDeleted: true },
      { new: true }
    );

    if (!finance) return res.status(404).error('Financial record not found', 404);
    return res.success(null, 'Financial record deleted');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
