const express = require('express');
const cors = require('cors');
const { generateHarvesterBill, generateStatement, generateRentalReceipt, generateDriverSalaryStatement, generateMonthlyReport, generateMachineReport, generateFarmerDuesReport, generateDriverPayrollReport, generateSeasonalReport, generateWorkerIndividualReport, generateWorkerFilteredReport, generateWorkerOverallReport } = require('./pdfGenerator');

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

app.post('/api/pdf/driver-salary-statement', async (req, res) => {
    try {
        const { driver, salaryRecords, fromDate, toDate } = req.body;
        const pdfBuffer = await generateDriverSalaryStatement(driver, salaryRecords, fromDate, toDate);
        
        res.setHeader('Content-Type', 'application/pdf');
        const filename = `${driver.name.replace(/\\s+/g, '_')}-salary-${new Date().toISOString().slice(0,7)}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Salary PDF Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate salary statement', details: error.message });
    }
});

// Monthly Summary Report
app.post('/api/pdf/report/monthly', async (req, res) => {
    try {
        const { month, year, incomeRows, expenseRows, totals } = req.body;
        const pdfBuffer = await generateMonthlyReport(month, year, incomeRows, expenseRows, totals);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="monthly-summary-${year}-${String(month).padStart(2, '0')}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Monthly Report PDF Error:', error);
        res.status(500).json({ error: 'Failed to generate monthly report', details: error.message });
    }
});

// Machine-wise Report
app.post('/api/pdf/report/machine', async (req, res) => {
    try {
        const { season, year, machineRows } = req.body;
        const pdfBuffer = await generateMachineReport(season, year, machineRows);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="machine-report-${season}-${year}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Machine Report PDF Error:', error);
        res.status(500).json({ error: 'Failed to generate machine report', details: error.message });
    }
});

// Farmer Dues Report
app.post('/api/pdf/report/farmer-dues', async (req, res) => {
    try {
        const { farmerRows, asOfDate } = req.body;
        const pdfBuffer = await generateFarmerDuesReport(farmerRows, asOfDate);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="farmer-dues-${asOfDate || new Date().toISOString().slice(0,10)}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Farmer Dues Report PDF Error:', error);
        res.status(500).json({ error: 'Failed to generate farmer dues report', details: error.message });
    }
});

// Driver Payroll Report
app.post('/api/pdf/report/driver-payroll', async (req, res) => {
    try {
        const { month, year, driverRows } = req.body;
        const pdfBuffer = await generateDriverPayrollReport(month, year, driverRows);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="payroll-${year}-${String(month).padStart(2, '0')}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Driver Payroll Report PDF Error:', error);
        res.status(500).json({ error: 'Failed to generate payroll report', details: error.message });
    }
});

// Seasonal Report
app.post('/api/pdf/report/seasonal', async (req, res) => {
    try {
        const { season, year, jobRows, totals } = req.body;
        const pdfBuffer = await generateSeasonalReport(season, year, jobRows, totals);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="seasonal-${season}-${year}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Seasonal Report PDF Error:', error);
        res.status(500).json({ error: 'Failed to generate seasonal report', details: error.message });
    }
});

// Individual Worker Report
app.post('/api/pdf/worker/individual', async (req, res) => {
    try {
        const { worker, entries } = req.body;
        const pdfBuffer = await generateWorkerIndividualReport(worker, entries);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="worker-${worker.name.replace(/\\s+/g, '_')}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Worker Individual PDF Error:', error);
        res.status(500).json({ error: 'Failed to generate worker report', details: error.message });
    }
});

// Filtered Worker Report
app.post('/api/pdf/worker/filtered', async (req, res) => {
    try {
        const { entries, filters } = req.body;
        const pdfBuffer = await generateWorkerFilteredReport(entries, filters);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="workers-filtered-${new Date().toISOString().slice(0,10)}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Worker Filtered PDF Error:', error);
        res.status(500).json({ error: 'Failed to generate filtered report', details: error.message });
    }
});

// Overall Worker Report
app.post('/api/pdf/worker/overall', async (req, res) => {
    try {
        const { summary } = req.body;
        const pdfBuffer = await generateWorkerOverallReport(summary);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="workers-overall-${new Date().toISOString().slice(0,10)}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Worker Overall PDF Error:', error);
        res.status(500).json({ error: 'Failed to generate overall report', details: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`PDF Server running on port ${PORT}`);
});
