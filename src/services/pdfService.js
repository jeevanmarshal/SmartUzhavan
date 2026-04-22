/**
 * PDF Service - Backend API Implementation
 * This service calls the Node.js backend to generate high-quality PDFs
 * with proper Tamil rendering and selectable text.
 */

const API_BASE_URL = 'http://localhost:5000/api/pdf';

/**
 * Helper to download PDF from API
 */
const downloadPdf = async (endpoint, data, fileName) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('PDF Download Error:', error);
        alert('Failed to generate PDF. Please ensure the backend server is running.');
    }
};

export const generateHarvesterPDF = (job, farmer) => {
    downloadPdf('harvester-bill', { job, farmer }, `Bill_${job.billId}.pdf`);
};

export const generateRentalPDF = (rental, farmer) => {
    downloadPdf('rental-receipt', { rental, farmer }, `Rental_${rental.id}.pdf`);
};

export const generateStatementPDF = (farmer, jobs = [], rentals = []) => {
    downloadPdf('statement', { farmer, jobs, rentals }, `Statement_${farmer.id}.pdf`);
};
