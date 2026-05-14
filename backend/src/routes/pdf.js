const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { isAuthenticated } = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware to standard format responses
const sendError = (res, statusCode, code, message, details = {}) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  });
};

// @route   POST /api/pdf/harvester-bill
router.post('/harvester-bill', isAuthenticated, async (req, res) => {
  try {
    const { job, farmer } = req.body;
    
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Bill_${job?.billId || 'draft'}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Header
    doc.fontSize(20).text('Harvester Bill', { align: 'center' });
    doc.moveDown();
    
    // Details
    doc.fontSize(12);
    doc.text(`Bill ID: ${job?.billId || 'N/A'}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    
    doc.text(`Farmer Name: ${farmer?.name || 'N/A'}`);
    doc.text(`Village: ${farmer?.village || 'N/A'}`);
    doc.moveDown();
    
    doc.text(`Machine Type: ${job?.machineType || 'N/A'}`);
    doc.text(`Total Hours: ${job?.totalHours || 0}`);
    doc.text(`Rate Per Hour: Rs. ${job?.ratePerHour || 0}`);
    doc.moveDown();
    
    doc.fontSize(14).text(`Total Amount: Rs. ${job?.finalAmount || 0}`, { underline: true });
    
    doc.end();
  } catch (error) {
    logger.error(`PDF generation error: ${error.message}`);
    if (!res.headersSent) {
      return sendError(res, 500, 'SERVER_ERROR', 'Failed to generate PDF');
    }
  }
});

// @route   POST /api/pdf/rental-receipt
router.post('/rental-receipt', isAuthenticated, async (req, res) => {
  try {
    const { rental, farmer } = req.body;
    
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Rental_${rental?._id || 'draft'}.pdf`);
    
    doc.pipe(res);
    
    doc.fontSize(20).text('Rental Receipt', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text(`Date: ${new Date(rental?.date).toLocaleDateString()}`);
    doc.text(`Farmer Name: ${farmer?.name || 'N/A'}`);
    doc.text(`Machine Type: ${rental?.machineType || 'N/A'}`);
    doc.text(`Quantity: ${rental?.quantity || 0} ${rental?.unit || ''}`);
    doc.text(`Rate Per Unit: Rs. ${rental?.ratePerUnit || 0}`);
    doc.moveDown();
    
    doc.fontSize(14).text(`Total Amount: Rs. ${rental?.totalAmount || 0}`, { underline: true });
    
    doc.end();
  } catch (error) {
    logger.error(`PDF generation error: ${error.message}`);
    if (!res.headersSent) {
      return sendError(res, 500, 'SERVER_ERROR', 'Failed to generate PDF');
    }
  }
});

// @route   POST /api/pdf/statement
router.post('/statement', isAuthenticated, async (req, res) => {
  try {
    const { farmer, jobs, rentals } = req.body;
    
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Statement_${farmer?._id || 'draft'}.pdf`);
    
    doc.pipe(res);
    
    doc.fontSize(20).text('Account Statement', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text(`Farmer Name: ${farmer?.name || 'N/A'}`);
    doc.text(`Village: ${farmer?.village || 'N/A'}`);
    doc.moveDown();
    
    doc.fontSize(14).text('Jobs:');
    doc.fontSize(10);
    (jobs || []).forEach(j => {
      doc.text(`- ${j.billId}: Rs. ${j.finalAmount}`);
    });
    doc.moveDown();
    
    doc.fontSize(14).text('Rentals:');
    doc.fontSize(10);
    (rentals || []).forEach(r => {
      doc.text(`- ${r.machineType} (${r.quantity}): Rs. ${r.totalAmount}`);
    });
    
    doc.end();
  } catch (error) {
    logger.error(`PDF generation error: ${error.message}`);
    if (!res.headersSent) {
      return sendError(res, 500, 'SERVER_ERROR', 'Failed to generate PDF');
    }
  }
});

module.exports = router;
