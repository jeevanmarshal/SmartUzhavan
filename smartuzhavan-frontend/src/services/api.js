import axios from 'axios';

// Ensure we use the VITE_API_URL variable from the .env file
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://smartuzhavan-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

class APIService {
  constructor() {
    this.cache = {};
  }

  // --- Base Methods with Offline Fallback ---
  async request(method, endpoint, data = null, params = null) {
    const cacheKey = `${method}_${endpoint}_${JSON.stringify(params || {})}`;
    
    try {
      const response = await api({
        method,
        url: endpoint,
        data,
        params,
      });

      const responseData = response.data.data; // Extract from standard V5 envelope

      // Cache successful GET requests
      if (method === 'GET') {
        this.cache[cacheKey] = responseData;
        localStorage.setItem(`cache_${cacheKey}`, JSON.stringify(responseData));
      }

      return responseData;
    } catch (error) {
      // Offline / Network Error Fallback
      if (!error.response) {
        if (method === 'GET') {
          const cached = this.cache[cacheKey] || JSON.parse(localStorage.getItem(`cache_${cacheKey}`));
          if (cached) {
            console.warn(`[OFFLINE] Returning cached data for ${endpoint}`);
            return cached;
          }
        }
        throw new Error('Network error. Please check your connection.');
      }

      // API Errors (e.g., Validation, Not Found, Unauthorized)
      if (error.response.status === 401) {
        window.location.href = '/login'; // Redirect to login on unauthorized
      }

      const errorMessage = error.response.data?.error?.message || error.message;
      throw new Error(errorMessage);
    }
  }

  // --- Auth APIs ---
  login(username, password) { return this.request('POST', '/auth/login', { username, password }); }
  logout() { return this.request('POST', '/auth/logout'); }
  getProfile() { return this.request('GET', '/auth/me'); }

  // --- Drivers APIs ---
  getDrivers(params = {}) { return this.request('GET', '/drivers', null, params); }
  getDriver(id) { return this.request('GET', `/drivers/${id}`); }
  createDriver(data) { return this.request('POST', '/drivers', data); }
  updateDriver(id, data) { return this.request('PUT', `/drivers/${id}`, data); }
  deleteDriver(id) { return this.request('DELETE', `/drivers/${id}`); }

  // --- Driver Salary APIs ---
  getDriverSalaries(driverId) { return this.request('GET', `/drivers/${driverId}/salary-history`); }
  // Provide a generic way to get all salaries by fetching all drivers and their salaries, or implement a backend route for it.
  // For now, if driverId is missing, we might need a dedicated route, but let's assume we fetch per driver or add a generic route later.
  getAllDriverSalaries(params = {}) { return this.request('GET', '/drivers/salary/all', null, params); } // Will need backend update if used
  createDriverSalary(driverId, data) { return this.request('POST', `/drivers/${driverId}/salary`, data); }
  updateDriverSalary(salaryId, data) { return this.request('PUT', `/drivers/salary/${salaryId}`, data); }
  deleteDriverSalary(salaryId) { return this.request('DELETE', `/drivers/salary/${salaryId}`); }
  addDriverSalaryPayment(salaryId, data) { return this.request('POST', `/drivers/salary/${salaryId}/payment`, data); }

  // --- Workers APIs ---
  getWorkers(params = {}) { return this.request('GET', '/workers', null, params); }
  createWorker(data) { return this.request('POST', '/workers', data); }
  updateWorker(id, data) { return this.request('PUT', `/workers/${id}`, data); }
  deleteWorker(id) { return this.request('DELETE', `/workers/${id}`); }

  // --- Worker Records APIs ---
  getAllWorkerRecords(params = {}) { return this.request('GET', '/workers/records/all', null, params); }
  createWorkerRecord(data) { return this.request('POST', '/workers/records', data); }
  updateWorkerRecord(id, data) { return this.request('PUT', `/workers/records/${id}`, data); }
  deleteWorkerRecord(id) { return this.request('DELETE', `/workers/records/${id}`); }

  // --- Farmer APIs ---
  getFarmers(params = {}) { return this.request('GET', '/farmers', null, params); }
  createFarmer(data) { return this.request('POST', '/farmers', data); }
  updateFarmer(id, data) { return this.request('PUT', `/farmers/${id}`, data); }

  // --- Harvester Jobs APIs ---
  getHarvesterJobs(params = {}) { return this.request('GET', '/harvester-jobs', null, params); }
  createHarvesterJob(data) { return this.request('POST', '/harvester-jobs', data); }
  updateHarvesterJob(id, data) { return this.request('PUT', `/harvester-jobs/${id}`, data); }
  deleteHarvesterJob(id) { return this.request('DELETE', `/harvester-jobs/${id}`); }

  // --- Rental APIs ---
  getRentals(params = {}) { return this.request('GET', '/rentals', null, params); }
  createRental(data) { return this.request('POST', '/rentals', data); }
  updateRental(id, data) { return this.request('PUT', `/rentals/${id}`, data); }
  deleteRental(id) { return this.request('DELETE', `/rentals/${id}`); }

  // --- Expenses APIs ---
  getExpenses(params = {}) { return this.request('GET', '/expenses', null, params); }
  createExpense(data) { return this.request('POST', '/expenses', data); }
  updateExpense(id, data) { return this.request('PUT', `/expenses/${id}`, data); }
  deleteExpense(id) { return this.request('DELETE', `/expenses/${id}`); }

  // --- Finance APIs ---
  getFinanceRecords(params = {}) { return this.request('GET', '/finance-records', null, params); }
  createFinanceRecord(data) { return this.request('POST', '/finance-records', data); }
  updateFinanceRecord(id, data) { return this.request('PUT', `/finance-records/${id}`, data); }
  deleteFinanceRecord(id) { return this.request('DELETE', `/finance-records/${id}`); }
  addFinancePayment(id, data) { return this.request('POST', `/finance-records/${id}/payment`, data); }

  // --- Own Farm Income APIs ---
  getOwnFarmIncome(params = {}) { return this.request('GET', '/own-farm-income', null, params); }
  createOwnFarmIncome(data) { return this.request('POST', '/own-farm-income', data); }
  
  // --- Dashboard APIs ---
  getDashboardSummary() { return this.request('GET', '/reports/summary'); }

  // --- Settings APIs ---
  getSettings() { return this.request('GET', '/settings'); }
  updateSettings(data) { return this.request('PUT', '/settings', data); }
  getPricingConfig() { return this.request('GET', '/settings/prices'); }
  updatePricingConfig(data) { return this.request('PUT', '/settings/prices', data); }
}

export const apiService = new APIService();
export default apiService;
