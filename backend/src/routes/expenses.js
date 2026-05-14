const express = require('express');
const Expense = require('../models/Expense');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/expenses
 * @desc    List all expenses (admin/finance only)
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const query = { isDeleted: false };
    
    // Non-admins only see their own expenses
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      query.userId = req.user._id;
    }

    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .lean();

    return res.success(expenses, 'Expenses retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/expenses
 * @desc    Create new expense
 */
router.post('/', authenticateToken, async (req, res, next) => {
    const type = req.body.type || req.body.source;
    const { category, amount, description, date } = req.body;

    // Validation
    if (!type || !category || !amount) {
      return res.fail(
        { 
          type: !type ? 'required' : null, 
          category: !category ? 'required' : null, 
          amount: !amount ? 'required' : null 
        },
        'Missing required fields',
        400
      );
    }

    if (amount <= 0) {
      return res.fail({ amount: 'must be positive' }, 'Invalid amount', 400);
    }

    const expense = new Expense({
      userId: req.user._id,
      type,
      category,
      amount,
      description,
      date: date || new Date(),
    });

    await expense.save();
    return res.success(expense, 'Expense created successfully', 201);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/expenses/:id
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const query = { _id: req.params.id, isDeleted: false };
    
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      query.userId = req.user._id;
    }

    const expense = await Expense.findOne(query);

    if (!expense) {
      return res.status(404).error('Expense not found', 404);
    }

    return res.success(expense, 'Expense retrieved', 200);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/expenses/:id
 */
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const query = { _id: req.params.id, isDeleted: false };
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      query.userId = req.user._id;
    }

    const expense = await Expense.findOneAndUpdate(
      query,
      { $set: { ...req.body, updatedAt: new Date() } },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).error('Expense not found', 404);
    }

    return res.success(expense, 'Expense updated successfully', 200);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/expenses/:id
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const query = { _id: req.params.id, isDeleted: false };
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      query.userId = req.user._id;
    }

    const expense = await Expense.findOneAndUpdate(
      query,
      { isDeleted: true },
      { new: true }
    );

    if (!expense) {
      return res.status(404).error('Expense not found', 404);
    }

    return res.success(null, 'Expense deleted successfully', 200);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
