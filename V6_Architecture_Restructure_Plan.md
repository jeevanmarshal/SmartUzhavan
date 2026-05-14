# SmartUzhavan V6 Architecture Restructure Plan

**Version:** 1.0  
**Date:** May 2026  
**Status:** Production-Ready Implementation Guide  
**Target Architecture:** MERN Stack with Unified Response Patterns, Centralized Auth, and Infrastructure Hardening

---

## Executive Summary

SmartUzhavan is experiencing **architectural drift** stemming from:
- Inconsistent API response formats causing frontend crashes
- Fragmented authentication strategy across User/Driver/Farmer models
- CORS and connection issues between Vercel (Frontend) and Railway (Backend)
- Misalignment between backend route definitions and frontend API calls
- Lack of schema enforcement and data validation standards

This V6 restructure plan consolidates the MERN stack into a **single source of truth** architecture with:
1. **JSend-compliant unified response wrapper**
2. **Centralized JWT-based authentication factory**
3. **Enforced Mongoose schema standards**
4. **Automated API contract synchronization**
5. **Production-grade CORS, session, and security configuration**

---

## Phase 1: Foundation & Assessment (Week 1)

### 1.1 Current State Audit

#### Checkpoint 1.1.1: Code Structure Inventory
```
SmartUzhavan/
├── frontend/                    # React + Vite (Vercel deployment)
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/              # Page-level routes
│   │   ├── services/           # apiService.js (inconsistent mapping)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── context/            # State management
│   │   └── App.jsx
│   └── package.json
│
├── backend/                     # Express + Node.js (Railway deployment)
│   ├── src/
│   │   ├── server.js           # Main entry point (auth/CORS issues)
│   │   ├── routes/             # API route definitions (misaligned)
│   │   ├── controllers/        # Route handlers (missing response wrapper)
│   │   ├── models/             # Mongoose schemas (inconsistent validation)
│   │   ├── middleware/         # Auth/CORS middleware (fragmented)
│   │   └── utils/              # Helper functions
│   └── package.json
│
└── .env / .env.production      # Environment configuration
```

**Tasks:**
- [ ] Document existing API endpoints in `routes/` directory
- [ ] Audit all controller responses for format inconsistency
- [ ] List all authentication entry points (User, Driver, Farmer)
- [ ] Identify all CORS failures in current logs
- [ ] Map `apiService.js` calls to backend endpoints

#### Checkpoint 1.1.2: Critical Issues Documentation

**Issue Registry:**
| Issue | Root Cause | Severity | Affected Files |
|-------|-----------|----------|-----------------|
| 404 errors on API calls | Route path mismatch | HIGH | apiService.js, routes/*.js |
| "map is not a function" | Inconsistent response (obj vs array) | CRITICAL | Frontend components, controllers |
| CORS blocking | Missing credentials & origin config | HIGH | server.js, CORS middleware |
| Auth state loss | Session config undefined | HIGH | middleware/auth.js |
| Driver/Farmer login fail | No unified auth strategy | MEDIUM | models/User.js, models/Driver.js |

---

## Phase 2: Backend Response Standardization (Week 1-2)

### 2.1 Unified Response Wrapper Implementation

#### Checkpoint 2.1.1: JSend Standard Adoption

Create `/backend/src/middleware/responseHandler.js`:

```javascript
/**
 * JSend-compliant Response Wrapper
 * Ensures all API responses follow consistent structure:
 * {
 *   status: 'success' | 'fail' | 'error',
 *   data: {...},           // For 'success' or 'fail'
 *   message: string,       // For errors
 *   code: number,          // HTTP status code
 *   timestamp: ISO string
 * }
 */

