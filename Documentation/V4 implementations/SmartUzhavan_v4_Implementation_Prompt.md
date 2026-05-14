# SmartUzhavan v4 Backend - Complete Implementation Prompt

## For: Developers, AI Code Generators, and Development Teams

---

## 🎯 MISSION

Build a production-ready MERN stack backend for SmartUzhavan (farm management system) following the v4 Complete Documentation. The backend must:

- ✅ Handle 100+ concurrent users
- ✅ Provide real-time multi-user synchronization
- ✅ Maintain complete audit trail
- ✅ Cost $0/month (free tier services only)
- ✅ Deploy to production in week 6
- ✅ Pass security and performance requirements

---

## 📋 PRE-IMPLEMENTATION CHECKLIST

Before you start, ensure:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] GitHub repository created and cloned locally
- [ ] MongoDB Atlas free cluster created and connection string ready
- [ ] GitHub repository connected to Railway/Render
- [ ] Team members read v4 Complete Documentation
- [ ] Project timeline planned (5 weeks, ~27.5 hours)

---

## 🚀 PHASE 1: FOUNDATION (6 hours, Week 1-2)

### Goal
Build a working REST API with basic authentication and Farmer CRUD operations.

### 1.1 Project Initialization (30 minutes)

**Create package.json with these dependencies:**
```json
{
  "name": "smartuzhavan-backend",
  "version": "4.0.0",
  "description": "Farm Management System Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "engines": {
    "node": "18.x"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "express-session": "^1.17.3",
    "connect-mongo": "^5.0.0",
    "socket.io": "^4.5.0",
    "bcryptjs": "^2.4.3",
    "express-validator": "^7.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "winston": "^3.8.2",
    "csv-writer": "^1.6.0",
    "exceljs": "^4.3.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22",
    "jest": "^29.5.0"
  }
}
```

**Run:**
```bash
npm install
```

**Create .env file:**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/smartuzhavan
SESSION_SECRET=dev-secret-32-characters-here
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=debug
```

**Create .env.example:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=
SESSION_SECRET=
FRONTEND_URL=
LOG_LEVEL=info
```

**Create .gitignore:**
```
node_modules/
.env
.env.local
dist/
*.log
.DS_Store
```

---

### 1.2 Database Connection (20 minutes)

**File: `config/database.js`**

```javascript
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes
    if (process.env.NODE_ENV !== 'test') {
      const createIndexes = require('../utils/createIndexes');
      await createIndexes();
    }
    
    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

**Test connection:**
```bash
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected'))
  .catch(err => console.log('❌ Error:', err.message));
"
```

---

### 1.3 Create Mongoose Models (45 minutes)

**File: `models/User.js`**

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username must not exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  
  role: {
    type: String,
    enum: {
      values: ['admin', 'super_admin', 'operator'],
      message: 'Invalid role'
    },
    default: 'admin'
  },
  
  lastLogin: {
    type: Date,
    default: null
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Exclude password from JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
```

**File: `models/Farmer.js`**

```javascript
const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Farmer name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name must not exceed 100 characters'],
    index: 'text'
  },
  
  phone: {
    type: String,
    trim: true,
    match: [/^(\+91)?[6-9]\d{9}$/, 'Please provide a valid Indian phone number']
  },
  
  village: {
    type: String,
    required: [true, 'Village name is required'],
    trim: true,
    minlength: [2, 'Village name must be at least 2 characters'],
    maxlength: [50, 'Village name must not exceed 50 characters'],
    index: true
  },
  
  landArea: {
    type: Number,
    required: [true, 'Land area is required'],
    min: [0.01, 'Land area must be greater than 0'],
    set: (val) => Math.round(val * 100) / 100
  },
  
  crops: {
    type: [String],
    default: [],
    index: true
  },
  
  soilType: {
    type: String,
    enum: {
      values: ['black soil', 'red soil', 'loamy soil', 'clay soil', 'alluvial soil', 'laterite soil', 'other'],
      message: 'Invalid soil type'
    },
    default: 'other'
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
});

// Create text indexes
farmerSchema.index({ name: 'text', village: 'text', phone: 'text' });

// Exclude deleted from queries
farmerSchema.pre(/^find/, function(next) {
  if (this.options._recursed) return next();
  this.find({ isDeleted: false });
  next();
});

module.exports = mongoose.model('Farmer', farmerSchema);
```

