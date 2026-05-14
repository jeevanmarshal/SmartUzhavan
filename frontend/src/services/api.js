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
  timeout: 30000,
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
      localStorage.removeItem('su_session');
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
  driverLogin: (phone, pin) => api.post('/api/auth/driver-login', { phone, pin }),
  farmerLogin: (phone) => api.post('/api/auth/farmer-login', { phone }),
  signup: (userData) => api.post('/api/auth/signup', userData),
  logout: () => api.post('/api/auth/logout'),
  getMe: () => api.get('/api/auth/me'),
};

export const expenseService = {
  getAll: () => api.get('/api/expenses'),
  getById: (id) => api.get(`/api/expenses/${id}`),
  create: (data) => api.post('/api/expenses', data),
  update: (id, data) => api.put(`/api/expenses/${id}`, data),
  delete: (id) => api.delete(`/api/expenses/${id}`),
};

export const driverService = {
  getAll: () => api.get('/api/drivers'),
  getById: (id) => api.get(`/api/drivers/${id}`),
  create: (data) => api.post('/api/drivers', data),
  update: (id, data) => api.put(`/api/drivers/${id}`, data),
  delete: (id) => api.delete(`/api/drivers/${id}`),
  getSalaries: (id) => api.get(`/api/drivers/${id}/salary-history`),
  getAllSalaries: () => api.get('/api/drivers/salaries/all'),
  createSalary: (data) => api.post('/api/drivers/salaries', data),
  updateSalary: (id, data) => api.put(`/api/drivers/salaries/${id}`, data),
  deleteSalary: (id) => api.delete(`/api/drivers/salaries/${id}`),
};

export const farmerService = {
  getAll: () => api.get('/api/farmers'),
  getById: (id) => api.get(`/api/farmers/${id}`),
  create: (data) => api.post('/api/farmers', data),
  update: (id, data) => api.put(`/api/farmers/${id}`, data),
  delete: (id) => api.delete(`/api/farmers/${id}`),
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
  addPayment: (id, payment) => api.post(`/api/finance/${id}/payments`, payment),
};

export const workerService = {
  getAll: () => api.get('/api/workers'),
  create: (data) => api.post('/api/workers', data),
  update: (id, data) => api.put(`/api/workers/${id}`, data),
  delete: (id) => api.delete(`/api/workers/${id}`),
  getAllRecords: () => api.get('/api/workers/records/all'),
  createRecord: (data) => api.post('/api/workers/records', data),
  deleteRecord: (id) => api.delete(`/api/workers/records/${id}`),
};

export const rentalService = {
  getAll: () => api.get('/api/rentals'),
  create: (data) => api.post('/api/rentals', data),
  update: (id, data) => api.put(`/api/rentals/${id}`, data),
  delete: (id) => api.delete(`/api/rentals/${id}`),
};

export const ownFarmService = {
  getAll: () => api.get('/api/own-farm-income'),
  create: (data) => api.post('/api/own-farm-income', data),
  update: (id, data) => api.put(`/api/own-farm-income/${id}`, data),
  delete: (id) => api.delete(`/api/own-farm-income/${id}`),
};

export const reportService = {
  getAll: () => api.get('/api/reports'),
  create: (data) => api.post('/api/reports', data),
  download: (id) => api.get(`/api/reports/${id}/download`, { responseType: 'blob' }),
};

// Legacy compatibility mapping for V3.1 components
export const apiService = {
  // Common
  request: (method, url, data) => api({ method, url, data }),
  getSettings: () => api.get('/api/settings'),
  getPricingConfig: () => api.get('/api/settings/pricing'),
  updatePricingConfig: (data) => api.put('/api/settings/pricing', data),

  // Auth
  login: authService.login,
  driverLogin: authService.driverLogin,
  farmerLogin: authService.farmerLogin,
  updateProfile: (data) => api.put('/api/auth/profile', data),
  
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
  addFinancePayment: financeService.addPayment,

  // Rentals
  getRentals: rentalService.getAll,
  createRental: rentalService.create,
  updateRental: rentalService.update,
  deleteRental: rentalService.delete,

  // Drivers
  getDrivers: driverService.getAll,
  getDriver: driverService.getById,
  createDriver: driverService.create,
  updateDriver: driverService.update,
  deleteDriver: driverService.delete,
  getDriverSalaries: driverService.getSalaries,
  getAllDriverSalaries: driverService.getAllSalaries,
  createDriverSalary: (driverId, data) => driverService.createSalary({ ...data, driver_id: driverId }),
  updateDriverSalary: driverService.updateSalary,
  deleteDriverSalary: driverService.deleteSalary,
  addDriverSalaryPayment: (id, payment) => api.post(`/api/drivers/salaries/${id}/payments`, payment),

  // Workers
  getWorkers: workerService.getAll,
  createWorker: workerService.create,
  updateWorker: workerService.update,
  deleteWorker: workerService.delete,
  getAllWorkerRecords: workerService.getAllRecords,
  createWorkerRecord: workerService.createRecord,
  deleteWorkerRecord: workerService.deleteRecord,

  // Own Farm
  getOwnFarmIncome: ownFarmService.getAll,
  createOwnFarmIncome: ownFarmService.create,
  updateOwnFarmIncome: ownFarmService.update,
  deleteOwnFarmIncome: ownFarmService.delete,

  // Reports
  getReports: reportService.getAll,
  createReport: reportService.create,
  downloadReport: reportService.download,
};

export default api;
