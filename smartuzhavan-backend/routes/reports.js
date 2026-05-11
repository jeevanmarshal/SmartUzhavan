const express = require('express');
const { createObjectCsvStringifier } = require('csv-writer');
const ExcelJS = require('exceljs');
const Farmer = require('../models/Farmer');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/summary
router.get('/summary', isAuthenticated, async (req, res) => {
  try {
    const stats = await Farmer.aggregate([
      { $match: { isDeleted: false } },
      { 
        $group: {
          _id: null,
          totalFarmers: { $sum: 1 },
          totalLandArea: { $sum: '$landArea' },
          cropList: { $push: '$crops' },
          villages: { $addToSet: '$village' }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        success: true,
        data: {
          totalFarmers: 0,
          totalLandArea: 0,
          uniqueVillages: 0,
          cropDistribution: {}
        }
      });
    }

    const result = stats[0];
    
    // Process crop distribution
    const cropDistribution = {};
    result.cropList.flat().forEach(crop => {
      if (crop) {
        cropDistribution[crop] = (cropDistribution[crop] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: {
        totalFarmers: result.totalFarmers,
        totalLandArea: Math.round(result.totalLandArea * 100) / 100,
        uniqueVillages: result.villages.length,
        cropDistribution
      }
    });
  } catch (error) {
    logger.error(`Report summary error: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to generate summary' } });
  }
});

// GET /api/reports/farmers/export
router.get('/farmers/export', isAuthenticated, async (req, res) => {
  try {
    const format = req.query.format || 'csv'; // 'csv' or 'excel'
    const farmers = await Farmer.find({ isDeleted: false }).sort({ createdAt: -1 });

    if (format === 'csv') {
      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'name', title: 'Name' },
          { id: 'phone', title: 'Phone' },
          { id: 'village', title: 'Village' },
          { id: 'landArea', title: 'Land Area' },
          { id: 'soilType', title: 'Soil Type' },
          { id: 'crops', title: 'Crops' }
        ]
      });

      const records = farmers.map(f => ({
        name: f.name,
        phone: f.phone || 'N/A',
        village: f.village,
        landArea: f.landArea,
        soilType: f.soilType,
        crops: f.crops.join(', ')
      }));

      const header = csvStringifier.getHeaderString();
      const csvData = csvStringifier.stringifyRecords(records);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="farmers_export.csv"');
      return res.send(header + csvData);
    } 
    
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Farmers');

      worksheet.columns = [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Village', key: 'village', width: 20 },
        { header: 'Land Area', key: 'landArea', width: 15 },
        { header: 'Soil Type', key: 'soilType', width: 15 },
        { header: 'Crops', key: 'crops', width: 30 }
      ];

      farmers.forEach(f => {
        worksheet.addRow({
          name: f.name,
          phone: f.phone || 'N/A',
          village: f.village,
          landArea: f.landArea,
          soilType: f.soilType,
          crops: f.crops.join(', ')
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="farmers_export.xlsx"');
      
      await workbook.xlsx.write(res);
      return res.end();
    }

    res.status(400).json({ success: false, message: 'Invalid export format. Use ?format=csv or ?format=excel' });
  } catch (error) {
    logger.error(`Export error: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to export data' } });
  }
});

// GET /api/reports/audit-log
router.get('/audit-log', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.action) query.action = req.query.action;
    if (req.query.entity) query.entity = req.query.entity;
    if (req.query.userId) query.userId = req.query.userId;

    const logs = await AuditLog.find(query)
      .populate('userId', 'username email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      }
    });
  } catch (error) {
    logger.error(`Audit log fetch error: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch audit logs' } });
  }
});

module.exports = router;
