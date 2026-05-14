const express = require('express');
const router = express.Router();
const HarvesterJob = require('../models/HarvesterJob');
const DriverLog = require('../models/DriverLog');
const { authenticateToken } = require('../middleware/auth');
const auditLog = require('../middleware/audit');

/**
 * @route   POST /api/harvester-jobs
 */
router.post('/', authenticateToken, auditLog('CREATE', 'HarvesterJob'), async (req, res, next) => {
  try {
    const job = new HarvesterJob({
      ...req.body,
      createdBy: req.user._id
    });
    await job.save();
    return res.success(job, 'Harvester job created', 201);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/harvester-jobs
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const queryObj = { isDeleted: false };
    if (req.query.status) queryObj.status = req.query.status;
    if (req.query.farmer_id) queryObj.farmer_id = req.query.farmer_id;

    const jobs = await HarvesterJob.find(queryObj)
      .populate('farmer_id', 'name village phone')
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await HarvesterJob.countDocuments(queryObj);

    return res.success(jobs, 'Harvester jobs retrieved', 200, {
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/harvester-jobs/:id
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const job = await HarvesterJob.findOne({ _id: req.params.id, isDeleted: false })
      .populate('farmer_id', 'name village phone')
      .populate({
        path: 'linkedLogIds',
        match: { isDeleted: false },
        select: 'date totalDuration diesel'
      });
      
    if (!job) return res.status(404).error('Harvester job not found', 404);
    return res.success(job);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/harvester-jobs/:id
 */
router.put('/:id', authenticateToken, auditLog('UPDATE', 'HarvesterJob'), async (req, res, next) => {
  try {
    const job = await HarvesterJob.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!job) return res.status(404).error('Harvester job not found', 404);
    return res.success(job, 'Harvester job updated');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/harvester-jobs/:id
 */
router.delete('/:id', authenticateToken, auditLog('DELETE', 'HarvesterJob'), async (req, res, next) => {
  try {
    const job = await HarvesterJob.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!job) return res.status(404).error('Harvester job not found', 404);
    return res.success({ message: 'Harvester job deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
