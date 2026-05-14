# SmartUzhavan V6 Completion Roadmap

**Current Status:** Phases 1-3 Core Complete (50% Overall)  
**Date:** May 2026  
**Next Focus:** Route Standardization + Frontend Integration + Production Hardening

---

## EXECUTIVE STATUS REPORT

### ✅ COMPLETED (Foundation Solid)

**Infrastructure & Organization:**
- ✅ Backend folder restructured (smartuzhavan-backend → backend/src)
- ✅ MongoDB Atlas connection verified
- ✅ Database indexes synchronized
- ✅ V6 folder structure operational

**Response Standardization (Phase 2):**
- ✅ `responseHandler.js` - JSend wrapper class
- ✅ `errorHandler.js` - Global error catch
- ✅ `res.success()`, `res.fail()`, `res.error()` helpers
- ✅ Mongoose validation error formatting
- ✅ JWT error handling
- ✅ All errors return standardized format

**Unified Authentication (Phase 3):**
- ✅ Single User model with RBAC
- ✅ `AuthFactory.js` - centralized login/signup
- ✅ Password hashing with bcrypt
- ✅ JWT token generation (7-day expiry)
- ✅ HTTP-only cookie strategy
- ✅ `auth.js` middleware with role-based authorization
- ✅ Account locking after 5 failed attempts
- ✅ Login attempt tracking

**API Bridge (Frontend):**
- ✅ New `apiService.js` with JSend unwrapping
- ✅ Axios interceptors for token management
- ✅ Automatic 401 redirect
- ✅ Auth token persistence in localStorage

### ⏳ IN PROGRESS (Routes Standardization)

| Route | Status | Completion |
|-------|--------|-----------|
| Auth | ✅ Complete | 100% |
| Drivers | ✅ Complete | 100% |
| Farmers | ✅ Complete | 100% |
| Harvester | ✅ Complete | 100% |
| Workers | ✅ Complete | 100% |
| **Expenses** | ❌ Pending | 0% |
| **Reports** | ❌ Pending | 0% |
| **Finance** | ❌ Pending | 0% |

### Current Blockers

1. **Expenses Route** - Still using legacy response format
2. **Reports Route** - Missing JSend wrapper
3. **Finance Route** - Incomplete error handling
4. **Frontend Components** - Login.jsx and others expect old payload structure
5. **Data Migration** - Existing Drivers/Farmers data not yet migrated to User collection

---

## PHASE 4: ROUTE STANDARDIZATION (IMMEDIATE - Next 2-3 Days)

### 4.1 Migrate Expenses Route

**File:** `/backend/src/routes/expenses.js`

```javascript
const express = require('express');
const Expense = require('../models/Expense');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/expenses
 * List all expenses (admin/finance only)
 */
router.get('/', authenticateToken, authorize('ADMIN', 'FARMER'), async (req, res, next) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.success(expenses, 'Expenses retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/expenses
 * Create new expense
 */
router.post('/', authenticateToken, authorize('ADMIN', 'FARMER'), async (req, res, next) => {
  try {
    const { category, amount, description, date } = req.body;

    // Validation
    if (!category || !amount || !description) {
      return res.fail(
        { category: !category ? 'required' : null, amount: !amount ? 'required' : null },
        'Missing required fields',
        400
      );
    }

    if (amount <= 0) {
      return res.fail({ amount: 'must be positive' }, 'Invalid amount', 400);
    }

    const expense = new Expense({
      userId: req.user._id,
      category,
      amount,
      description,
      date: date || new Date(),
    });

    await expense.save();
    return res.success(expense, 'Expense created successfully', 201);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/expenses/:id
 * Get specific expense
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!expense) {
      return res.fail(null, 'Expense not found', 404);
    }

    return res.success(expense, 'Expense retrieved', 200);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/expenses/:id
 * Update expense
 */
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { category, amount, description, date } = req.body;

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { category, amount, description, date, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.fail(null, 'Expense not found', 404);
    }

    return res.success(expense, 'Expense updated successfully', 200);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/expenses/:id
 * Delete expense
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!expense) {
      return res.fail(null, 'Expense not found', 404);
    }

    return res.success(null, 'Expense deleted successfully', 200);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

**Task Checklist:**
- [ ] Update Expense model to include `userId` field (if not present)
- [ ] Replace all `res.json()` with `res.success()` or `res.fail()`
- [ ] Add validation before creating/updating
- [ ] Test POST, GET, PUT, DELETE endpoints
- [ ] Verify error responses return JSend format
- [ ] Test with Postman

### 4.2 Migrate Reports Route

**File:** `/backend/src/routes/reports.js`

```javascript
const express = require('express');
const Report = require('../models/Report');
const Harvest = require('../models/Harvest');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/reports
 * List all reports for current user
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const query = { userId: req.user._id };
    
    // Filter by type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.success(reports, 'Reports retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/reports
 * Generate new report
 */
