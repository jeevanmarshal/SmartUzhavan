const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { authenticateToken, isSuperAdmin } = require('../middleware/auth');
const auditLog = require('../middleware/audit');

// @route   GET /api/settings
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const settings = await Settings.find({});
    return res.success(settings, 'Settings retrieved');
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/settings/prices
router.get('/prices', authenticateToken, async (req, res, next) => {
  try {
    const prices = await Settings.find({ type: 'prices' });
    return res.success(prices, 'Price settings retrieved');
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/settings/categories
router.get('/categories', authenticateToken, async (req, res, next) => {
  try {
    const categories = await Settings.find({ type: 'categories' });
    return res.success(categories, 'Category settings retrieved');
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/settings/work-types
router.get('/work-types', authenticateToken, async (req, res, next) => {
  try {
    const workTypes = await Settings.find({ type: 'work_types' });
    return res.success(workTypes, 'Work type settings retrieved');
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/settings/pricing
router.get('/pricing', authenticateToken, async (req, res, next) => {
  try {
    const settings = await Settings.findOne({ key: 'pricing' });
    if (!settings) {
      // Return default if not set
      return res.success({
        diesel: { pricePerLitre: 80 },
        harvester: { tyre: 2500, track: 3500 },
        rentals: {}
      }, 'Default pricing returned');
    }
    return res.success(settings.value || settings, 'Pricing settings retrieved');
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/settings/pricing
router.put('/pricing', authenticateToken, isSuperAdmin, auditLog('UPDATE', 'Settings'), async (req, res, next) => {
  try {
    const setting = await Settings.findOneAndUpdate(
      { key: 'pricing' },
      { $set: { value: req.body, lastUpdatedBy: req.user._id } },
      { new: true, upsert: true }
    );
    return res.success(setting.value, 'Pricing settings updated');
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/settings/:key
// @desc    Update setting or create if not exists
router.put('/:key', authenticateToken, isSuperAdmin, auditLog('UPDATE', 'Settings'), async (req, res, next) => {
  try {
    const { key } = req.params;
    const updateData = {
      ...req.body,
      lastUpdatedBy: req.user?._id
    };

    const setting = await Settings.findOneAndUpdate(
      { key },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );
    
    return res.success(setting, 'Setting updated successfully');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