class APIResponse {
  // SUCCESS: Operation completed, data returned
  static success(data, message = 'Operation successful', statusCode = 200) {
    return {
      status: 'success',
      code: statusCode,
      data: Array.isArray(data) ? data : data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  // FAIL: Request validation failed, client error
  static fail(data, message = 'Validation failed', statusCode = 400) {
    return {
      status: 'fail',
      code: statusCode,
      data: data || null,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  // ERROR: Server error or unexpected condition
  static error(message = 'Internal server error', statusCode = 500, data = null) {
    return {
      status: 'error',
      code: statusCode,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = APIResponse;
```

#### Checkpoint 2.1.2: Response Middleware Integration

Create `/backend/src/middleware/responseFormatter.js`:

```javascript
const APIResponse = require('./responseHandler');

/**
 * Global response formatter middleware
 * Wraps all responses in JSend format
 */
const responseFormatter = (req, res, next) => {
  // Override res.send/res.json to wrap responses
  const originalJson = res.json.bind(res);

  res.success = (data, message = 'Success', statusCode = 200) => {
    return originalJson(APIResponse.success(data, message, statusCode));
  };

  res.fail = (data, message = 'Validation failed', statusCode = 400) => {
    return originalJson(APIResponse.fail(data, message, statusCode));
  };

  res.error = (message = 'Internal error', statusCode = 500, data = null) => {
    return originalJson(APIResponse.error(message, statusCode, data));
  };

  next();
};

module.exports = responseFormatter;
```

#### Checkpoint 2.1.3: Error Handling Middleware

Create `/backend/src/middleware/errorHandler.js`:

```javascript
const APIResponse = require('./responseHandler');

/**
 * Global error handler
 * Catches all unhandled errors and formats them
 */
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.entries(err.errors).reduce((acc, [field, error]) => {
      acc[field] = error.message;
      return acc;
    }, {});
    return res.status(400).json(
      APIResponse.fail(errors, 'Validation failed', 400)
    );
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json(
      APIResponse.fail(
        { [field]: `${field} already exists` },
        'Duplicate entry',
        409
      )
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      APIResponse.error('Invalid token', 401)
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      APIResponse.error('Token expired', 401)
    );
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  return res.status(statusCode).json(
    APIResponse.error(message, statusCode)
  );
};

module.exports = errorHandler;
```

#### Checkpoint 2.1.4: Server Integration

Update `/backend/src/server.js`:

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const responseFormatter = require('./middleware/responseFormatter');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const driverRoutes = require('./routes/drivers');
const farmerRoutes = require('./routes/farmers');

const app = express();

// ============= MIDDLEWARE =============
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Response formatter (MUST be before routes)
app.use(responseFormatter);

// CORS configuration (detailed in Phase 5)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

// ============= HEALTH CHECK =============
app.get('/api/health', (req, res) => {
  res.success({ status: 'healthy' }, 'Server is running', 200);
});

// ============= ROUTES =============
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/farmers', farmerRoutes);

// ============= ERROR HANDLING =============
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    code: 404,
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

// ============= DATABASE & SERVER =============
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('✗ MongoDB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
```

**Task Checklist:**
- [ ] Create responseHandler.js with JSend format
- [ ] Create responseFormatter.js middleware
- [ ] Create errorHandler.js middleware
- [ ] Update server.js to use middleware chain
- [ ] Test with `/api/health` endpoint
- [ ] Document response format in README

---

## Phase 3: Centralized Authentication Factory (Week 2-3)

### 3.1 Unified User Model Architecture

#### Checkpoint 3.1.1: Base User Model Refactor

Replace fragmented User/Driver/Farmer models with a unified `User` model:

Create `/backend/src/models/User.js`:

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
      select: false, // Don't return password by default
    },

    // Profile Information
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
    address: {
      street: String,
      city: {
        type: String,
        default: 'Thanjavur', // India default for SmartUzhavan
      },
      state: {
        type: String,
        default: 'Tamil Nadu',
      },
      zipCode: String,
      country: {
        type: String,
        default: 'India',
      },
    },

    // Role-Based Access Control (RBAC)
    role: {
      type: String,
      enum: ['USER', 'DRIVER', 'FARMER', 'ADMIN'],
      default: 'USER',
      required: true,
    },

    // Role-Specific Data
    roleData: {
      driverLicense: {
        type: String,
        default: null,
      },
      licenseExpiry: {
        type: Date,
        default: null,
      },
      vehicleNumber: {
        type: String,
        default: null,
      },
      vehicleType: {
        type: String,
        enum: ['AUTO', 'TRUCK', 'VAN', null],
        default: null,
      },
      farmSize: {
        type: Number, // in hectares
        default: null,
      },
      cropTypes: {
        type: [String],
        default: [],
      },
      bankAccount: {
        accountNumber: String,
        ifscCode: String,
      },
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
      select: false,
    },
    verificationTokenExpiry: {
      type: Date,
      default: null,
      select: false,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: null,
    },

    // Security
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

// ============= MIDDLEWARE =============

// Hash password before saving
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

// Update updatedAt on every save
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// ============= INSTANCE METHODS =============

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role,
    },
    process.env.JWT_SECRET || 'your-secret-key',
    {
      expiresIn: process.env.JWT_EXPIRY || '7d',
    }
  );
  return token;
};

// Check if account is locked
userSchema.methods.isAccountLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Increment login attempts
userSchema.methods.incLoginAttempts = async function () {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  // Increment attempts
  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts
  const maxAttempts = 5;
  if (this.loginAttempts + 1 >= maxAttempts && !this.isAccountLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) }; // 2 hours
  }

