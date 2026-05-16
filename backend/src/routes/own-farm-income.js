const express = require('express');
const router = express.Router();
const OwnFarmIncome = require('../models/OwnFarmIncome');
const { authenticateToken } = require('../middleware/auth');
const auditLog = require('../middleware/audit');

// @route   POST /api/own-farm-income
router.post('/', authenticateToken, auditLog('CREATE', 'OwnFarmIncome'), async (req, res, next) => {
  try {
    // Normalization Layer for V3.1 Frontend Mapping
    const mappedData = {
      ...req.body,
      type: req.body.type || req.body.incomeSource,
      quantity: req.body.quantity || req.body.numberOfBags || req.body.numberOfBundles || 0,
      price_per_unit: req.body.price_per_unit || req.body.pricePerBag || req.body.pricePerBundle || 0,
      total_amount: req.body.total_amount || req.body.totalIncome || 0,
      createdBy: req.user?._id
    };

    const income = new OwnFarmIncome(mappedData);
    
    // Fallback calculation
    if (!income.total_amount && income.quantity && income.price_per_unit) {
        income.total_amount = income.quantity * income.price_per_unit;
    }
    
    await income.save();
    return res.success(income, 'Income record created', 201);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/own-farm-income
router.get('/', authenticateToken, async (req, res, next) => {
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

    return res.success(records, 'Income records retrieved', 200, {
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/own-farm-income/summary
router.get('/summary/aggregate', authenticateToken, async (req, res, next) => {
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
    return res.success(summary, 'Income summary retrieved');
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/own-farm-income/:id
router.put('/:id', authenticateToken, auditLog('UPDATE', 'OwnFarmIncome'), async (req, res, next) => {
  try {
    const record = await OwnFarmIncome.findOne({ _id: req.params.id, isDeleted: false });
    if (!record) return res.status(404).error('Record not found', 404);

    Object.assign(record, req.body);
    await record.save();

    return res.success(record, 'Income record updated');
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/own-farm-income/:id
router.delete('/:id', authenticateToken, auditLog('DELETE', 'OwnFarmIncome'), async (req, res, next) => {
  try {
    const record = await OwnFarmIncome.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!record) return res.status(404).error('Record not found', 404);
    return res.success({ id: record._id }, 'Record deleted successfully');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
