const express = require('express');
const { body, validationResult } = require('express-validator');
const Farmer = require('../models/Farmer');
const AuditLog = require('../models/AuditLog');
const ChangeHistory = require('../models/ChangeHistory');
const logger = require('../utils/logger');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// GET /api/farmers
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // Search
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    
    // Filters
    if (req.query.village) query.village = req.query.village;
    if (req.query.crop) query.crops = req.query.crop;
    
    const farmers = await Farmer.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Farmer.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        farmers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          recordsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    logger.error(`Get farmers error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// POST /api/farmers
router.post('/', [
  body('name').isLength({ min: 2, max: 100 }),
  body('village').isLength({ min: 2, max: 50 }),
  body('landArea').isFloat({ min: 0.01 }),
  body('phone').optional().matches(/^(\+91)?[6-9]\d{9}$/),
  body('crops').optional().isArray(),
  body('soilType').optional().isIn(['black soil', 'red soil', 'loamy soil', 'clay soil', 'alluvial soil', 'laterite soil', 'other'])
], isAuthenticated, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const farmer = new Farmer({
      ...req.body,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });
    
    await farmer.save();
    
    // Create audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'CREATE',
      entity: 'farmers',
      entityId: farmer._id,
      beforeData: null,
      afterData: farmer.toObject(),
      ipAddress: req.ip
    });
    
    // Create change history v1
    await ChangeHistory.create({
      documentId: farmer._id,
      documentType: 'farmers',
      version: 1,
      data: farmer.toObject(),
      changedBy: req.user._id
    });
    
    logger.info(`Farmer created: ${farmer._id}`);
    
    // Broadcast creation
    const io = req.app.get('io');
    if (io) {
      io.emit('farmer:created', { farmer });
    }
    
    res.status(201).json({
      success: true,
      message: 'Farmer created successfully',
      data: farmer
    });
  } catch (error) {
    logger.error(`Create farmer error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// GET /api/farmers/:id
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id).populate('createdBy', 'username');
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }
    
    const changeHistory = await ChangeHistory.find({
      documentId: farmer._id,
      documentType: 'farmers'
    }).populate('changedBy', 'username').sort({ version: -1 });
    
    res.json({
      success: true,
      data: {
        farmer,
        changeHistory
      }
    });
  } catch (error) {
    logger.error(`Get farmer error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// PUT /api/farmers/:id
router.put('/:id', [
  body('name').optional().isLength({ min: 2, max: 100 }),
  body('village').optional().isLength({ min: 2, max: 50 }),
  body('landArea').optional().isFloat({ min: 0.01 }),
  body('phone').optional().matches(/^(\+91)?[6-9]\d{9}$/),
  body('crops').optional().isArray(),
  body('soilType').optional().isIn(['black soil', 'red soil', 'loamy soil', 'clay soil', 'alluvial soil', 'laterite soil', 'other'])
], isAuthenticated, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const farmer = await Farmer.findById(req.params.id);
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }
    
    const beforeData = farmer.toObject();
    
    Object.assign(farmer, req.body);
    farmer.updatedBy = req.user._id;
    farmer.updatedAt = new Date();
    
    await farmer.save();
    
    // Create audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'UPDATE',
      entity: 'farmers',
      entityId: farmer._id,
      beforeData,
      afterData: farmer.toObject(),
      ipAddress: req.ip
    });
    
    // Create change history
    const lastVersion = await ChangeHistory.findOne({
      documentId: farmer._id
    }).sort({ version: -1 });
    
    const nextVersion = (lastVersion?.version || 0) + 1;
    
    await ChangeHistory.create({
      documentId: farmer._id,
      documentType: 'farmers',
      version: nextVersion,
      data: farmer.toObject(),
      changedBy: req.user._id
    });
    
    logger.info(`Farmer updated: ${farmer._id}`);
    
    // Broadcast update
    const io = req.app.get('io');
    if (io) {
      io.emit('farmer:updated', { farmerId: farmer._id, changes: req.body });
    }
    
    res.json({
      success: true,
      message: 'Farmer updated successfully',
      data: farmer,
      changeHistoryVersion: nextVersion
    });
  } catch (error) {
    logger.error(`Update farmer error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// DELETE /api/farmers/:id
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id);
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found or already deleted'
      });
    }
    
    const beforeData = farmer.toObject();
    
    farmer.isDeleted = true;
    farmer.updatedBy = req.user._id;
    farmer.updatedAt = new Date();
    
    await farmer.save();
    
    // Create audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'DELETE',
      entity: 'farmers',
      entityId: farmer._id,
      beforeData,
      afterData: { isDeleted: true },
      ipAddress: req.ip
    });
    
    logger.info(`Farmer deleted (soft): ${farmer._id}`);
    
    // Broadcast deletion
    const io = req.app.get('io');
    if (io) {
      io.emit('farmer:deleted', { farmerId: farmer._id });
    }
    
    res.json({
      success: true,
      message: 'Farmer deleted successfully',
      data: {
        id: farmer._id,
        isDeleted: true
      }
    });
  } catch (error) {
    logger.error(`Delete farmer error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// GET /api/farmers/:id/history
router.get('/:id/history', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const versions = await ChangeHistory.find({
      documentId: req.params.id,
      documentType: 'farmers'
    })
      .populate('changedBy', 'username')
      .sort({ version: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await ChangeHistory.countDocuments({
      documentId: req.params.id,
      documentType: 'farmers'
    });
    
    res.json({
      success: true,
      data: {
        farmerId: req.params.id,
        versions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalVersions: total
        }
      }
    });
  } catch (error) {
    logger.error(`Get history error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' }
    });
  }
});

// POST /api/farmers/:id/restore/:version
router.post('/:id/restore/:version', isAuthenticated, async (req, res) => {
  try {
    const version = parseInt(req.params.version);
    const farmer = await Farmer.findById(req.params.id);
    
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }
    
    const changeRecord = await ChangeHistory.findOne({
      documentId: req.params.id,
      documentType: 'farmers',
      version
    });
    
    if (!changeRecord) {
      return res.status(404).json({ success: false, message: 'Version not found' });
    }
    
    const beforeData = farmer.toObject();
    Object.assign(farmer, changeRecord.data);
    farmer.updatedBy = req.user._id;
    farmer.updatedAt = new Date();
    await farmer.save();
    
    // Create audit log and new version
    await AuditLog.create({
      userId: req.user._id,
      action: 'RESTORE',
      entity: 'farmers',
      entityId: farmer._id,
      beforeData,
      afterData: farmer.toObject(),
      metadata: { restoredFrom: version },
      ipAddress: req.ip
    });
    
    const lastVersion = await ChangeHistory.findOne({
      documentId: farmer._id
    }).sort({ version: -1 });
    
    await ChangeHistory.create({
      documentId: farmer._id,
      documentType: 'farmers',
      version: (lastVersion?.version || 0) + 1,
      data: farmer.toObject(),
      changedBy: req.user._id
    });
    
    logger.info(`Farmer restored from version ${version}: ${farmer._id}`);
    
    res.json({
      success: true,
      message: `Farmer restored to version ${version}`,
      data: farmer
    });
  } catch (error) {
    logger.error(`Restore error: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } });
  }
});

module.exports = router;
