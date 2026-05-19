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
    const jobData = {
      ...req.body,
      userId: req.user._id,
      farmer_id: req.body.farmer_id || req.body.farmerId,
      equipment: req.body.equipment || req.body.machineType,
      location: req.body.location || req.body.village,
      area: req.body.area || req.body.totalHours || 0.1,
      startDate: req.body.startDate || req.body.date || new Date()
    };

    const job = new HarvesterJob(jobData);
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
    
    // Role-based filtering
    if (req.user.role === 'FARMER') {
      queryObj.farmer_id = req.user._id;
    } else {
      if (req.query.farmer_id) queryObj.farmer_id = req.query.farmer_id;
    }
    
    if (req.query.status) queryObj.status = req.query.status;

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

/**
 * @route   POST /api/harvester/:id/link-logs
 * @desc    Link driver logs to a harvester job
 */
router.post('/:id/link-logs', authenticateToken, async (req, res, next) => {
  try {
    const { logIds } = req.body;
    const jobId = req.params.id;

    const job = await HarvesterJob.findOne({ _id: jobId, isDeleted: false });
    if (!job) {
      return res.status(404).error('Harvester job not found', 404);
    }

    // 1. Update HarvesterJob's linkedLogIds
    job.linkedLogIds = logIds || [];
    await job.save();

    // 2. Unlink any driver logs that were previously linked to this job but are not in the new logIds list
    await DriverLog.updateMany(
      { linkedJobId: jobId, _id: { $nin: logIds } },
      { $unset: { linkedJobId: "" } }
    );

    // 3. Link the new driver logs to this job
    if (logIds && logIds.length > 0) {
      await DriverLog.updateMany(
        { _id: { $in: logIds } },
        { $set: { linkedJobId: jobId } }
      );
    }

    return res.success(job, 'Driver logs linked successfully');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