  return await this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function () {
  return await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// Get public profile
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

// ============= STATIC METHODS =============

// Find by email (exclude password)
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Find by phone (exclude password)
userSchema.statics.findByPhone = function (phoneNumber) {
  return this.findOne({ phoneNumber });
};

// Export model
module.exports = mongoose.model('User', userSchema);
```

#### Checkpoint 3.1.2: Authentication Factory

Create `/backend/src/factories/AuthFactory.js`:

```javascript
const User = require('../models/User');
const APIResponse = require('../middleware/responseHandler');

class AuthFactory {
  /**
   * Universal login handler for all roles
   * Validates credentials, checks account status, generates token
   */
  static async login(email, password) {
    // Validate input
    if (!email || !password) {
      throw {
        statusCode: 400,
        message: 'Email and password are required',
      };
    }

    // Find user (include password for comparison)
    const user = await User.findByEmail(email).select('+password');
    if (!user) {
      throw {
        statusCode: 401,
        message: 'Invalid email or password',
      };
    }

    // Check account lock
    if (user.isAccountLocked()) {
      throw {
        statusCode: 429,
        message: 'Account locked. Try again in 2 hours.',
      };
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      throw {
        statusCode: 401,
        message: 'Invalid email or password',
      };
    }

    // Reset login attempts on success
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    // Return user data (without password)
    return {
      user: user.getPublicProfile(),
      token,
    };
  }

  /**
   * Universal signup handler
   * Creates user with specified role
   */
  static async signup(userData) {
    const {
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      phoneNumber,
      role = 'USER',
      roleData = {},
    } = userData;

    // Validate input
    if (!email || !password || !firstName || !lastName || !phoneNumber) {
      throw {
        statusCode: 400,
        message: 'Missing required fields',
        data: {
          required: ['email', 'password', 'firstName', 'lastName', 'phoneNumber'],
        },
      };
    }

    // Validate password
    if (password !== confirmPassword) {
      throw {
        statusCode: 400,
        message: 'Passwords do not match',
      };
    }

    if (password.length < 8) {
      throw {
        statusCode: 400,
        message: 'Password must be at least 8 characters',
      };
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phoneNumber }],
    });

    if (existingUser) {
      throw {
        statusCode: 409,
        message: 'User already exists',
        data: {
          field: existingUser.email === email.toLowerCase() ? 'email' : 'phoneNumber',
        },
      };
    }

    // Validate role
    const validRoles = ['USER', 'DRIVER', 'FARMER'];
    if (!validRoles.includes(role)) {
      throw {
        statusCode: 400,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      };
    }

    // Role-specific validation
    if (role === 'DRIVER' && !roleData.driverLicense) {
      throw {
        statusCode: 400,
        message: 'Driver license is required for driver registration',
      };
    }

    if (role === 'FARMER' && !roleData.farmSize) {
      throw {
        statusCode: 400,
        message: 'Farm size is required for farmer registration',
      };
    }

    // Create user
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

    // Generate token
    const token = user.generateAuthToken();

    return {
      user: user.getPublicProfile(),
      token,
      message: 'User created successfully. Please verify your email.',
    };
  }

  /**
   * Verify JWT token
   */
  static async verifyToken(token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      );
      
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        throw {
          statusCode: 401,
          message: 'User not found or inactive',
        };
      }

      return user;
    } catch (error) {
      throw {
        statusCode: 401,
        message: 'Invalid or expired token',
      };
    }
  }

  /**
   * Refresh token
   */
  static async refreshToken(userId) {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw {
        statusCode: 401,
        message: 'User not found or inactive',
      };
    }

    const newToken = user.generateAuthToken();
    return { token: newToken };
  }

  /**
   * Logout (client-side deletion of token)
   */
  static logout() {
    return {
      message: 'Logged out successfully',
    };
  }
}

module.exports = AuthFactory;
```

#### Checkpoint 3.1.3: Protected Routes Middleware

Create `/backend/src/middleware/auth.js`:

```javascript
const User = require('../models/User');
const AuthFactory = require('../factories/AuthFactory');

/**
 * Verify JWT and attach user to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

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

/**
 * Check if user has required role
 */
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

#### Checkpoint 3.1.4: Auth Routes

Create `/backend/src/routes/auth.js`:

```javascript
const express = require('express');
const AuthFactory = require('../factories/AuthFactory');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/signup
 * Register a new user (USER, DRIVER, or FARMER role)
 */
router.post('/signup', async (req, res, next) => {
  try {
    const result = await AuthFactory.signup(req.body);
    return res.status(201).json({
      status: 'success',
      code: 201,
      data: result.user,
      token: result.token,
      message: result.message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login a user and return JWT token
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthFactory.login(email, password);

    // Set secure cookie (optional, for SameSite CSRF protection)
    res.cookie('authToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.success(result.user, 'Login successful', 200);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', authenticateToken, async (req, res, next) => {
  try {
    const result = await AuthFactory.refreshToken(req.user._id);
    return res.success({ token: result.token }, 'Token refreshed', 200);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', (req, res) => {
  res.clearCookie('authToken');
  return res.success(null, 'Logged out successfully', 200);
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticateToken, (req, res) => {
  return res.success(req.user.getPublicProfile(), 'User profile retrieved', 200);
});

module.exports = router;
```

**Task Checklist:**
- [ ] Create User.js model with unified schema
- [ ] Create AuthFactory.js with login/signup logic
- [ ] Create auth.js middleware (authenticateToken, authorize)
- [ ] Create auth routes with JSend responses
- [ ] Test signup for USER, DRIVER, FARMER roles
- [ ] Test login with wrong password (account lock)
- [ ] Test JWT token refresh
- [ ] Document authentication flow in README

---

## Phase 4: Schema Enforcement & Data Validation (Week 2-3)

### 4.1 Mongoose Schema Standardization

