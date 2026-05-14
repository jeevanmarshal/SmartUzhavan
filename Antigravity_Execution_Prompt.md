# SmartUzhavan V6 Architecture Restructure - Implementation Prompt for Antigravity

**Status:** READY FOR EXECUTION  
**Target:** Complete MERN Stack Architectural Overhaul  
**Timeline:** 4 Weeks  
**Owner:** Senior Full-Stack Solutions Architect  

---

## CONTEXT & OBJECTIVES

SmartUzhavan is experiencing critical architectural drift:
- **Symptom 1:** API responses are inconsistent (sometimes arrays, sometimes objects) → Frontend crashes with "map is not a function"
- **Symptom 2:** CORS blocking prevents Vercel ↔ Railway communication
- **Symptom 3:** Auth is fragmented across User/Driver/Farmer models with duplicate logic
- **Symptom 4:** Route definitions don't match API calls, causing 404s
- **Symptom 5:** No unified data validation or response standards

**V6 is the cure:** A single source of truth architecture with unified responses, centralized auth, enforced schemas, and production-grade infrastructure.

---

## DELIVERABLES REQUIRED (3 ONLY)

You've already received:
1. ✓ `V6_Architecture_Restructure_Plan.md` - Complete markdown plan
2. ✓ `V6_Architecture_Restructure_Plan.pdf` - Professional PDF version
3. ✓ This prompt file - Your step-by-step execution guide

**Do NOT create any other files.** Only these three.

---

## PHASE 1: FOUNDATION & ASSESSMENT (WEEK 1)

### 1.1 Repository Audit
```bash
# TASK: Document current state
- [ ] Clone latest SmartUzhavan repo
- [ ] List all endpoints in /backend/routes/*.js
- [ ] List all apiService calls in /frontend/src/services/
- [ ] Audit all Mongoose models for validation gaps
- [ ] Note all CORS-related code in server.js
- [ ] Create ISSUES_REGISTRY.md documenting:
      * Current 404 patterns
      * Current response format inconsistencies
      * Current auth entry points
      * Current CORS failure scenarios
```

### 1.2 Environment Setup
```bash
# Ensure these are installed:
- Node.js 18.x or higher
- MongoDB Atlas account with connection string
- Redis server (for production sessions)
- Docker Desktop (for containerization)
- Postman or REST Client for API testing

# Create /backend/.env.development:
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/smartuzhavan
FRONTEND_URL=http://localhost:5173
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRY=7d
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Create /frontend/.env.development:
VITE_API_URL=http://localhost:5000
VITE_NODE_ENV=development
```

---

## PHASE 2: RESPONSE STANDARDIZATION (WEEK 1-2)

### 2.1 Create Response Wrapper Middleware

**File:** `/backend/src/middleware/responseHandler.js`

```javascript
/**
 * JSend-compliant Response Wrapper
 * All API responses MUST follow this structure
 */

class APIResponse {
  static success(data, message = 'Operation successful', statusCode = 200) {
    return {
      status: 'success',
      code: statusCode,
      data: data,
      message: message,
      timestamp: new Date().toISOString(),
    };
  }

  static fail(data, message = 'Validation failed', statusCode = 400) {
    return {
      status: 'fail',
      code: statusCode,
      data: data || null,
      message: message,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message = 'Internal server error', statusCode = 500, data = null) {
    return {
      status: 'error',
      code: statusCode,
      data: data,
      message: message,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = APIResponse;
```

**File:** `/backend/src/middleware/responseFormatter.js`

```javascript
const APIResponse = require('./responseHandler');

const responseFormatter = (req, res, next) => {
  // Add helper methods to res object
  res.success = (data, message = 'Success', statusCode = 200) => {
    return res.json(APIResponse.success(data, message, statusCode));
  };

  res.fail = (data, message = 'Validation failed', statusCode = 400) => {
    return res.json(APIResponse.fail(data, message, statusCode));
  };

  res.error = (message = 'Internal error', statusCode = 500, data = null) => {
    return res.json(APIResponse.error(message, statusCode, data));
  };

  next();
};

module.exports = responseFormatter;
```

