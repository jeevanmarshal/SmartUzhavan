const express = require('express');
const { body, validationResult } = require('express-validator');
const Rental = require('../models/Rental');
const { isAuthenticated } = require('../middleware/auth');
const auditLog = require('../middleware/audit');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/rentals
// @desc    Get all rentals with filters
// @access  Authenticated
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { status, farmer_id, page = 1, limit = 20 } = req.query;
    const query = { isDeleted: false };

    if (status) query.status = status;
    if (farmer_id) query.farmer_id = farmer_id;

    const skip = (page - 1) * limit;
    const rentals = await Rental.find(query)
      .populate('farmer_id', 'name village phone')
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Rental.countDocuments(query);

    res.json({
      success: true,
      data: rentals,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    logger.error(`Get rentals error: ${error.message}`);
    res.status(500).json({ success: false, error: { message: 'Server Error' } });
  }
});

// @route   POST /api/rentals
// @desc    Create a new rental
// @access  Authenticated
router.post('/', [
  isAuthenticated,
  auditLog('CREATE', 'Rental'),
  [
    body('farmer_id').notEmpty().withMessage('Farmer is required'),
    body('equipment').notEmpty().withMessage('Equipment is required'),
    body('startDate').notEmpty().withMessage('Start date is required'),
    body('hours').isNumeric().withMessage('Hours must be a number'),
    body('ratePerHour').isNumeric().withMessage('Rate per hour must be a number')
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const rental = new Rental({
      ...req.body,
      createdBy: req.user._id
    });

    await rental.save();
    res.status(201).json({ success: true, data: rental });
  } catch (error) {
    logger.error(`Create rental error: ${error.message}`);
    res.status(500).json({ success: false, error: { message: 'Server Error' } });
  }
});

// @route   PUT /api/rentals/:id
// @desc    Update a rental
// @access  Authenticated
router.put('/:id', isAuthenticated, auditLog('UPDATE', 'Rental'), async (req, res) => {
  try {
    const rental = await Rental.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: req.body },
      { new: true }
    );

    if (!rental) return res.status(404).json({ success: false, error: { message: 'Rental not found' } });
    res.json({ success: true, data: rental });
  } catch (error) {
    logger.error(`Update rental error: ${error.message}`);
    res.status(500).json({ success: false, error: { message: 'Server Error' } });
  }
});

// @route   DELETE /api/rentals/:id
// @desc    Soft delete a rental
// @access  Authenticated
router.delete('/:id', isAuthenticated, auditLog('DELETE', 'Rental'), async (req, res) => {
  try {
    const rental = await Rental.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!rental) return res.status(404).json({ success: false, error: { message: 'Rental not found' } });
    res.json({ success: true, message: 'Rental deleted successfully' });
  } catch (error) {
    logger.error(`Delete rental error: ${error.message}`);
    res.status(500).json({ success: false, error: { message: 'Server Error' } });
  }
});

module.exports = router;