#### Checkpoint 4.1.1: Schema Validation Audit

Ensure all models follow this pattern:

```javascript
// Template for all Mongoose schemas
const schema = new mongoose.Schema(
  {
    // REQUIRED fields must have explicit validation
    field1: {
      type: String,
      required: [true, 'Field1 is required'],
      trim: true,
    },

    // OPTIONAL fields must have sensible defaults
    field2: {
      type: String,
      default: 'DEFAULT_VALUE',
    },

    // ENUMS must list all valid options
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
      default: 'PENDING',
    },

    // TIMESTAMPS for auditing
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
```

#### Checkpoint 4.1.2: Example Models (Driver, Farmer)

Create `/backend/src/models/Driver.js` (if needing role-specific data):

```javascript
// NOTE: Driver is now a User with role: 'DRIVER'
// All driver-specific data lives in User.roleData.driverLicense, vehicleNumber, etc.
// This file can be deprecated or used only for queries

const mongoose = require('mongoose');

const User = require('./User');

// Helper to find all drivers
const findAllDrivers = async () => {
  return await User.find({ role: 'DRIVER' });
};

module.exports = { findAllDrivers };
```

Create `/backend/src/models/Farmer.js`:

```javascript
// NOTE: Farmer is now a User with role: 'FARMER'
// All farmer-specific data lives in User.roleData.farmSize, cropTypes, etc.

const mongoose = require('mongoose');
const User = require('./User');

// Helper to find all farmers
const findAllFarmers = async () => {
  return await User.find({ role: 'FARMER' });
};

module.exports = { findAllFarmers };
```

#### Checkpoint 4.1.3: Validation Helper Utilities

Create `/backend/src/utils/validators.js`:

```javascript
/**
 * Centralized validation functions
 * Ensures consistency across all routes
 */

const validators = {
  // Email validation
  isValidEmail: (email) => {
    const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
  },

  // Phone validation (India format)
  isValidPhone: (phone) => {
    const re = /^[0-9]{10}$/;
    return re.test(phone);
  },

  // Password strength
  isStrongPassword: (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) && // At least one uppercase
      /[a-z]/.test(password) && // At least one lowercase
      /[0-9]/.test(password) && // At least one number
      /[!@#$%^&*]/.test(password) // At least one special char
    );
  },

  // Driver license format
  isValidLicense: (license) => {
    // Indian format: 2 letters + 13 digits
    const re = /^[A-Z]{2}[0-9]{13}$/;
    return re.test(license);
  },

  // Farm size validation
  isValidFarmSize: (size) => {
    return size > 0 && size <= 10000; // Between 0 and 10000 hectares
  },
};

module.exports = validators;
```

**Task Checklist:**
- [ ] Audit all existing Mongoose models for required/default fields
- [ ] Update models to follow standardized pattern
- [ ] Create validators.js utility for reusable validation
- [ ] Test schema validation with invalid data
- [ ] Document schema requirements in README

---

## Phase 5: Automated API Contract Synchronization (Week 3)

### 5.1 API Contract Documentation

#### Checkpoint 5.1.1: OpenAPI/Swagger Specification

Create `/backend/openapi.json`:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "SmartUzhavan API",
    "version": "6.0.0",
    "description": "Unified API specification for SmartUzhavan backend"
  },
  "servers": [
    {
      "url": "https://api.smartuzhavan.com",
      "description": "Production"
    },
    {
      "url": "http://localhost:5000",
      "description": "Development"
    }
  ],
  "paths": {
    "/api/auth/signup": {
      "post": {
        "summary": "Register a new user",
        "tags": ["Auth"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email", "password", "firstName", "lastName", "phoneNumber"],
                "properties": {
                  "email": { "type": "string", "format": "email" },
                  "password": { "type": "string", "minLength": 8 },
                  "confirmPassword": { "type": "string" },
                  "firstName": { "type": "string" },
                  "lastName": { "type": "string" },
                  "phoneNumber": { "type": "string", "pattern": "^[0-9]{10}$" },
                  "role": { "type": "string", "enum": ["USER", "DRIVER", "FARMER"] }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "User created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": { "type": "string", "enum": ["success"] },
                    "code": { "type": "integer", "example": 201 },
                    "data": { "$ref": "#/components/schemas/User" },
                    "token": { "type": "string" },
                    "message": { "type": "string" },
                    "timestamp": { "type": "string", "format": "date-time" }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Validation error"
          },
          "409": {
            "description": "User already exists"
          }
        }
      }
    },
    "/api/auth/login": {
      "post": {
        "summary": "Login user",
        "tags": ["Auth"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email", "password"],
                "properties": {
                  "email": { "type": "string" },
                  "password": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Login successful"
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "email": { "type": "string" },
          "firstName": { "type": "string" },
          "lastName": { "type": "string" },
          "phoneNumber": { "type": "string" },
          "role": { "type": "string", "enum": ["USER", "DRIVER", "FARMER", "ADMIN"] },
          "profileImage": { "type": "string" },
          "address": { "type": "object" },
          "roleData": { "type": "object" },
          "isVerified": { "type": "boolean" },
          "createdAt": { "type": "string", "format": "date-time" }
        }
      },
      "APIResponse": {
        "type": "object",
        "properties": {
          "status": { "type": "string", "enum": ["success", "fail", "error"] },
          "code": { "type": "integer" },
          "data": { "type": "object" },
          "message": { "type": "string" },
          "timestamp": { "type": "string", "format": "date-time" }
        }
      }
    }
  }
}
```

#### Checkpoint 5.1.2: API Routes Registry

Create `/backend/src/routes/index.js`:

```javascript
/**
 * Centralized API Route Registry
 * Maps all frontend API calls to backend routes
 * Used for documentation and validation
 */