**File: `models/AuditLog.js`**

```javascript
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  action: {
    type: String,
    enum: {
      values: ['CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'EXPORT'],
      message: 'Invalid action'
    },
    required: true,
    index: true
  },
  
  entity: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: ['farmers', 'fields', 'crops', 'user', 'other'],
    index: true
  },
  
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  beforeData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  afterData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  ipAddress: {
    type: String,
    required: true
  },
  
  userAgent: {
    type: String,
    default: null
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound indexes
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ entity: 1, entityId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
```

**File: `models/ChangeHistory.js`**

```javascript
const mongoose = require('mongoose');

const changeHistorySchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  documentType: {
    type: String,
    required: [true, 'Document type is required'],
    enum: ['farmers', 'fields', 'crops'],
    index: true
  },
  
  version: {
    type: Number,
    required: true,
    index: true
  },
  
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  changedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound indexes
changeHistorySchema.index({ documentId: 1, version: -1 });
changeHistorySchema.index({ documentId: 1, documentType: 1 });

module.exports = mongoose.model('ChangeHistory', changeHistorySchema);
```

**File: `utils/createIndexes.js`**

```javascript
const mongoose = require('mongoose');
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const AuditLog = require('../models/AuditLog');
const ChangeHistory = require('../models/ChangeHistory');

async function createIndexes() {
  try {
    console.log('Creating MongoDB indexes...');
    
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    
    await Farmer.collection.createIndex({ name: 'text', village: 'text', phone: 'text' });
    
    await AuditLog.collection.createIndex({ userId: 1, timestamp: -1 });
    await AuditLog.collection.createIndex({ entity: 1, entityId: 1, timestamp: -1 });
    
    await ChangeHistory.collection.createIndex({ documentId: 1, version: -1 });
    
    console.log('✅ All indexes created');
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
}

module.exports = createIndexes;
```

---

### 1.4 Logging Setup (15 minutes)

**File: `utils/logger.js`**

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp }) => 
      `${timestamp} ${level.toUpperCase()}: ${message}`
    )
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

module.exports = logger;
```

---

### 1.5 Authentication Middleware (30 minutes)

**File: `middleware/auth.js`**

```javascript
const User = require('../models/User');
const logger = require('../utils/logger');