**File:** `/backend/src/middleware/errorHandler.js`

```javascript
const APIResponse = require('./responseHandler');

const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.entries(err.errors).reduce((acc, [field, error]) => {
      acc[field] = error.message;
      return acc;
    }, {});
    return res.status(400).json(APIResponse.fail(errors, 'Validation failed', 400));
  }

  // Duplicate key errors (unique constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json(
      APIResponse.fail({ [field]: `${field} already exists` }, 'Duplicate entry', 409)
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(APIResponse.error('Invalid token', 401));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(APIResponse.error('Token expired', 401));
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return res.status(statusCode).json(APIResponse.error(message, statusCode));
};

module.exports = errorHandler;
```

### 2.2 Update server.js to Use Middleware

```javascript
// CRITICAL: Apply responseFormatter BEFORE routes, errorHandler AFTER routes

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const responseFormatter = require('./middleware/responseFormatter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// RESPONSE FORMATTER MUST BE HERE (before routes)
app.use(responseFormatter);

// CORS (see Phase 6 for full config)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/farmers', require('./routes/farmers'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    code: 404,
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// ERROR HANDLER MUST BE HERE (last)
app.use(errorHandler);

// Database
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('✗ MongoDB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});

module.exports = app;
```

### 2.3 Test Response Format
```bash
# TASK: Verify JSend format on all endpoints
npm test -- tests/api.contract.test.js

# Expected output:
# ✓ All responses have status, code, data, message, timestamp
# ✓ Success responses return data array or object
# ✓ Fail responses return validation errors
# ✓ Error responses have no data field
```

---

## PHASE 3: CENTRALIZED AUTHENTICATION (WEEK 2-3)

### 3.1 Create Unified User Model

**File:** `/backend/src/models/User.js`

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    // Core Identity
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      match: [/^[0-9]{10}$/, 'Phone number must be 10 digits'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },

    // Profile
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    profileImage: { type: String, default: null },
    address: {
      street: String,
      city: { type: String, default: 'Thanjavur' },
      state: { type: String, default: 'Tamil Nadu' },
      zipCode: String,
      country: { type: String, default: 'India' },
    },

    // RBAC
    role: {
      type: String,
      enum: ['USER', 'DRIVER', 'FARMER', 'ADMIN'],
      default: 'USER',
      required: true,
    },

    // Role-specific data (all in one place)
    roleData: {
      // Driver fields
      driverLicense: String,
      licenseExpiry: Date,
      vehicleNumber: String,
      vehicleType: { type: String, enum: ['AUTO', 'TRUCK', 'VAN'] },
      
      // Farmer fields
      farmSize: Number,
      cropTypes: [String],
      bankAccount: {
        accountNumber: String,
        ifscCode: String,
      },
    },

    // Status
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },

    // Security
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, default: null, select: false },
    lastLogin: Date,

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRY || '7d' }
  );
  return token;
};

userSchema.methods.isAccountLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isAccountLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) };
  }

  return await this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function () {
  return await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phoneNumber: this.phoneNumber,
    role: this.role,
    profileImage: this.profileImage,
    address: this.address,
    roleData: this.roleData,
    isVerified: this.isVerified,
    createdAt: this.createdAt,
  };
};

// Statics
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

module.exports = mongoose.model('User', userSchema);
```

### 3.2 Create Auth Factory

**File:** `/backend/src/factories/AuthFactory.js`

```javascript
const User = require('../models/User');

