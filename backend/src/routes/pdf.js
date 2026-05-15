const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const logger = require('../utils/logger');
const pdfService = require('../services/pdfService');

// Helper for error responses
const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message,
    timestamp: new Date().toISOString()
  });
};

// Helper to send PDF buffer
const sendPDF = (res, buffer, filename) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
};

// @route   POST /api/pdf/harvester-bill
router.post('/harvester-bill', isAuthenticated, async (req, res) => {
  try {
    const { job, farmer } = req.body;
    if (!job) return sendError(res, 400, 'Job data required');
    
    const buffer = await pdfService.generateHarvesterBill(job, farmer);
    sendPDF(res, buffer, `Bill_${job.billId || 'draft'}.pdf`);
  } catch (error) {
    logger.error(`Harvester PDF Error: ${error.message}`);
    sendError(res, 500, 'Failed to generate harvester bill PDF');
  }
});

// @route   POST /api/pdf/rental-receipt
router.post('/rental-receipt', isAuthenticated, async (req, res) => {
  try {
    const { rental, farmer } = req.body;
    if (!rental) return sendError(res, 400, 'Rental data required');
    
    const buffer = await pdfService.generateRentalReceipt(rental, farmer);
    sendPDF(res, buffer, `Rental_${rental._id || 'draft'}.pdf`);
  } catch (error) {
    logger.error(`Rental PDF Error: ${error.message}`);
    sendError(res, 500, 'Failed to generate rental receipt PDF');
  }
});

// @route   POST /api/pdf/statement
router.post('/statement', isAuthenticated, async (req, res) => {
  try {
    const { farmer, jobs, rentals } = req.body;
    if (!farmer) return sendError(res, 400, 'Farmer data required');
    
    const buffer = await pdfService.generateStatement(farmer, jobs, rentals);
    sendPDF(res, buffer, `Statement_${farmer.name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    logger.error(`Statement PDF Error: ${error.message}`);
    sendError(res, 500, 'Failed to generate account statement PDF');
  }
});

// @route   POST /api/pdf/driver-salary-statement
router.post('/driver-salary-statement', isAuthenticated, async (req, res) => {
  try {
    const { driver, salaryRecords, fromDate, toDate } = req.body;
    if (!driver) return sendError(res, 400, 'Driver data required');
    
    const buffer = await pdfService.generateDriverSalaryStatement(driver, salaryRecords, fromDate, toDate);
    const filename = `${driver.name.replace(/\s+/g, '_')}-salary.pdf`;
    sendPDF(res, buffer, filename);
  } catch (error) {
    logger.error(`Salary PDF Error: ${error.message}`);
    sendError(res, 500, 'Failed to generate salary statement PDF');
  }
});

// @route   POST /api/pdf/worker/individual
router.post('/worker/individual', isAuthenticated, async (req, res) => {
  try {
    const { worker, entries } = req.body;
    if (!worker) return sendError(res, 400, 'Worker data required');
    
    const buffer = await pdfService.generateWorkerIndividualReport(worker, entries);
    sendPDF(res, buffer, `Worker_${worker.name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    logger.error(`Worker PDF Error: ${error.message}`);
    sendError(res, 500, 'Failed to generate worker report PDF');
  }
});

// @route   POST /api/pdf/reports/financial-summary
router.post('/reports/financial-summary', isAuthenticated, async (req, res) => {
  try {
    const { month, year, incomeRows, expenseRows, totals } = req.body;
    const buffer = await pdfService.generateMonthlyReport(month, year, incomeRows, expenseRows, totals);
    sendPDF(res, buffer, `Summary_${year}_${month}.pdf`);
  } catch (error) {
    logger.error(`Monthly Report PDF Error: ${error.message}`);
    sendError(res, 500, 'Failed to generate financial summary PDF');
  }
});

module.exports = router;
