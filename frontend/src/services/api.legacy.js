import axios from 'axios';

// ============================================
// BACKEND URL CONFIGURATION (IMPROVED - Issue #2 Fixed)
// ============================================

/**
 * Intelligently select backend URL based on environment
 * Priority:
 * 1. Environment variable (Vercel production)
 * 2. Development mode (local dev server)
 * 3. Production fallback
 */
const getBackendUrl = () => {
  // 1. Environment variable from Vercel (has priority)
  if (import.meta.env.VITE_API_URL) {
    console.log('[API] Using VITE_API_URL from environment:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  // 2. Development environment (local dev server)
  if (import.meta.env.DEV) {
    console.log('[API] DEV mode detected, using localhost');
    return 'http://localhost:5000/api';
  }

  // 3. Production fallback
  const fallback = 'https://smartuzhavan-production.up.railway.app/api';
  console.log('[API] Using production fallback:', fallback);
  return fallback;
};

const API_BASE_URL = getBackendUrl();
console.log('[API Service] Backend URL configured:', API_BASE_URL);

// ============================================
// AXIOS INSTANCE CONFIGURATION
// ============================================

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 second timeout
  withCredentials: true, // ✅ CRITICAL: Send cookies in cross-origin requests
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// ============================================
// REQUEST INTERCEPTOR (IMPROVED - Issue #3 Fixed)
// ============================================

api.interceptors.request.use(
  (config) => {
    // Log requests in development mode
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, {
        withCredentials: config.withCredentials,
        baseURL: config.baseURL,
      });
    }

    // Add authorization token if available (for future JWT implementation)
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('[API] Request error:', error.message);
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR (IMPROVED - Issue #3 Fixed)
// ============================================

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${response.status} Response:`, response.data);
    }
    return response;
  },
  (error) => {
    // CORS-specific error detection
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.error('[API] Network/CORS Error detected:', {
        url: error.config?.url,
        origin: window.location.origin,
        message: error.message,
      });
      error.corsError = true;
    }

    // 401: Unauthorized - clear session and redirect to login
    if (error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized - clearing session and redirecting to login');
      localStorage.removeItem('user');
      localStorage.removeItem('session');
      
      // Only redirect if not already on login page (prevent infinite loop)
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // 403: Forbidden
    if (error.response?.status === 403) {
      console.error('[API] 403 Forbidden:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// ============================================
// API SERVICE CLASS
// ============================================

class APIService {
  constructor() {
    this.cache = {};
  }

  async request(method, endpoint, data = null, params = null) {
    const cacheKey = `${method}_${endpoint}_${JSON.stringify(params || {})}`;

    try {
      const response = await api({
        method,
        url: endpoint,
        data,
        params,
      });

      const responseData = response.data.data || response.data;

      // Cache GET requests
      if (method === 'GET') {
        this.cache[cacheKey] = responseData;
        localStorage.setItem(`cache_${cacheKey}`, JSON.stringify(responseData));
      }

      return responseData;
    } catch (error) {
      // Network error: try to use cached data for GET requests
      if (!error.response) {
        if (method === 'GET') {
          const cached =
            this.cache[cacheKey] ||
            JSON.parse(localStorage.getItem(`cache_${cacheKey}`));
          if (cached) {
            console.warn('[API] Network error - returning cached data');
            return cached;
          }
        }
        throw new Error('Network error. Please check your connection.');
      }

      const errorMessage =
        error.response.data?.error?.message ||
        error.response.data?.message ||
        error.message ||
        'An error occurred';
      throw new Error(errorMessage);
    }
  }

  // --- Auth APIs ---
  login(username, password) {
    return this.request('POST', '/auth/login', { username, password });
  }

  driverLogin(phone, pin) {
    return this.request('POST', '/drivers/login', { phone, pin });
  }

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
  getAllDriverSalaries(params = {}) { return this.request('GET', '/drivers/salary/all', null, params); }
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
  createFinanceRecord(recordData) { return this.request('POST', '/finance-records', recordData); }
  updateFinanceRecord(id, recordData) { return this.request('PUT', `/finance-records/${id}`, recordData); }
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

  // --- Search APIs ---
  searchDrivers(query) { return this.request('GET', '/search/drivers', null, { q: query }); }
  searchFarmers(query) { return this.request('GET', '/search/farmers', null, { q: query }); }

  // --- Utility ---
  clearCache() {
    this.cache = {};
    Object.keys(localStorage)
      .filter((key) => key.startsWith('cache_'))
      .forEach((key) => localStorage.removeItem(key));
  }
}

export const apiService = new APIService();
export default apiService;