class AuthFactory {
  static async login(email, password) {
    if (!email || !password) {
      throw { statusCode: 400, message: 'Email and password required' };
    }

    const user = await User.findByEmail(email).select('+password');
    if (!user) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    if (user.isAccountLocked()) {
      throw { statusCode: 429, message: 'Account locked. Try again in 2 hours.' };
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    await user.resetLoginAttempts();
    user.lastLogin = new Date();
    await user.save();

    const token = user.generateAuthToken();
    return { user: user.getPublicProfile(), token };
  }

  static async signup(userData) {
    const { email, password, confirmPassword, firstName, lastName, phoneNumber, role = 'USER', roleData = {} } = userData;

    if (!email || !password || !firstName || !lastName || !phoneNumber) {
      throw { statusCode: 400, message: 'Missing required fields' };
    }

    if (password !== confirmPassword) {
      throw { statusCode: 400, message: 'Passwords do not match' };
    }

    if (password.length < 8) {
      throw { statusCode: 400, message: 'Password must be at least 8 characters' };
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phoneNumber }],
    });

    if (existingUser) {
      throw { statusCode: 409, message: 'User already exists' };
    }

    const validRoles = ['USER', 'DRIVER', 'FARMER'];
    if (!validRoles.includes(role)) {
      throw { statusCode: 400, message: `Invalid role. Must be: ${validRoles.join(', ')}` };
    }

    if (role === 'DRIVER' && !roleData.driverLicense) {
      throw { statusCode: 400, message: 'Driver license required' };
    }

    if (role === 'FARMER' && !roleData.farmSize) {
      throw { statusCode: 400, message: 'Farm size required' };
    }

    const user = new User({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      phoneNumber,
      role,
      roleData,
    });

    await user.save();
    const token = user.generateAuthToken();

    return { user: user.getPublicProfile(), token };
  }

  static async verifyToken(token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.id);
      
      if (!user || !user.isActive) {
        throw { statusCode: 401, message: 'User not found or inactive' };
      }

      return user;
    } catch (error) {
      throw { statusCode: 401, message: 'Invalid or expired token' };
    }
  }

  static async refreshToken(userId) {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw { statusCode: 401, message: 'User not found or inactive' };
    }

    const newToken = user.generateAuthToken();
    return { token: newToken };
  }
}

module.exports = AuthFactory;
```

### 3.3 Create Auth Middleware

**File:** `/backend/src/middleware/auth.js`

```javascript
const AuthFactory = require('../factories/AuthFactory');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Access token required',
        timestamp: new Date().toISOString(),
      });
    }

    const user = await AuthFactory.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      code: 401,
      message: error.message || 'Unauthorized',
      timestamp: new Date().toISOString(),
    });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'User not authenticated',
        timestamp: new Date().toISOString(),
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        code: 403,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

module.exports = { authenticateToken, authorize };
```

### 3.4 Create Auth Routes

**File:** `/backend/src/routes/auth.js`

```javascript
const express = require('express');
const AuthFactory = require('../factories/AuthFactory');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', async (req, res, next) => {
  try {
    const result = await AuthFactory.signup(req.body);
    return res.status(201).success(result.user, 'Signup successful');
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthFactory.login(email, password);

    res.cookie('authToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.success(result.user, 'Login successful', 200);
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', authenticateToken, async (req, res, next) => {
  try {
    const result = await AuthFactory.refreshToken(req.user._id);
    return res.success({ token: result.token }, 'Token refreshed', 200);
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('authToken');
  return res.success(null, 'Logged out successfully', 200);
});

router.get('/me', authenticateToken, (req, res) => {
  return res.success(req.user.getPublicProfile(), 'User profile retrieved', 200);
});

module.exports = router;
```

### 3.5 Test Auth System
```bash
# TASK: Verify auth endpoints
npm test -- tests/auth.test.js

# Verify:
# ✓ Signup creates user with role
# ✓ Login returns JWT token
# ✓ Token required for protected routes
# ✓ Account locks after 5 failed attempts
# ✓ Token refresh works
```

---

## PHASE 4: SCHEMA ENFORCEMENT (WEEK 2-3)

### 4.1 Create Validators Utility

**File:** `/backend/src/utils/validators.js`

```javascript
const validators = {
  isValidEmail: (email) => {
    const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
  },

  isValidPhone: (phone) => {
    const re = /^[0-9]{10}$/;
    return re.test(phone);
  },

  isStrongPassword: (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*]/.test(password)
    );
  },

  isValidLicense: (license) => {
    const re = /^[A-Z]{2}[0-9]{13}$/;
    return re.test(license);
  },

  isValidFarmSize: (size) => {
    return size > 0 && size <= 10000;
  },
};

