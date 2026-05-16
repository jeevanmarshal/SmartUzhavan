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

    return res.success(rentals, 'Rentals retrieved', 200, {
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
router.post('/', isAuthenticated, auditLog('CREATE', 'Rental'), async (req, res) => {
  try {
    // Normalization Layer for V3.1 Frontend Mapping
    let status = req.body.status;
    if (status === 'active') status = 'in-progress';
    if (!['scheduled', 'in-progress', 'completed'].includes(status)) status = 'scheduled';

    const mappedData = {
      ...req.body,
      equipment: req.body.equipment || req.body.machineType,
      farmer_id: req.body.farmer_id || req.body.farmerId,
      hours: parseFloat(req.body.hours || req.body.quantity || 0),
      ratePerHour: parseFloat(req.body.ratePerHour || req.body.ratePerUnit || 0),
      startDate: req.body.startDate || req.body.date || new Date(),
      status
    };

    mappedData.totalAmount = parseFloat(req.body.totalAmount || req.body.totalPrice || (mappedData.hours * mappedData.ratePerHour) || 0);

    if (!mappedData.equipment || !mappedData.farmer_id) {
      return res.status(400).json({ success: false, message: 'Equipment and Farmer are required' });
    }

    const rental = new Rental({
      ...mappedData,
      createdBy: req.user._id
    });

    await rental.save();
    return res.success(rental, 'Rental created successfully', 201);
  } catch (error) {
    logger.error(`Create rental error: ${error.message}`);
    res.status(500).json({ success: false, error: { message: error.message || 'Server Error' } });
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

    if (!rental) return res.status(404).error('Rental not found', 404);
    return res.success(rental, 'Rental updated');
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