router.post('/', authenticateToken, authorize('ADMIN', 'FARMER'), async (req, res, next) => {
  try {
    const { type, period, startDate, endDate } = req.body;

    // Validation
    if (!type || !period) {
      return res.fail(
        { type: !type ? 'required' : null, period: !period ? 'required' : null },
        'Missing required fields',
        400
      );
    }

    const validTypes = ['harvest', 'expense', 'income', 'summary'];
    if (!validTypes.includes(type)) {
      return res.fail(
        { type: `must be one of: ${validTypes.join(', ')}` },
        'Invalid report type',
        400
      );
    }

    // Generate report based on type
    let reportData = {};
    
    if (type === 'harvest') {
      reportData = await generateHarvestReport(req.user._id, period, startDate, endDate);
    } else if (type === 'expense') {
      reportData = await generateExpenseReport(req.user._id, period, startDate, endDate);
    } else if (type === 'summary') {
      reportData = await generateSummaryReport(req.user._id, period, startDate, endDate);
    }

    const report = new Report({
      userId: req.user._id,
      type,
      period,
      data: reportData,
      startDate,
      endDate,
      generatedAt: new Date(),
    });

    await report.save();
    return res.success(report, 'Report generated successfully', 201);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/:id
 * Get specific report
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!report) {
      return res.fail(null, 'Report not found', 404);
    }

    return res.success(report, 'Report retrieved', 200);
  } catch (error) {
    next(error);
  }
});

/**
 * Helper: Generate harvest report
 */