module.exports = validators;
```

### 4.2 Update All Models
```bash
# TASK: Audit and update models
- [ ] Ensure ALL required fields have [true, 'message']
- [ ] Ensure ALL optional fields have default values
- [ ] Ensure enums list ALL valid options
- [ ] Add timestamps to all schemas
- [ ] Test with invalid data (should fail validation)
```

---

## PHASE 5: API CONTRACT SYNCHRONIZATION (WEEK 3)

### 5.1 Create API Registry

**File:** `/backend/src/constants/apiRegistry.js`

```javascript
const apiRegistry = {
  auth: {
    signup: { method: 'POST', path: '/api/auth/signup', auth: false },
    login: { method: 'POST', path: '/api/auth/login', auth: false },
    logout: { method: 'POST', path: '/api/auth/logout', auth: true },
    refresh: { method: 'POST', path: '/api/auth/refresh', auth: true },
    me: { method: 'GET', path: '/api/auth/me', auth: true },
  },
  
  users: {
    getById: { method: 'GET', path: '/api/users/:id', auth: true },
    update: { method: 'PUT', path: '/api/users/:id', auth: true },
    delete: { method: 'DELETE', path: '/api/users/:id', auth: true },
  },
  
  drivers: {
    getAll: { method: 'GET', path: '/api/drivers', auth: false },
    getById: { method: 'GET', path: '/api/drivers/:id', auth: false },
    update: { method: 'PUT', path: '/api/drivers/:id', auth: true },
  },
  
  farmers: {
    getAll: { method: 'GET', path: '/api/farmers', auth: false },
    getById: { method: 'GET', path: '/api/farmers/:id', auth: false },
    update: { method: 'PUT', path: '/api/farmers/:id', auth: true },
  },

  health: { method: 'GET', path: '/api/health', auth: false },
};

module.exports = apiRegistry;
```

### 5.2 Update Frontend API Service

**File:** `/frontend/src/services/apiService.js`

```javascript
/**
 * Unified API Service
 * Handles JSend response format automatically
 * Manages auth tokens, refreshes, and error handling
 */

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

    // Success: return just the data (frontend expects data, not wrapper)
    if (data.status === 'success') {
      return data.data;
    }

    // Fail: validation error with details
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

// User API
export const userService = {
  getById: (userId) => apiClient.get(`/api/users/${userId}`),
  update: (userId, data) => apiClient.put(`/api/users/${userId}`, data),
  delete: (userId) => apiClient.delete(`/api/users/${userId}`),
};

// Driver API
export const driverService = {
  getAll: (filters = {}) => apiClient.get('/api/drivers', { params: filters }),
  getById: (id) => apiClient.get(`/api/drivers/${id}`),
  update: (id, data) => apiClient.put(`/api/drivers/${id}`, data),
};

// Farmer API
export const farmerService = {
  getAll: (filters = {}) => apiClient.get('/api/farmers', { params: filters }),
  getById: (id) => apiClient.get(`/api/farmers/${id}`),
  update: (id, data) => apiClient.put(`/api/farmers/${id}`, data),
};

// Health check
export const healthService = {
  check: () => apiClient.get('/api/health'),
};

export default apiClient;
```

### 5.3 Test API Contracts
```bash
# TASK: Verify frontend-backend alignment
npm test -- tests/api.contract.test.js