const apiRegistry = {
  // Auth endpoints
  auth: {
    signup: { method: 'POST', path: '/api/auth/signup', auth: false },
    login: { method: 'POST', path: '/api/auth/login', auth: false },
    logout: { method: 'POST', path: '/api/auth/logout', auth: true },
    refresh: { method: 'POST', path: '/api/auth/refresh', auth: true },
    me: { method: 'GET', path: '/api/auth/me', auth: true },
  },

  // User endpoints
  users: {
    getProfile: { method: 'GET', path: '/api/users/:id', auth: true },
    updateProfile: { method: 'PUT', path: '/api/users/:id', auth: true },
    deleteAccount: { method: 'DELETE', path: '/api/users/:id', auth: true },
  },

  // Driver endpoints
  drivers: {
    getAll: { method: 'GET', path: '/api/drivers', auth: false },
    getById: { method: 'GET', path: '/api/drivers/:id', auth: false },
    update: { method: 'PUT', path: '/api/drivers/:id', auth: true },
    getTrips: { method: 'GET', path: '/api/drivers/:id/trips', auth: true },
  },

  // Farmer endpoints
  farmers: {
    getAll: { method: 'GET', path: '/api/farmers', auth: false },
    getById: { method: 'GET', path: '/api/farmers/:id', auth: false },
    update: { method: 'PUT', path: '/api/farmers/:id', auth: true },
    getProduce: { method: 'GET', path: '/api/farmers/:id/produce', auth: true },
  },

  // Health check
  health: { method: 'GET', path: '/api/health', auth: false },
};

module.exports = apiRegistry;
```

### 5.2 Frontend API Service Synchronization

#### Checkpoint 5.2.1: Unified API Service

Create `/frontend/src/services/apiService.js`:

```javascript
/**
 * Unified API Service Layer
 * Maps all frontend requests to backend endpoints
 * Automatically handles JSend response format
 * Uses centralized error handling
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // For cookie-based auth
});

// Request interceptor: Add auth token
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

    // Handle JSend success
    if (data.status === 'success') {
      return data.data;
    }

    // Handle JSend fail
    if (data.status === 'fail') {
      const error = new Error(data.message);
      error.code = data.code;
      error.data = data.data;
      return Promise.reject(error);
    }

    // Handle JSend error
    if (data.status === 'error') {
      const error = new Error(data.message);
      error.code = data.code;
      return Promise.reject(error);
    }

    return response.data;
  },
  (error) => {
    // Handle 401 Unauthorized - refresh token or redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// ============= API METHODS =============

export const authService = {
  signup: async (userData) => {
    const response = await apiClient.post('/api/auth/signup', userData);
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    return response;
  },

  login: async (email, password) => {
    const response = await apiClient.post('/api/auth/login', { email, password });
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    return response;
  },

  logout: async () => {
    await apiClient.post('/api/auth/logout');
    localStorage.removeItem('authToken');
  },

  refresh: async () => {
    const response = await apiClient.post('/api/auth/refresh');
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    return response;
  },

  getMe: async () => {
    return await apiClient.get('/api/auth/me');
  },
};

export const userService = {
  getProfile: async (userId) => {
    return await apiClient.get(`/api/users/${userId}`);
  },

  updateProfile: async (userId, profileData) => {
    return await apiClient.put(`/api/users/${userId}`, profileData);
  },

  deleteAccount: async (userId) => {
    return await apiClient.delete(`/api/users/${userId}`);
  },
};

export const driverService = {
  getAll: async (filters = {}) => {
    return await apiClient.get('/api/drivers', { params: filters });
  },

  getById: async (driverId) => {
    return await apiClient.get(`/api/drivers/${driverId}`);
  },

  update: async (driverId, driverData) => {
    return await apiClient.put(`/api/drivers/${driverId}`, driverData);
  },

  getTrips: async (driverId) => {
    return await apiClient.get(`/api/drivers/${driverId}/trips`);
  },
};

export const farmerService = {
  getAll: async (filters = {}) => {
    return await apiClient.get('/api/farmers', { params: filters });
  },

  getById: async (farmerId) => {
    return await apiClient.get(`/api/farmers/${farmerId}`);
  },

  update: async (farmerId, farmerData) => {
    return await apiClient.put(`/api/farmers/${farmerId}`, farmerData);
  },

  getProduce: async (farmerId) => {
    return await apiClient.get(`/api/farmers/${farmerId}/produce`);
  },
};

export const healthService = {
  check: async () => {
    return await apiClient.get('/api/health');
  },
};

export default apiClient;
```

#### Checkpoint 5.2.2: API Contract Tests

Create `/backend/tests/api.contract.test.js`:

```javascript
/**
 * API Contract Tests
 * Ensures frontend and backend agree on response formats
 */

