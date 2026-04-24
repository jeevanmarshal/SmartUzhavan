const express = require('express');
const cors = require('cors');
const { generateHarvesterBill, generateStatement, generateRentalReceipt, generateDriverSalaryStatement, generateOutstandingReport } = require('./pdfGenerator');

const app = express();
app.use(cors());
app.use(express.json());

// API to generate Harvester Bill
app.post('/api/pdf/harvester-bill', async (req, res) => {
    try {
        const { job, farmer } = req.body;
        const pdfBuffer = await generateHarvesterBill(job, farmer);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Bill_${job.billId}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    }
});

// API to generate Statement
app.post('/api/pdf/statement', async (req, res) => {
    try {
        const { farmer, jobs, rentals } = req.body;
        const pdfBuffer = await generateStatement(farmer, jobs, rentals);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Statement_${farmer.id}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    }
});

// API to generate Rental Receipt
app.post('/api/pdf/rental-receipt', async (req, res) => {
    try {
        const { rental, farmer } = req.body;
        const pdfBuffer = await generateRentalReceipt(rental, farmer);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Rental_${rental.id}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    }
});

// API to generate Driver Salary Statement
app.post('/api/pdf/driver-salary-statement', async (req, res) => {
    try {
        const { driver, salaryRecords, fromDate, toDate } = req.body;
        const pdfBuffer = await generateDriverSalaryStatement(driver, salaryRecords, fromDate, toDate);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Salary_${driver.name}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    }
});

// API to generate Outstanding Balance Report
app.post('/api/pdf/outstanding-report', async (req, res) => {
    try {
        const { fy, data } = req.body;
        const pdfBuffer = await generateOutstandingReport(fy, data);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Outstanding_Report_${fy}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`PDF Server running on port ${PORT}`);
});