# Verify:
# ✓ All endpoints return JSend format
# ✓ Auth endpoints return token
# ✓ Protected endpoints reject without token
# ✓ apiService correctly unwraps JSend data
```

---

## PHASE 6: INFRASTRUCTURE HARDENING (WEEK 3-4)

### 6.1 Complete CORS Configuration

**Update server.js:**

```javascript
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'https://smartuzhavan.vercel.app',
      'https://www.smartuzhavan.vercel.app',
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// CORS error handler
app.use((err, req, res, next) => {
  if (err.message === 'CORS not allowed') {
    return res.status(403).json({
      status: 'error',
      code: 403,
      message: 'CORS policy violation',
      timestamp: new Date().toISOString(),
    });
  }
  next(err);
});
```

### 6.2 Security Headers

**File:** `/backend/src/middleware/securityHeaders.js`

```javascript
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
  );
  res.setHeader('Expect-CT', 'max-age=86400, enforce');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  res.removeHeader('X-Powered-By');
  next();
};

module.exports = securityHeaders;
```

Add to server.js:
```javascript
const securityHeaders = require('./middleware/securityHeaders');
app.use(securityHeaders);
```

### 6.3 Rate Limiting

**File:** `/backend/src/middleware/rateLimiter.js`

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts',
});

module.exports = { limiter, authLimiter };
```

Add to server.js:
```javascript
const { limiter, authLimiter } = require('./middleware/rateLimiter');
app.use(limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
```

### 6.4 Environment Configuration

**Create `/backend/.env.production`:**

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/smartuzhavan
FRONTEND_URL=https://smartuzhavan.vercel.app
JWT_SECRET=your-super-secure-jwt-secret-key-here-change-this
JWT_EXPIRY=7d
REDIS_URL=redis://:password@redis.railway.app:PORT
COOKIE_DOMAIN=smartuzhavan.com
SESSION_SECRET=your-super-secure-session-secret-key-here
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

**Create `/frontend/.env.production`:**

```bash
VITE_API_URL=https://api.smartuzhavan.com
VITE_NODE_ENV=production
```

---

## PHASE 7: COMPREHENSIVE TESTING (WEEK 4)

### 7.1 Unit Tests

**File:** `/backend/tests/auth.test.js`

```javascript
const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');

describe('Auth Tests', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/signup', () => {
    it('should create new user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'user@test.com',
          password: 'Test@1234',
          confirmPassword: 'Test@1234',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '9876543210',
          role: 'USER',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await request(app).post('/api/auth/signup').send({
        email: 'user@test.com',
        password: 'Test@1234',
        confirmPassword: 'Test@1234',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
      });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'user@test.com',
          password: 'Test@1234',
          confirmPassword: 'Test@1234',
          firstName: 'Jane',
          lastName: 'Doe',
          phoneNumber: '9876543211',
        });

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('fail');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/signup').send({
        email: 'user@test.com',
        password: 'Test@1234',
        confirmPassword: 'Test@1234',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
      });
    });

    it('should login successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'Test@1234' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should lock after 5 attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'user@test.com', password: 'Wrong' });
      }

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'Test@1234' });

      expect(res.status).toBe(429);
    });
  });
});
```

### 7.2 Frontend API Tests

**File:** `/frontend/src/__tests__/apiService.test.js`

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../services/apiService';

describe('API Service Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should handle JSend success response', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            status: 'success',
            data: { id: '123', email: 'test@example.com' },
            token: 'jwt-token',
          }),
      })
    );

    const result = await authService.login('test@example.com', 'password');
    expect(result.id).toBe('123');
    expect(localStorage.getItem('authToken')).toBe('jwt-token');
  });

  it('should handle JSend fail response', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            status: 'fail',
            message: 'Validation failed',
            data: { email: 'Invalid email' },
          }),
      })
    );

    await expect(
      authService.login('invalid', 'password')
    ).rejects.toThrow('Validation failed');
  });
});
```

### 7.3 Run Tests
```bash
# Backend tests
npm test -- tests/auth.test.js --coverage

# Frontend tests
cd frontend && npm test -- apiService.test.js --coverage