const request = require('supertest');
const app = require('../src/server');

describe('API Contract Tests', () => {
  // Test JSend success format
  it('should return JSend success format', async () => {
    const res = await request(app).get('/api/health');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body).toHaveProperty('code');
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('timestamp');
  });

  // Test JSend error format
  it('should return JSend error format for 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('status', 'error');
    expect(res.body).toHaveProperty('code', 404);
    expect(res.body).toHaveProperty('message');
  });

  // Test JSend fail format (validation error)
  it('should return JSend fail format for validation error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid' });
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('status', 'fail');
    expect(res.body).toHaveProperty('data');
  });
});
```

**Task Checklist:**
- [ ] Create openapi.json specification
- [ ] Create apiRegistry for route documentation
- [ ] Update apiService.js with JSend response handler
- [ ] Add response/request interceptors
- [ ] Write API contract tests
- [ ] Run tests and verify all endpoints
- [ ] Document API in README or Swagger UI

---

## Phase 6: Infrastructure Hardening (Week 3-4)

### 6.1 Production-Grade Configuration

#### Checkpoint 6.1.1: CORS Configuration

Update `/backend/src/server.js`:

```javascript
const cors = require('cors');

// Production-grade CORS configuration
const corsOptions = {
  // Single origin for production
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'https://smartuzhavan.vercel.app',
      'https://www.smartuzhavan.vercel.app',
    ];

    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },

  // Enable credentials (cookies, auth headers)
  credentials: true,

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // Allowed request headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
  ],

  // Exposed response headers
  exposedHeaders: ['X-Total-Count', 'X-Page-Number'],

  // Cache CORS preflight for 24 hours
  maxAge: 86400,

  // Don't pass CORS preflight request to route handlers
  preflightContinue: false,

  // Handle OPTIONS automatically
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Handle CORS errors
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
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

#### Checkpoint 6.1.2: Security Headers

Create `/backend/src/middleware/securityHeaders.js`:

```javascript
/**
 * Production-grade security headers
 */

const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevent referrer leaking
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:;"
  );

  // Expect-CT (Certificate Transparency)
  res.setHeader('Expect-CT', 'max-age=86400, enforce');

  // Strict Transport Security (HSTS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Remove powered-by header
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

#### Checkpoint 6.1.3: Session & Cookie Configuration

Create `/backend/src/middleware/sessionConfig.js`:

```javascript
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');

/**
 * Redis-backed session store for production
 * JWT can coexist with sessions for additional security
 */

let sessionMiddleware;

if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
  // Production: Redis-backed sessions
  const redisClient = redis.createClient({ url: process.env.REDIS_URL });
  redisClient.connect().catch(console.error);

  sessionMiddleware = session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // HTTPS only
      httpOnly: true, // Prevent XSS
      sameSite: 'strict', // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: process.env.COOKIE_DOMAIN || 'smartuzhavan.com',
    },
  });
} else {
  // Development: Memory-based sessions
  sessionMiddleware = session({
    secret: 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  });
}

module.exports = sessionMiddleware;
```

#### Checkpoint 6.1.4: Environment Variables

Create `/backend/.env.production`:

```bash
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/smartuzhavan

# Frontend
FRONTEND_URL=https://smartuzhavan.vercel.app

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRY=7d

# Sessions (Redis)
REDIS_URL=redis://:password@redis.railway.app:PORT

# Cookies
COOKIE_DOMAIN=smartuzhavan.com
SESSION_SECRET=your-super-secure-session-secret-key-here

# Rate Limiting
RATE_LIMIT_WINDOW=15 # minutes
RATE_LIMIT_MAX_REQUESTS=100

# Email (for verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Logging
LOG_LEVEL=info
```

#### Checkpoint 6.1.5: Rate Limiting

Create `/backend/src/middleware/rateLimiter.js`:

```javascript
const rateLimit = require('express-rate-limit');

/**
 * Global rate limiter
 */
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limit for health checks
    return req.path === '/api/health';
  },
});

/**
 * Auth endpoint limiter (stricter)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit to 5 requests per 15 minutes
  message: 'Too many login attempts, please try again later.',
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

#### Checkpoint 6.1.6: Logging & Monitoring

Create `/backend/src/middleware/logger.js`:

```javascript
const fs = require('fs');
const path = require('path');

// Create logs directory
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

/**
 * Request/Response logger
 */
const logger = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - start;
    
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?._id || 'ANONYMOUS',
    };

    // Write to log file
    const logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(log) + '\n');

    // Console log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(log);
    }

    return originalSend.call(this, data);
  };

  next();
};

