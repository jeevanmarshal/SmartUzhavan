import axios from 'axios';

/**
 * Unified API Service V6
 * Handles JSend response format automatically
 * Manages auth tokens, refreshes, and error handling
 */

const getBackendUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) return 'http://localhost:5000';
  return 'https://smartuzhavan-production.up.railway.app';
};

const API_BASE_URL = getBackendUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    const data = response.data;
    
    if (data.status === 'success') {
      // If login, store token
      if (response.config.url.includes('/auth/login') && data.data.token) {
        localStorage.setItem('authToken', data.data.token);
      }
      return data.data;
    }
    
    if (data.status === 'fail') {
      const error = new Error(data.message || 'Validation failed');
      error.details = data.data;
      return Promise.reject(error);
    }

    return Promise.reject(new Error(data.message || 'Operation failed'));
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    const msg = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(msg));
  }
);

// --- Modular Services ---

export const authService = {
  login: (identifier, password) => api.post('/api/auth/login', { identifier, password }),
  signup: (userData) => api.post('/api/auth/signup', userData),
  logout: () => api.post('/api/auth/logout'),
  getMe: () => api.get('/api/auth/me'),
};

export const expenseService = {
  getAll: () => api.get('/api/expenses'),
  create: (data) => api.post('/api/expenses', data),
  update: (id, data) => api.put(`/api/expenses/${id}`, data),
  delete: (id) => api.delete(`/api/expenses/${id}`),
};

export const driverService = {
  getAll: () => api.get('/api/drivers'),
  getById: (id) => api.get(`/api/drivers/${id}`),
  login: (phone, pin) => api.post('/api/drivers/login', { phone, pin }),
};

export const farmerService = {
  getAll: () => api.get('/api/farmers'),
  getById: (id) => api.get(`/api/farmers/${id}`),
  create: (data) => api.post('/api/farmers', data),
};

export const harvesterService = {
  getAll: () => api.get('/api/harvester'),
  getById: (id) => api.get(`/api/harvester/${id}`),
  create: (data) => api.post('/api/harvester', data),
  update: (id, data) => api.put(`/api/harvester/${id}`, data),
  delete: (id) => api.delete(`/api/harvester/${id}`),
  linkLogs: (id, logIds) => api.post(`/api/harvester/${id}/link-logs`, { logIds }),
};

export const financeService = {
  getSummary: () => api.get('/api/finance/summary'),
  getAll: () => api.get('/api/finance'),
  create: (data) => api.post('/api/finance', data),
  update: (id, data) => api.put(`/api/finance/${id}`, data),
  delete: (id) => api.delete(`/api/finance/${id}`),
};

export const reportService = {
  getSummary: () => api.get('/api/reports/summary'),
  getAll: () => api.get('/api/reports'),
  create: (data) => api.post('/api/reports', data),
  download: (id) => api.get(`/api/reports/${id}/download`, { responseType: 'blob' }),
};

// Legacy compatibility mapping for V3.1 components
export const apiService = {
  // Auth
  login: authService.login,
  driverLogin: driverService.login,
  request: (method, url, data) => api({ method, url, data }), // Generic request helper used in legacy
  
  // Harvester
  getHarvesterJobs: harvesterService.getAll,
  getHarvesterJob: harvesterService.getById,
  createHarvesterJob: harvesterService.create,
  updateHarvesterJob: harvesterService.update,
  deleteHarvesterJob: harvesterService.delete,
  
  // Expenses
  getExpenses: expenseService.getAll,
  getExpense: expenseService.getById,
  createExpense: expenseService.create,
  updateExpense: expenseService.update,
  deleteExpense: expenseService.delete,
  
  // Farmers
  getFarmers: farmerService.getAll,
  getFarmer: farmerService.getById,
  createFarmer: farmerService.create,
  updateFarmer: farmerService.update,
  deleteFarmer: farmerService.delete,
  
  // Finance
  getDashboardSummary: financeService.getSummary,
  getFinanceRecords: financeService.getAll,
  createFinanceRecord: financeService.create,
  updateFinanceRecord: financeService.update,
  deleteFinanceRecord: financeService.delete,

  // Drivers
  getDrivers: driverService.getAll,
  getAllDriverSalaries: () => api.get('/api/drivers/salaries/all'), // Specific endpoint used in Harvester.jsx
  
  // Reports
  getReports: reportService.getAll,
  createReport: reportService.create,
  downloadReport: reportService.download,
  
  // Settings
  getSettings: () => api.get('/api/settings'),
};

export default api;