# Verify:
# ✓ Auth tests pass with >90% coverage
# ✓ API contract tests pass
# ✓ No "map is not a function" errors
```

---

## PHASE 8: DEPLOYMENT (WEEK 4)

### 8.1 Railway Deployment

```bash
# TASK: Deploy backend to Railway
1. Install Railway CLI
2. Login: railway login
3. Create project: railway init
4. Set environment variables in dashboard
5. Deploy: git push origin main
6. Verify: Check health endpoint
```

### 8.2 Vercel Deployment

```bash
# TASK: Deploy frontend to Vercel
1. Create vercel.json in root (see plan)
2. Connect repo to Vercel dashboard
3. Set VITE_API_URL env variable
4. Deploy on push to main
5. Verify CORS by checking network tab
```

### 8.3 Production Checklist
```bash
- [ ] All tests passing
- [ ] CORS working from production domain
- [ ] Error tracking (Sentry) configured
- [ ] Database backups enabled
- [ ] Monitoring dashboards created
- [ ] Security headers verified
- [ ] Rate limiting active
- [ ] Logs flowing to centralized system
- [ ] Rollback procedure tested
- [ ] Team trained on new patterns
```

---

## PHASE 9: DOCUMENTATION (END OF WEEK 4)

### 9.1 Create API Documentation
```bash
# TASK: Document in README
- Complete endpoint reference
- Request/response examples for each endpoint
- Auth flow diagram (ASCII art is fine)
- Error codes and meanings
- Rate limit rules
- Example API calls with curl
```

### 9.2 Create Deployment Guide
```bash
# TASK: Document deployment steps
- Prerequisites
- Railway setup steps
- Vercel setup steps
- Database migration steps
- How to rollback
- Troubleshooting common issues
```

---

## SUCCESS CRITERIA (VERIFY ALL)

```bash
✓ Zero "map is not a function" errors
✓ All endpoints return JSend format
✓ Auth system supports USER, DRIVER, FARMER
✓ Account locks after 5 failed login attempts
✓ CORS allows Vercel domain
✓ API response time < 200ms (p95)
✓ Rate limiting prevents brute force
✓ Tests pass with >80% coverage
✓ Security headers present
✓ JWT tokens work across deployments
✓ 404 and 500 errors return JSend format
✓ Documentation complete and accurate
✓ Rollback procedure tested
```

---

## COMMON ISSUES & FIXES

### Issue: "CORS blocked from Vercel"
**Fix:** Check corsOptions.origin array includes `https://smartuzhavan.vercel.app`

### Issue: "Invalid token errors"
**Fix:** Verify JWT_SECRET is same in .env and production

### Issue: "Account locked after signup"
**Fix:** Ensure loginAttempts is reset after successful signup

### Issue: "map is not a function in React"
**Fix:** Verify apiService interceptor returns `data.data` not wrapped response

### Issue: "404 on /api/auth/login"
**Fix:** Ensure auth routes mounted in server.js: `app.use('/api/auth', authRoutes)`

---

## EXECUTION NOTES

1. **Work sequentially** - Each phase depends on previous
2. **Test after each phase** - Don't wait for end to test
3. **Commit frequently** - Small commits are easier to rollback
4. **Use feature branches** - Don't commit directly to main
5. **Document changes** - Update README as you go
6. **Monitor logs** - Watch for errors in console during testing
7. **Use Postman** - Test endpoints before moving to frontend

---

## HANDOFF CRITERIA

You're done when:
1. All 3 deliverable files are complete and reviewed
2. All tests pass with >80% coverage
3. Staging environment mirrors production config
4. Team has been trained on new patterns
5. Rollback procedure has been tested
6. Documentation is complete and reviewed
7. Success metrics baseline has been established

---

**Start Date:** [TODAY]  
**Target Completion:** 4 weeks  
**Status:** READY FOR EXECUTION  

**Questions?** Refer back to:
- `V6_Architecture_Restructure_Plan.md` for detailed phase specs
- `V6_Architecture_Restructure_Plan.pdf` for architectural diagrams
- This prompt for step-by-step execution

**GO BUILD! 🚀**