module.exports = logger;
```

**Task Checklist:**
- [ ] Configure CORS with allowedOrigins array
- [ ] Add security headers middleware
- [ ] Setup session/cookie configuration
- [ ] Create .env.production file
- [ ] Add rate limiting middleware
- [ ] Add request logging middleware
- [ ] Test CORS from Vercel domain
- [ ] Test security headers with security scanner
- [ ] Document infrastructure in README

---

## Phase 7: Testing & Validation (Week 4)

### 7.1 Comprehensive Testing

#### Checkpoint 7.1.1: Unit Tests

Create `/backend/tests/auth.test.js`:

```javascript
const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');

describe('Authentication Tests', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'user@example.com',
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

    it('should fail with duplicate email', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'user@example.com',
          password: 'Test@1234',
          confirmPassword: 'Test@1234',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '9876543210',
        });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'user@example.com',
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
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'user@example.com',
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
        .send({
          email: 'user@example.com',
          password: 'Test@1234',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should lock account after 5 failed attempts', async () => {
      // Attempt 5 failed logins
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'user@example.com',
            password: 'WrongPassword',
          });
      }

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'Test@1234', // Correct password
        });

      expect(res.status).toBe(429); // Too Many Requests
    });
  });
});
```

#### Checkpoint 7.1.2: Integration Tests

Create `/backend/tests/integration.test.js`:

```javascript
const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');

describe('Integration Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    await User.deleteMany({});
    
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'driver@example.com',
        password: 'Test@1234',
        confirmPassword: 'Test@1234',
        firstName: 'John',
        lastName: 'Driver',
        phoneNumber: '9876543210',
        role: 'DRIVER',
        roleData: {
          driverLicense: 'TN9876543210123',
          vehicleNumber: 'TN01AB1234',
        },
      });

    authToken = signupRes.body.token;
    userId = signupRes.body.data.id;
  });

  it('should fetch user profile with valid token', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.role).toBe('DRIVER');
  });

  it('should update user profile', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'Jonathan',
        address: { city: 'Chennai' },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe('Jonathan');
  });

  it('should fail without authentication token', async () => {
    const res = await request(app).get(`/api/users/${userId}`);

    expect(res.status).toBe(401);
  });
});
```

#### Checkpoint 7.1.3: Frontend Integration Tests

Create `/frontend/src/__tests__/apiService.test.js`:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../services/apiService';

describe('API Service Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should handle JSend success response', async () => {
    // Mock successful response
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            status: 'success',
            data: { id: '123', email: 'test@example.com' },
            token: 'jwt-token-here',
          }),
      })
    );

    // This should extract data and store token
    const user = await authService.login('test@example.com', 'password');
    
    expect(user.id).toBe('123');
    expect(localStorage.getItem('authToken')).toBe('jwt-token-here');
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

  it('should automatically add auth token to headers', async () => {
    localStorage.setItem('authToken', 'test-token');

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            status: 'success',
            data: { profile: 'data' },
          }),
      })
    );

    await authService.getMe();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });
});
```

#### Checkpoint 7.1.4: E2E Tests

Create `/e2e/tests/auth.e2e.js`:

```javascript
import { test, expect } from '@playwright/test';

test.describe('Authentication E2E', () => {
  test('complete user flow: signup -> login -> profile -> logout', async ({ page }) => {
    // Navigate to signup
    await page.goto('http://localhost:5173/signup');

    // Fill signup form
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'Test@1234');
    await page.fill('input[name="confirmPassword"]', 'Test@1234');
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="phoneNumber"]', '9876543210');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to login
    await expect(page).toHaveURL('http://localhost:5173/login');

    // Fill login form
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'Test@1234');
    await page.click('button[type="submit"]');

    // Should redirect to profile
    await expect(page).toHaveURL('http://localhost:5173/profile');

    // Verify profile data
    await expect(page.locator('text=John Doe')).toBeVisible();

    // Logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('http://localhost:5173/login');
  });

  it('should handle CORS errors gracefully', async ({ page }) => {
    // This test would trigger a CORS error
    // and verify error handling in the UI
  });
});
```

**Task Checklist:**
- [ ] Write unit tests for authentication (signup, login, token refresh)
- [ ] Write integration tests for user profile operations
- [ ] Write frontend tests for API service error handling
- [ ] Write E2E tests for complete user flows
- [ ] Run all tests and achieve >80% code coverage
- [ ] Test CORS from different origins
- [ ] Test 404, 401, 403, 500 error responses
- [ ] Test rate limiting
- [ ] Document test execution in README

---

## Phase 8: Deployment & Monitoring (Week 4)

### 8.1 Vercel Frontend Deployment

#### Checkpoint 8.1.1: Vercel Configuration

Create `/frontend/.env.production`:

```bash
VITE_API_URL=https://api.smartuzhavan.com
VITE_NODE_ENV=production
```

Create `/frontend/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "@vite-api-url"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://api.smartuzhavan.com"
        }
      ]
    }
  ]
}
```

### 8.2 Railway Backend Deployment

