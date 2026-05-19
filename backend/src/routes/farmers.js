const express = require('express');
const { body, validationResult } = require('express-validator');
const Farmer = require('../models/Farmer');
const AuditLog = require('../models/AuditLog');
const ChangeHistory = require('../models/ChangeHistory');
const { authenticateToken } = require('../middleware/auth');
const auditLog = require('../middleware/audit');

const router = express.Router();

/**
 * @route   GET /api/farmers
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    
    const query = { isDeleted: false };
    if (req.query.search) query.$text = { $search: req.query.search };
    if (req.query.village) query.village = req.query.village;
    if (req.query.crop) query.crops = req.query.crop;
    
    const farmers = await Farmer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Farmer.countDocuments(query);
    console.log(`[Farmers API] Found ${farmers.length} farmers out of ${total} total.`);
    
    return res.success(farmers, 'Farmers retrieved', 200, {
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/farmers
 */
router.post('/', 
  authenticateToken,
  [
    body('name').isLength({ min: 2, max: 100 }),
    body('village').isLength({ min: 2, max: 50 }),
    body('landArea').optional().isFloat({ min: 0.01 }),
    body('phone').optional().matches(/^(\+91)?[6-9]\d{9}$/),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.fail(errors.array(), 'Validation failed');

    try {
      const farmer = new Farmer({
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id
      });
      
      await farmer.save();
      
      // Audit and history (simplified for brevity, should follow V6 patterns)
      await AuditLog.create({ userId: req.user._id, action: 'CREATE', entity: 'farmers', entityId: farmer._id, afterData: farmer.toObject() });
      await ChangeHistory.create({ documentId: farmer._id, documentType: 'farmers', version: 1, data: farmer.toObject(), changedBy: req.user._id });

      return res.success(farmer, 'Farmer created successfully', 201);
    } catch (error) {
      next(error);
    }
});

/**
 * @route   GET /api/farmers/:id
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const farmer = await Farmer.findById(req.params.id);
    if (!farmer) return res.status(404).error('Farmer not found', 404);
    
    const changeHistory = await ChangeHistory.find({ documentId: farmer._id, documentType: 'farmers' })
      .populate('changedBy', 'firstName lastName')
      .sort({ version: -1 });
    
    return res.success({ farmer, changeHistory });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/farmers/:id
 */
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const farmer = await Farmer.findById(req.params.id);
    if (!farmer) return res.status(404).error('Farmer not found', 404);
    
    Object.assign(farmer, req.body);
    farmer.updatedBy = req.user._id;
    await farmer.save();
    
    return res.success(farmer, 'Farmer updated successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/farmers/:id
 */
router.delete('/:id', authenticateToken, auditLog('DELETE', 'Farmer'), async (req, res, next) => {
  try {
    const farmer = await Farmer.findByIdAndUpdate(req.params.id, { isDeleted: true, updatedBy: req.user._id }, { new: true });
    if (!farmer) return res.status(404).error('Farmer not found', 404);
    return res.success({ id: farmer._id, isDeleted: true }, 'Farmer deleted successfully');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