// Check if user is authenticated
const isAuthenticated = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please login first.'
      }
    });
  }
  
  try {
    const user = await User.findById(req.session.userId);
    if (!user || user.isDeleted) {
      req.session.destroy();
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found or has been deleted'
        }
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    logger.error(`Auth error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
};

// Check if user has required role
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action'
        }
      });
    }
    next();
  };
};

module.exports = { isAuthenticated, checkRole };
```

---

### 1.6 Authentication Routes (1.5 hours)

**File: `routes/auth.js`**

```javascript
const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../utils/logger');
const { isAuthenticated, checkRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', [
  body('username').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  body('role').isIn(['admin', 'operator'])
], isAuthenticated, checkRole(['super_admin']), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { username, email, password, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: existingUser.username === username ? 'username' : 'email',
            message: 'Already exists'
          }
        ]
      });
    }
    
    const user = new User({ username, email, password, role });
    await user.save();
    
    logger.info(`User registered: ${username}`);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: user.toJSON()
    });
  } catch (error) {
    logger.error(`Register error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { username, password } = req.body;
    const user = await User.findOne({ username }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      logger.warn(`Failed login attempt: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    
    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();
    
    // Create session
    req.session.userId = user._id;
    
    logger.info(`User logged in: ${username}`);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: user.toJSON()
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// GET /api/auth/profile
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toJSON()
    });
  } catch (error) {
    logger.error(`Profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// POST /api/auth/logout
router.post('/logout', isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error(`Logout error: ${err.message}`);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Logout failed'
        }
      });
    }
    
    logger.info(`User logged out: ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

module.exports = router;
```

---

### 1.7 Farmer CRUD Routes (1.5 hours)

**File: `routes/farmers.js`**

```javascript
const express = require('express');
const { body, validationResult } = require('express-validator');
const Farmer = require('../models/Farmer');
const AuditLog = require('../models/AuditLog');
const ChangeHistory = require('../models/ChangeHistory');
const logger = require('../utils/logger');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// GET /api/farmers
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // Search
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    
    // Filters
    if (req.query.village) query.village = req.query.village;
    if (req.query.crop) query.crops = req.query.crop;
    
    const farmers = await Farmer.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Farmer.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        farmers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          recordsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    logger.error(`Get farmers error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// POST /api/farmers
router.post('/', [
  body('name').isLength({ min: 2, max: 100 }),
  body('village').isLength({ min: 2, max: 50 }),
  body('landArea').isFloat({ min: 0.01 }),
  body('phone').optional().matches(/^(\+91)?[6-9]\d{9}$/),
  body('crops').optional().isArray(),
  body('soilType').optional().isIn(['black soil', 'red soil', 'loamy soil', 'clay soil', 'alluvial soil', 'laterite soil', 'other'])
], isAuthenticated, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const farmer = new Farmer({
      ...req.body,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });
    
    await farmer.save();
    
    // Create audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'CREATE',
      entity: 'farmers',
      entityId: farmer._id,
      beforeData: null,
      afterData: farmer.toObject(),
      ipAddress: req.ip
    });
    
    // Create change history v1
    await ChangeHistory.create({
      documentId: farmer._id,
      documentType: 'farmers',
      version: 1,
      data: farmer.toObject(),
      changedBy: req.user._id
    });
    
    logger.info(`Farmer created: ${farmer._id}`);
    
    res.status(201).json({
      success: true,
      message: 'Farmer created successfully',
      data: farmer
    });
  } catch (error) {
    logger.error(`Create farmer error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// GET /api/farmers/:id
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id).populate('createdBy', 'username');
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }
    
    const changeHistory = await ChangeHistory.find({
      documentId: farmer._id,
      documentType: 'farmers'
    }).populate('changedBy', 'username').sort({ version: -1 });
    
    res.json({
      success: true,
      data: {
        farmer,
        changeHistory
      }
    });
  } catch (error) {
    logger.error(`Get farmer error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// PUT /api/farmers/:id
router.put('/:id', [
  body('name').optional().isLength({ min: 2, max: 100 }),
  body('village').optional().isLength({ min: 2, max: 50 }),
  body('landArea').optional().isFloat({ min: 0.01 }),
  body('phone').optional().matches(/^(\+91)?[6-9]\d{9}$/),
  body('crops').optional().isArray(),
  body('soilType').optional().isIn(['black soil', 'red soil', 'loamy soil', 'clay soil', 'alluvial soil', 'laterite soil', 'other'])
], isAuthenticated, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const farmer = await Farmer.findById(req.params.id);
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }
    
    const beforeData = farmer.toObject();
    
    Object.assign(farmer, req.body);
    farmer.updatedBy = req.user._id;
    farmer.updatedAt = new Date();
    
    await farmer.save();
    
    // Create audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'UPDATE',
      entity: 'farmers',
      entityId: farmer._id,
      beforeData,
      afterData: farmer.toObject(),
      ipAddress: req.ip
    });
    
    // Create change history
    const lastVersion = await ChangeHistory.findOne({
      documentId: farmer._id
    }).sort({ version: -1 });
    
    const nextVersion = (lastVersion?.version || 0) + 1;
    
    await ChangeHistory.create({
      documentId: farmer._id,
      documentType: 'farmers',
      version: nextVersion,
      data: farmer.toObject(),
      changedBy: req.user._id
    });
    
    logger.info(`Farmer updated: ${farmer._id}`);
    
    res.json({
      success: true,
      message: 'Farmer updated successfully',
      data: farmer,
      changeHistoryVersion: nextVersion
    });
  } catch (error) {
    logger.error(`Update farmer error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// DELETE /api/farmers/:id
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id);
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found or already deleted'
      });
    }
    
    const beforeData = farmer.toObject();
    
    farmer.isDeleted = true;
    farmer.updatedBy = req.user._id;
    farmer.updatedAt = new Date();
    
    await farmer.save();
    
    // Create audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'DELETE',
      entity: 'farmers',
      entityId: farmer._id,
      beforeData,
      afterData: { isDeleted: true },
      ipAddress: req.ip
    });
    
    logger.info(`Farmer deleted (soft): ${farmer._id}`);
    
    res.json({
      success: true,
      message: 'Farmer deleted successfully',
      data: {
        id: farmer._id,
        isDeleted: true
      }
    });
  } catch (error) {
    logger.error(`Delete farmer error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

module.exports = router;
```

---

### 1.8 Main Server File (20 minutes)

**File: `server.js`**

```javascript
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/database');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/farmers', require('./routes/farmers'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Socket.io setup (will implement in Phase 3)
io.use((socket, next) => {
  const sessionId = socket.handshake.headers.cookie;
  if (!sessionId) {
    return next(new Error('Authentication required'));
  }
  next();
});

// Error handling
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`✅ Backend ready at http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = app;
```

---

### 1.9 Testing Phase 1 (30 minutes)

**Test with Postman or curl:**

```bash
# Start server
npm run dev

# Test health endpoint
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "Admin@123456",
    "role": "super_admin"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "username": "admin",
    "password": "Admin@123456"
  }'

# Get profile
curl http://localhost:5000/api/auth/profile \
  -b cookies.txt

# Create farmer
curl -X POST http://localhost:5000/api/farmers \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Ramesh Kumar",
    "phone": "+919876543210",
    "village": "Kovilpatti",
    "landArea": 2.5,
    "crops": ["sugarcane", "groundnut"],
    "soilType": "black soil"
  }'

# List farmers
curl http://localhost:5000/api/farmers \
  -b cookies.txt
```

---

### Phase 1 Checklist
- [ ] Project initialized with all dependencies
- [ ] .env file created with correct variables
- [ ] MongoDB connection working
- [ ] All 4 models created
- [ ] Indexes created
- [ ] Authentication routes working (register, login, profile, logout)
- [ ] Farmer CRUD endpoints working
- [ ] Input validation on all endpoints
- [ ] Error handling implemented
- [ ] Tests passing in Postman
- [ ] Code committed to GitHub

---

## PHASE 2: AUDIT & HISTORY (4 hours, Week 3)

### Goal
Implement comprehensive audit logging and version control system.

### 2.1 Audit Logging Middleware (1 hour)

**File: `middleware/audit.js`**

```javascript
const AuditLog = require('../models/AuditLog');

const auditMiddleware = async (req, res, next) => {
  if (!req.user || !['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }
  
  // Capture response to log it
  const originalJson = res.json;
  res.json = function(data) {
    if (data.success && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
      // Log will be created in route handlers
    }
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = auditMiddleware;
```

### 2.2 History API Endpoints (1.5 hours)

**Add to `routes/farmers.js`:**

```javascript
// GET /api/farmers/:id/history
router.get('/:id/history', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const versions = await ChangeHistory.find({
      documentId: req.params.id,
      documentType: 'farmers'
    })
      .populate('changedBy', 'username')
      .sort({ version: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await ChangeHistory.countDocuments({
      documentId: req.params.id,
      documentType: 'farmers'
    });
    
    res.json({
      success: true,
      data: {
        farmerId: req.params.id,
        versions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalVersions: total
        }
      }
    });
  } catch (error) {
    logger.error(`Get history error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' }
    });
  }
});