#### Checkpoint 8.2.1: Railway Configuration

Create `/backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "src/server.js"]
```

Create `/backend/.railwayapp.json`:

```json
{
  "runtime": "node",
  "modules": [
    {
      "name": "api",
      "path": ".",
      "env": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "MONGODB_URI",
          "description": "MongoDB connection string"
        },
        {
          "name": "JWT_SECRET",
          "description": "JWT signing secret"
        },
        {
          "name": "FRONTEND_URL",
          "value": "https://smartuzhavan.vercel.app"
        }
      ]
    }
  ]
}
```

### 8.3 Monitoring & Logging

#### Checkpoint 8.3.1: Error Tracking Setup

Create `/backend/src/middleware/errorTracking.js`:

```javascript
/**
 * Sentry error tracking integration
 * Captures unhandled errors and sends to Sentry dashboard
 */

const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],
});

const errorTracking = (err, req, res, next) => {
  Sentry.captureException(err, {
    contexts: {
      request: {
        method: req.method,
        path: req.path,
        headers: req.headers,
      },
    },
  });

  next(err);
};

module.exports = { Sentry, errorTracking };
```

**Task Checklist:**
- [ ] Configure Vercel environment variables
- [ ] Configure Railway environment variables
- [ ] Setup MongoDB Atlas backup
- [ ] Setup error tracking (Sentry)
- [ ] Setup uptime monitoring
- [ ] Configure domain DNS
- [ ] SSL/TLS certificate setup
- [ ] Deploy to staging first
- [ ] Run smoke tests on production
- [ ] Setup alerts for critical errors

---

## Phase 9: Documentation & Handoff (End of Week 4)

### 9.1 API Documentation

Create `/docs/API.md` and `/docs/ARCHITECTURE.md`:

**API.md should include:**
- Complete endpoint reference
- Request/response examples
- Error codes and their meanings
- Authentication flow diagram
- Rate limits

**ARCHITECTURE.md should include:**
- System architecture diagram
- Data flow diagrams
- Role-based access control matrix
- Database schema diagram

### 9.2 Deployment Guide

Create `/docs/DEPLOYMENT.md`:

**Should cover:**
- Prerequisites
- Environment setup
- Vercel deployment steps
- Railway deployment steps
- Database migration steps
- Rollback procedures

**Task Checklist:**
- [ ] Write comprehensive API documentation
- [ ] Create architecture diagrams
- [ ] Write deployment procedures
- [ ] Create troubleshooting guide
- [ ] Document known issues and workarounds
- [ ] Create runbooks for common operations
- [ ] Setup CI/CD pipeline (GitHub Actions)
- [ ] Create security checklist
- [ ] Document backup/restore procedures

---

## Summary Checklist

### Backend Implementation
- [ ] **Phase 2:** Response wrapper (JSend), formatter, error handler
- [ ] **Phase 3:** Unified User model, AuthFactory, auth routes
- [ ] **Phase 4:** Schema validation, validators utility
- [ ] **Phase 5:** OpenAPI spec, API registry, rate limiting
- [ ] **Phase 6:** CORS, security headers, session config, logging
- [ ] **Phase 7:** Unit & integration tests (>80% coverage)
- [ ] **Phase 8:** Railway deployment, monitoring setup
- [ ] **Phase 9:** Documentation completion

### Frontend Implementation
- [ ] **Phase 5:** Updated apiService.js with JSend response handler
- [ ] **Phase 6:** Error boundary components, retry logic
- [ ] **Phase 7:** API service tests, E2E tests
- [ ] **Phase 8:** Vercel deployment, environment config
- [ ] **Phase 9:** User documentation, troubleshooting guide

### Infrastructure
- [ ] **Phase 6:** Production .env files, security configuration
- [ ] **Phase 8:** Vercel & Railway setup, CI/CD pipeline
- [ ] **Phase 9:** Monitoring dashboards, alert configuration

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking changes in API | Implement API versioning strategy (/v1/, /v2/) |
| Data migration issues | Create data migration scripts with rollback |
| Auth token expiration | Implement automatic token refresh mechanism |
| CORS still failing | Use proxy (Nginx) as fallback |
| Database connection loss | Implement connection pooling & retry logic |
| Memory leaks in production | Setup heap snapshots & memory monitoring |

---

## Success Metrics

- [ ] Zero "map is not a function" errors in production
- [ ] API response time < 200ms for 95th percentile
- [ ] 99.9% uptime
- [ ] <5% 404/500 error rate
- [ ] 100% auth endpoint availability
- [ ] CORS errors reduced to 0
- [ ] All tests passing (>80% coverage)
- [ ] Deployment time < 5 minutes

---

## Timeline Overview

```
Week 1:  Foundation assessment + Response standardization
Week 2:  Auth factory implementation + Schema enforcement
Week 3:  API contract synchronization + Infrastructure hardening
Week 4:  Testing, deployment, monitoring setup, documentation
```

**Total Effort:** ~4 weeks for a senior full-stack team of 2-3 developers

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Next Review:** After Phase 4 completion