async function generateHarvestReport(userId, period, startDate, endDate) {
  const query = { userId };

  if (startDate && endDate) {
    query.harvestDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const harvests = await Harvest.find(query).lean();

  return {
    totalHarvests: harvests.length,
    totalQuantity: harvests.reduce((sum, h) => sum + (h.quantity || 0), 0),
    averageQuantity: harvests.length > 0
      ? (harvests.reduce((sum, h) => sum + (h.quantity || 0), 0) / harvests.length).toFixed(2)
      : 0,
    byType: groupBy(harvests, 'cropType'),
  };
}

/**
 * Helper: Generate expense report
 */
async function generateExpenseReport(userId, period, startDate, endDate) {
  const Expense = require('../models/Expense');
  
  const query = { userId };

  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const expenses = await Expense.find(query).lean();

  return {
    totalExpenses: expenses.length,
    totalAmount: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    averageAmount: expenses.length > 0
      ? (expenses.reduce((sum, e) => sum + (e.amount || 0), 0) / expenses.length).toFixed(2)
      : 0,
    byCategory: groupBy(expenses, 'category'),
  };
}

/**
 * Helper: Generate summary report
 */
async function generateSummaryReport(userId, period, startDate, endDate) {
  const harvestData = await generateHarvestReport(userId, period, startDate, endDate);
  const expenseData = await generateExpenseReport(userId, period, startDate, endDate);

  return {
    period,
    harvest: harvestData,
    expenses: expenseData,
    profitMargin: (harvestData.totalQuantity - expenseData.totalAmount).toFixed(2),
  };
}

/**
 * Helper: Group array by property
 */
function groupBy(array, property) {
  return array.reduce((groups, item) => {
    const key = item[property] || 'unknown';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
}

module.exports = router;
```

**Task Checklist:**
- [ ] Ensure Report model has `userId`, `type`, `data`, `period` fields
- [ ] Add Harvest model integration if not present
- [ ] Implement report generation helper functions
- [ ] Add date range filtering (startDate, endDate)
- [ ] Test report generation endpoints
- [ ] Verify grouped data is returned correctly
- [ ] Add pagination if needed (for large reports)

### 4.3 Migrate Finance Route

**File:** `/backend/src/routes/finance.js`

```javascript
const express = require('express');
const Finance = require('../models/Finance');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/finance/summary
 * Get financial summary for current user
 */
router.get('/summary', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const Finance = require('../models/Finance');
    const Expense = require('../models/Expense');
    const Harvest = require('../models/Harvest');

    // Get all financial records
    const [finances, expenses, harvests] = await Promise.all([
      Finance.find({ userId }).lean(),
      Expense.find({ userId }).lean(),
      Harvest.find({ userId }).lean(),
    ]);

    // Calculate totals
    const totalIncome = finances
      .filter(f => f.type === 'income')
      .reduce((sum, f) => sum + (f.amount || 0), 0);

    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const totalHarvest = harvests.reduce((sum, h) => sum + (h.quantity || 0), 0);

    const netProfit = totalIncome - totalExpense;

    const summary = {
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpense: parseFloat(totalExpense.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2)),
      totalHarvest,
      profitMargin: totalExpense > 0
        ? parseFloat(((netProfit / totalIncome) * 100).toFixed(2))
        : 0,
      lastUpdated: new Date(),
    };

    return res.success(summary, 'Financial summary retrieved', 200);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/finance
 * List all financial transactions
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const finances = await Finance.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.success(finances, 'Financial records retrieved', 200);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/finance
 * Record financial transaction
 */
router.post('/', authenticateToken, authorize('ADMIN', 'FARMER'), async (req, res, next) => {
  try {
    const { type, amount, description, category, date } = req.body;

    // Validation
    if (!type || !amount || !description) {
      return res.fail(
        {
          type: !type ? 'required' : null,
          amount: !amount ? 'required' : null,
          description: !description ? 'required' : null,
        },
        'Missing required fields',
        400
      );
    }

    const validTypes = ['income', 'expense', 'loan', 'investment'];
    if (!validTypes.includes(type)) {
      return res.fail(
        { type: `must be one of: ${validTypes.join(', ')}` },
        'Invalid transaction type',
        400
      );
    }

    if (amount <= 0) {
      return res.fail({ amount: 'must be positive' }, 'Invalid amount', 400);
    }

    const finance = new Finance({
      userId: req.user._id,
      type,
      amount,
      description,
      category: category || 'general',
      date: date || new Date(),
    });

    await finance.save();
    return res.success(finance, 'Financial record created', 201);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/finance/:id
 * Get specific financial record
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const finance = await Finance.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!finance) {
      return res.fail(null, 'Financial record not found', 404);
    }

    return res.success(finance, 'Financial record retrieved', 200);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/finance/:id
 * Update financial record
 */
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { type, amount, description, category, date } = req.body;

    const finance = await Finance.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { type, amount, description, category, date, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!finance) {
      return res.fail(null, 'Financial record not found', 404);
    }

    return res.success(finance, 'Financial record updated', 200);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/finance/:id
 * Delete financial record
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const finance = await Finance.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!finance) {
      return res.fail(null, 'Financial record not found', 404);
    }

    return res.success(null, 'Financial record deleted', 200);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

**Task Checklist:**
- [ ] Ensure Finance model has `userId`, `type`, `amount`, `description` fields
- [ ] Add `/summary` endpoint for dashboard statistics
- [ ] Implement calculations: totalIncome, totalExpense, netProfit
- [ ] Test all CRUD operations
- [ ] Verify error handling for invalid transaction types
- [ ] Add date range filtering (optional, for future)

---

## PHASE 5: FRONTEND INTEGRATION (Next 3-5 Days)

### 5.1 Update Login Component

**File:** `/frontend/src/pages/Login.jsx`

Current Issue: Component expects old response format
New Format: `{ user: { id, email, role }, token }`

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/apiService';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // authService.login now returns just the user object
      // (JSend wrapper is automatically unwrapped by apiService)
      const user = await authService.login(email, password);

      // The token is automatically stored in localStorage by apiService
      // user object contains: { id, email, firstName, lastName, role, phoneNumber, ... }

      // Store user info for later use
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect based on role
      const dashboardRoutes = {
        ADMIN: '/admin-dashboard',
        DRIVER: '/driver-dashboard',
        FARMER: '/farmer-dashboard',
        USER: '/dashboard',
      };

      navigate(dashboardRoutes[user.role] || '/dashboard');
    } catch (err) {
      // Error message comes from JSend response
      setError(err.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>SmartUzhavan Login</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email or Phone</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email or phone"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="signup-link">
          Don't have an account? <a href="/signup">Sign up here</a>
        </p>
      </div>
    </div>
  );
}
```

### 5.2 Update Signup Component

**File:** `/frontend/src/pages/Signup.jsx`

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/apiService';
import './Signup.css';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'USER',
    driverLicense: '',
    farmSize: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Prepare signup payload
      const signupPayload = {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
      };

      // Add role-specific data
      if (formData.role === 'DRIVER' && formData.driverLicense) {
        signupPayload.roleData = { driverLicense: formData.driverLicense };
      } else if (formData.role === 'FARMER' && formData.farmSize) {
        signupPayload.roleData = { farmSize: parseInt(formData.farmSize) };
      }

      const user = await authService.signup(signupPayload);

      // Token is automatically stored
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to appropriate dashboard
      const dashboardRoutes = {
        ADMIN: '/admin-dashboard',
        DRIVER: '/driver-dashboard',
        FARMER: '/farmer-dashboard',
        USER: '/dashboard',
      };

      navigate(dashboardRoutes[user.role] || '/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h1>Create SmartUzhavan Account</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Phone Number (10 digits) *</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              pattern="[0-9]{10}"
              required
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                minLength="8"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength="8"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Account Type *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="USER">Regular User</option>
              <option value="DRIVER">Driver</option>
              <option value="FARMER">Farmer</option>
            </select>
          </div>

          {formData.role === 'DRIVER' && (
            <div className="form-group">
              <label>Driver License</label>
              <input
                type="text"
                name="driverLicense"
                value={formData.driverLicense}
                onChange={handleChange}
                placeholder="License number"
              />
            </div>
          )}

          {formData.role === 'FARMER' && (
            <div className="form-group">
              <label>Farm Size (hectares)</label>
              <input
                type="number"
                name="farmSize"
                value={formData.farmSize}
                onChange={handleChange}
                placeholder="Farm size in hectares"
                min="0.1"
                step="0.1"
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="signup-button">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
}
```

### 5.3 Update apiService.js (If Not Already Done)

**File:** `/frontend/src/services/apiService.js`

Ensure this is correct:

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor: Add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle JSend format
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data;

    // Success: return just the data
    if (data.status === 'success') {
      return data.data;
    }

    // Fail: validation error
    if (data.status === 'fail') {
      const error = new Error(data.message);
      error.code = data.code;
      error.data = data.data;
      return Promise.reject(error);
    }

    // Error: server error
    if (data.status === 'error') {
      const error = new Error(data.message);
      error.code = data.code;
      return Promise.reject(error);
    }

    return response.data;
  },
  (error) => {
    // Auto-redirect on 401
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authService = {
  signup: (userData) => apiClient.post('/api/auth/signup', userData),
  login: (email, password) => apiClient.post('/api/auth/login', { email, password }),
  logout: () => apiClient.post('/api/auth/logout'),
  refresh: () => apiClient.post('/api/auth/refresh'),
  getMe: () => apiClient.get('/api/auth/me'),
};

// Expenses API
export const expenseService = {
  getAll: () => apiClient.get('/api/expenses'),
  getById: (id) => apiClient.get(`/api/expenses/${id}`),
  create: (data) => apiClient.post('/api/expenses', data),
  update: (id, data) => apiClient.put(`/api/expenses/${id}`, data),
  delete: (id) => apiClient.delete(`/api/expenses/${id}`),
};

// Reports API
export const reportService = {
  getAll: () => apiClient.get('/api/reports'),
  getById: (id) => apiClient.get(`/api/reports/${id}`),
  create: (data) => apiClient.post('/api/reports', data),
};

// Finance API
export const financeService = {
  getSummary: () => apiClient.get('/api/finance/summary'),
  getAll: () => apiClient.get('/api/finance'),
  getById: (id) => apiClient.get(`/api/finance/${id}`),
  create: (data) => apiClient.post('/api/finance', data),
  update: (id, data) => apiClient.put(`/api/finance/${id}`, data),
  delete: (id) => apiClient.delete(`/api/finance/${id}`),
};

// Other existing services...
export const driverService = {
  // ... keep existing
};

export const farmerService = {
  // ... keep existing
};

export default apiClient;
```

**Task Checklist:**
- [ ] Update Login.jsx to handle new response format
- [ ] Update Signup.jsx with roleData handling
- [ ] Ensure apiService.js unwraps JSend correctly
- [ ] Test login flow end-to-end
- [ ] Test signup with all 3 roles
- [ ] Verify token is stored and sent with requests
- [ ] Test 401 redirect on expired token

### 5.4 Create Protected Route Wrapper

**File:** `/frontend/src/components/ProtectedRoute.jsx`

```javascript
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const token = localStorage.getItem('authToken');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Not logged in
  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  // Check role if required
  if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}
```

Usage in App.jsx:
```javascript
import ProtectedRoute from './components/ProtectedRoute';

<Route
  path="/farmer-dashboard"
  element={
    <ProtectedRoute requiredRole="FARMER">
      <FarmerDashboard />
    </ProtectedRoute>
  }
/>
```

---

## PHASE 6: DATA MIGRATION (Optional - 2-3 Days)

### 6.1 Migrate Existing Drivers to User Collection

If you have existing Driver records:

**File:** `/backend/scripts/migrateDrivers.js`

```javascript
const mongoose = require('mongoose');
require('dotenv').config();

const Driver = require('../src/models/Driver'); // Old model
const User = require('../src/models/User'); // New model

async function migrateDrivers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all drivers
    const drivers = await Driver.find().lean();
    console.log(`Found ${drivers.length} drivers to migrate`);

    let migrated = 0;
    let failed = 0;

    for (const driver of drivers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({
          $or: [
            { email: driver.email?.toLowerCase() },
            { phoneNumber: driver.phoneNumber },
          ],
        });

        if (existingUser) {
          console.log(`Skipping ${driver.email}: Already migrated`);
          continue;
        }

        // Create new user from driver
        const user = new User({
          email: driver.email?.toLowerCase() || `driver-${driver._id}@smartuzhavan.local`,
          phoneNumber: driver.phoneNumber || '0000000000',
          password: driver.password || require('crypto').randomBytes(8).toString('hex'),
          firstName: driver.firstName || 'Driver',
          lastName: driver.lastName || driver._id.toString(),
          profileImage: driver.profileImage,
          address: driver.address || {},
          role: 'DRIVER',
          roleData: {
            driverLicense: driver.driverLicense,
            licenseExpiry: driver.licenseExpiry,
            vehicleNumber: driver.vehicleNumber,
            vehicleType: driver.vehicleType,
          },
          isActive: driver.isActive !== false,
          isVerified: driver.isVerified || false,
          createdAt: driver.createdAt || new Date(),
          updatedAt: driver.updatedAt || new Date(),
        });

        await user.save();
        migrated++;
        console.log(`✓ Migrated: ${driver.email}`);
      } catch (error) {
        failed++;
        console.error(`✗ Failed: ${driver.email}`, error.message);
      }
    }

    console.log(`\nMigration complete: ${migrated} migrated, ${failed} failed`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run migration
migrateDrivers();
```

Run with:
```bash
node backend/scripts/migrateDrivers.js
```

### 6.2 Backup Before Migration

```bash
# Backup MongoDB
mongodump --uri="mongodb+srv://user:password@cluster.mongodb.net/smartuzhavan" --out=backup_2026_05_14
```

---

## TESTING CHECKLIST (Next Step)

### Backend Testing

```bash
# Test all routes return JSend format
curl -X GET http://localhost:5000/api/expenses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected response format:
{
  "status": "success",
  "code": 200,
  "data": [...],
  "message": "Expenses retrieved successfully",
  "timestamp": "2026-05-14T10:30:00Z"
}

# Test validation errors
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"amount": -100}'

# Expected error response:
{
  "status": "fail",
  "code": 400,
  "data": {"amount": "must be positive"},
  "message": "Invalid amount",
  "timestamp": "2026-05-14T10:30:00Z"
}
```

### Frontend Testing

- [ ] Login with email
- [ ] Login with phone
- [ ] Signup as DRIVER
- [ ] Signup as FARMER
- [ ] Login redirects to correct dashboard
- [ ] Expenses list loads
- [ ] Create new expense
- [ ] Update expense
- [ ] Delete expense
- [ ] Finance summary shows correct calculations
- [ ] Generate report
- [ ] Expired token triggers redirect to login

---

## PRIORITY ORDER (Recommended)

### This Week (Day 1-3)
1. ✅ Update expenses route (copy-paste ready code above)
2. ✅ Update reports route (copy-paste ready code above)
3. ✅ Update finance route (copy-paste ready code above)
4. ✅ Test all routes with Postman

### Next Week (Day 4-7)
5. ✅ Update Login.jsx component
6. ✅ Update Signup.jsx component
7. ✅ Test frontend auth flow
8. ✅ Update all dashboard components to use new apiService

### Week 3 (Optional)
9. ✅ Data migration script (only if needed)
10. ✅ Backup database
11. ✅ Run migration
12. ✅ Verify data integrity

---

## VALIDATION GATES (Before Moving to Production)

**Gate 1: Route Standardization (Day 3)**
- [ ] All routes return JSend format
- [ ] All errors formatted consistently
- [ ] Postman tests pass
- [ ] No plain JSON responses

**Gate 2: Frontend Integration (Day 7)**
- [ ] Login works with new format
- [ ] Signup works for all roles
- [ ] Token refresh works
- [ ] 401 redirect works

**Gate 3: Data Integrity (Day 10)**
- [ ] No data loss during migration (if applicable)
- [ ] All relationships maintained
- [ ] userId field populated everywhere needed
- [ ] Old collections can be archived

**Gate 4: Production Readiness (Day 14)**
- [ ] 80%+ test coverage
- [ ] All critical paths tested
- [ ] Error rates < 5%
- [ ] Response times < 200ms
- [ ] Documentation complete

---

## NEXT IMMEDIATE ACTIONS

1. **TODAY:** Copy route code above and update expenses.js
2. **TOMORROW:** Update reports.js and finance.js
3. **FRIDAY:** Test all 3 routes with Postman
4. **MONDAY:** Update Login.jsx and Signup.jsx
5. **WEDNESDAY:** End-to-end testing

---

## ESTIMATED COMPLETION

- **Remaining Routes:** 1-2 days (copy-paste ready code)
- **Frontend Components:** 2-3 days
- **Testing & Validation:** 2-3 days
- **Data Migration:** 1-2 days (optional)

**Total: 6-10 days to full V6 production readiness**

---

**Current Momentum:** Excellent - Foundation is solid  
**Technical Debt:** Minimal - Architecture is clean  
**Risk Level:** Low - Gradual, testable migration path  

**You're in excellent shape. Execute the phases above and V6 will be complete.** 🚀