// POST /api/farmers/:id/restore/:version
router.post('/:id/restore/:version', isAuthenticated, async (req, res) => {
  try {
    const version = parseInt(req.params.version);
    const farmer = await Farmer.findById(req.params.id);
    
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }
    
    const changeRecord = await ChangeHistory.findOne({
      documentId: req.params.id,
      documentType: 'farmers',
      version
    });
    
    if (!changeRecord) {
      return res.status(404).json({ success: false, message: 'Version not found' });
    }
    
    const beforeData = farmer.toObject();
    Object.assign(farmer, changeRecord.data);
    farmer.updatedBy = req.user._id;
    farmer.updatedAt = new Date();
    await farmer.save();
    
    // Create audit log and new version
    await AuditLog.create({
      userId: req.user._id,
      action: 'RESTORE',
      entity: 'farmers',
      entityId: farmer._id,
      beforeData,
      afterData: farmer.toObject(),
      metadata: { restoredFrom: version },
      ipAddress: req.ip
    });
    
    const lastVersion = await ChangeHistory.findOne({
      documentId: farmer._id
    }).sort({ version: -1 });
    
    await ChangeHistory.create({
      documentId: farmer._id,
      documentType: 'farmers',
      version: (lastVersion?.version || 0) + 1,
      data: farmer.toObject(),
      changedBy: req.user._id
    });
    
    logger.info(`Farmer restored from version ${version}: ${farmer._id}`);
    
    res.json({
      success: true,
      message: `Farmer restored to version ${version}`,
      data: farmer
    });
  } catch (error) {
    logger.error(`Restore error: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } });
  }
});
```

### Phase 2 Checklist
- [ ] Audit logs created for all mutations
- [ ] Change history tracked with versioning
- [ ] History retrieval working
- [ ] Restore functionality working
- [ ] Soft deletes filtering correctly

---

## PHASE 3: REAL-TIME & SYNC (5 hours, Week 4)

Update `server.js` and implement Socket.io events in routes. Follow Section 3 of the Complete Documentation PDF for detailed Socket.io setup and real-time synchronization strategy.

### Phase 3 Key Features:
- Socket.io connection and authentication
- farmer:created, farmer:updated, farmer:deleted broadcasts
- Offline/online detection and sync
- Graceful reconnection handling

---

## PHASE 4: REPORTING & EXPORT (5 hours, Week 5)

Implement dashboard statistics, CSV/Excel export, and audit log viewer.

**File: `routes/reports.js`**
- GET /api/reports/summary (dashboard stats via aggregation pipeline)
- GET /api/reports/farmers/export (CSV and XLSX export with streaming)
- GET /api/reports/audit-log (audit trail viewer with filtering)

Refer to Complete Documentation PDF Section 10 for detailed reporting implementation.

---

## PHASE 5: DEPLOYMENT & TESTING (7.5 hours, Week 6)

Deploy to Railway.app or Render.com following the Deployment Guide.

**Key tasks:**
- Environment configuration
- GitHub repository setup
- Railway/Render platform configuration
- Integration testing
- Performance testing (100+ concurrent users)
- Security hardening
- Monitoring setup
- Team documentation and training

---

## QUICK REFERENCE COMMANDS

```bash
# Development
npm run dev          # Start with nodemon
npm test            # Run tests
npm start           # Production start

# Database
node utils/seedDatabase.js    # Seed sample data
node utils/testConnection.js  # Test DB connection

# Git
git add .
git commit -m "Phase 1: Foundation complete"
git push origin main
```

---

## SUCCESS MILESTONES

**Phase 1 (6 hours):** ✅ REST API working  
**Phase 2 (4 hours):** ✅ Audit logging  
**Phase 3 (5 hours):** ✅ Real-time sync  
**Phase 4 (5 hours):** ✅ Reporting  
**Phase 5 (7.5 hours):** ✅ Production deployment  

**Total: 27.5 hours → Production backend ready! 🚀**

---

## CRITICAL REMINDERS

1. **Test after each phase** - Don't skip ahead
2. **Commit frequently** - Git saves your progress
3. **Monitor logs** - Errors show what's wrong
4. **Read error messages carefully** - They're helpful
5. **Test locally before deploying** - Catch issues early
6. **Never commit .env to GitHub** - Security first
7. **Use Postman** - Makes API testing easy
8. **Document as you go** - Help future developers

---

## SUPPORT & RESOURCES

| Topic | URL |
|-------|-----|
| Node.js Docs | https://nodejs.org/docs |
| Express Docs | https://expressjs.com |
| MongoDB Docs | https://docs.mongodb.com |
| Mongoose | https://mongoosejs.com |
| Socket.io | https://socket.io/docs |
| Railway | https://railway.app/docs |
| Render | https://render.com/docs |

---

**Generated:** May 2026  
**For:** SmartUzhavan v4 Implementation  
**Status:** ✅ READY TO CODE

**Let's build something amazing! 🚀**
