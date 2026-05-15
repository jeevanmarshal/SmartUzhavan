import api from './api';

/**
 * PDF Service - Backend API Implementation
 * This service calls the Node.js backend to generate high-quality PDFs
 * with proper Tamil rendering using NotoSansTamil font.
 */

const downloadPdf = async (endpoint, data, fileName) => {
    try {
        const response = await api.post(`/api/pdf/${endpoint}`, data, {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('PDF Download Error:', error);
        alert('Failed to generate PDF. ' + (error.message || 'Check server connection.'));
    }
};

export const generateHarvesterPDF = (job, farmer) => {
    downloadPdf('harvester-bill', { job, farmer }, `Bill_${job.billId || 'draft'}.pdf`);
};

export const generateRentalPDF = (rental, farmer) => {
    downloadPdf('rental-receipt', { rental, farmer }, `Rental_${rental.id || rental._id}.pdf`);
};

export const generateStatementPDF = (farmer, jobs = [], rentals = []) => {
    downloadPdf('statement', { farmer, jobs, rentals }, `Statement_${farmer.name.replace(/\s+/g, '_')}.pdf`);
};

export const generateSalaryPDF = (driver, salaryRecords, fromDate, toDate) => {
    downloadPdf('driver-salary-statement', { driver, salaryRecords, fromDate, toDate }, `Salary_${driver.name.replace(/\s+/g, '_')}.pdf`);
};

export const generateWorkerPDF = (worker, entries) => {
    downloadPdf('worker/individual', { worker, entries }, `Worker_${worker.name.replace(/\s+/g, '_')}.pdf`);
};

export const generateMonthlyReportPDF = (month, year, incomeRows, expenseRows, totals) => {
    downloadPdf('reports/financial-summary', { month, year, incomeRows, expenseRows, totals }, `Summary_${year}_${month}.pdf`);
};

export default {
    generateHarvesterPDF,
    generateRentalPDF,
    generateStatementPDF,
    generateSalaryPDF,
    generateWorkerPDF,
    generateMonthlyReportPDF
};
