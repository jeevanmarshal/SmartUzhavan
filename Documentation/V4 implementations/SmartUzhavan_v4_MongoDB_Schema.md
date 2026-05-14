# SmartUzhavan v4 - MongoDB Schema & Models Setup Guide

## MongoDB Atlas Free Tier Setup

### Step 1: Create Free Cluster
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up / Login
3. Create a free tier cluster (M0 - 512MB storage)
4. Wait 5-10 minutes for cluster to deploy
5. Create database user (username: admin, password: strong_password)
6. Add IP to allowlist (Add My Current IP or 0.0.0.0/0 for development)

### Step 2: Get Connection String
```
mongodb+srv://admin:password@smartuzhavan.mongodb.net/smartuzhavan?retryWrites=true&w=majority
```

### Step 3: Update .env
```env
MONGODB_URI=mongodb+srv://admin:password@smartuzhavan.mongodb.net/smartuzhavan?retryWrites=true&w=majority
```

---

## Mongoose Models

### 1. User Model

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
    select: false // Don't return password by default
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

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to exclude sensitive fields
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Ensure isDeleted is not shown by default
userSchema.query.active = function() {
  return this.find({ isDeleted: false });
};

module.exports = mongoose.model('User', userSchema);
```

---

### 2. Farmer Model

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
    index: 'text' // Enable full-text search
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
    set: (val) => Math.round(val * 100) / 100 // Round to 2 decimals
  },
  
  crops: {
    type: [String],
    default: [],
    index: true // For filtering by crop
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
    default: {},
    // Custom fields like: { irrigation: 'drip', certification: 'organic', yield: '50 tons/acre' }
  },
  
  // Audit fields
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

// Create compound text index for search
farmerSchema.index({
  name: 'text',
  village: 'text',
  phone: 'text'
});

// Middleware to update updatedAt on save
farmerSchema.pre('findByIdAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Query helper to exclude deleted
farmerSchema.query.active = function() {
  return this.find({ isDeleted: false });
};

// Exclude deleted from findById
farmerSchema.pre(/^find/, function(next) {
  if (this.options._recursed) return next();
  this.find({ isDeleted: false });
  next();
});

module.exports = mongoose.model('Farmer', farmerSchema);
```

---

### 3. Audit Log Model

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
    // For additional context: { restoredFrom: 2, reason: 'user request' }
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
    index: true,
    expires: 31536000 // Auto-delete after 1 year (optional, remove if permanent storage)
  }
});

// Compound index for common queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ entity: 1, entityId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
```

---

### 4. Change History Model

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
    // Full document state at this version
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

// Compound index for common queries
changeHistorySchema.index({ documentId: 1, version: -1 });
changeHistorySchema.index({ documentId: 1, documentType: 1 });

module.exports = mongoose.model('ChangeHistory', changeHistorySchema);
```

---

## MongoDB Indexes Setup

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
    
    // User indexes
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ isDeleted: 1 });
    console.log('✅ User indexes created');
    
    // Farmer indexes
    await Farmer.collection.createIndex({ name: 'text', village: 'text', phone: 'text' });
    await Farmer.collection.createIndex({ village: 1 });
    await Farmer.collection.createIndex({ createdAt: -1 });
    await Farmer.collection.createIndex({ isDeleted: 1 });
    await Farmer.collection.createIndex({ crops: 1 });
    console.log('✅ Farmer indexes created');
    
    // Audit Log indexes
    await AuditLog.collection.createIndex({ userId: 1, timestamp: -1 });
    await AuditLog.collection.createIndex({ entity: 1, entityId: 1, timestamp: -1 });
    await AuditLog.collection.createIndex({ action: 1 });
    console.log('✅ AuditLog indexes created');
    
    // Change History indexes
    await ChangeHistory.collection.createIndex({ documentId: 1, version: -1 });
    await ChangeHistory.collection.createIndex({ documentId: 1, documentType: 1 });
    console.log('✅ ChangeHistory indexes created');
    
    console.log('✅ All indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
}

module.exports = createIndexes;
```

---

## Database Connection Setup

**File: `config/database.js`**

```javascript
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes on connection
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

// Handle connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err}`);
});

module.exports = connectDB;
```

---

## Sample Data Seeding (Optional)

**File: `utils/seedDatabase.js`**

```javascript
const mongoose = require('mongoose');
const User = require('../models/User');
const Farmer = require('../models/Farmer');
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear existing data
    await User.deleteMany({});
    await Farmer.deleteMany({});
    
    // Create super admin
    const superAdmin = new User({
      username: 'admin',
      email: 'admin@smartuzhavan.com',
      password: 'Admin@123',
      role: 'super_admin'
    });
    await superAdmin.save();
    console.log('✅ Super admin created:', superAdmin.username);
    
    // Create sample farmers
    const farmers = [
      {
        name: 'Ramesh Kumar',
        phone: '+919876543210',
        village: 'Kovilpatti',
        landArea: 2.5,
        crops: ['sugarcane', 'groundnut'],
        soilType: 'black soil',
        metadata: { irrigation: 'drip', certification: 'organic' },
        createdBy: superAdmin._id
      },
      {
        name: 'S. Murugan',
        phone: '+919876543211',
        village: 'Madurai',
        landArea: 3.0,
        crops: ['rice', 'sugarcane'],
        soilType: 'loamy soil',
        metadata: { irrigation: 'canal', yield: '60 tons/acre' },
        createdBy: superAdmin._id
      },
      {
        name: 'Anita Singh',
        phone: '+919876543212',
        village: 'Sivaganga',
        landArea: 1.5,
        crops: ['jowar', 'cotton'],
        soilType: 'red soil',
        metadata: { irrigation: 'rainfed' },
        createdBy: superAdmin._id
      }
    ];
    
    const savedFarmers = await Farmer.insertMany(farmers);
    console.log(`✅ ${savedFarmers.length} sample farmers created`);
    
    console.log('✅ Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
```

**Run seeding:**
```bash
node utils/seedDatabase.js
```

---

## Verification Checklist

After setup, verify:

- [ ] MongoDB Atlas cluster created and running
- [ ] Connection string in .env file
- [ ] All 4 models imported correctly
- [ ] Indexes created on first server start
- [ ] Sample data seeded (optional)
- [ ] Connections tested with simple query

**Test connection script (`utils/testConnection.js`):**

```javascript
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const userCount = await User.countDocuments();
    console.log(`✅ Connected successfully. Users in DB: ${userCount}`);
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('✅ Disconnected');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testConnection();
```

---

## Data Validation Rules Summary

| Field | Type | Rules | Example |
|-------|------|-------|---------|
| **User.username** | String | 3-20 chars, unique, alphanumeric + _ | john_admin |
| **User.email** | String | Valid format, unique, lowercase | john@example.com |
| **User.password** | String | 8+ chars, hashed | (never stored plain) |
| **User.role** | Enum | admin, super_admin, operator | admin |
| **Farmer.name** | String | 2-100 chars, required | Ramesh Kumar |
| **Farmer.phone** | String | Valid Indian mobile | +919876543210 |
| **Farmer.village** | String | 2-50 chars, required, indexed | Kovilpatti |
| **Farmer.landArea** | Number | Positive, rounded to 2 decimals | 2.5 |
| **Farmer.crops** | Array | String values | ["sugarcane", "groundnut"] |
| **Farmer.soilType** | Enum | Predefined soil types | black soil |

---

## Performance Optimization Tips

### 1. Index Strategy
- ✅ Indexed: `username`, `email`, `village`, `createdAt`, `isDeleted`
- ✅ Text indexes: `name`, `village`, `phone` (for search)
- ✅ Compound indexes: `(userId, timestamp)`, `(documentId, version)`

### 2. Query Optimization
```javascript
// ❌ Slow: fetches all and filters in app
const farmers = await Farmer.find();
const result = farmers.filter(f => f.village === 'Kovilpatti');

// ✅ Fast: filters in database
const farmers = await Farmer.find({ village: 'Kovilpatti' });

// ✅ Faster: with pagination
const farmers = await Farmer
  .find({ village: 'Kovilpatti' })
  .limit(20)
  .skip(0);
```

### 3. Projection
```javascript
// ✅ Only fetch needed fields
const farmers = await Farmer.find()
  .select('name phone village')
  .limit(20);
```

### 4. Lean Queries
```javascript
// ✅ When not modifying, use lean() for speed
const farmers = await Farmer.find().lean();
```

---

## Backup & Recovery

### Manual Backup (MongoDB Atlas)
1. Go to Atlas Dashboard
2. Select Cluster → Backup
3. Click "Take Snapshot"
4. Automatic backups run daily (free tier)

### Export Data
```bash
# Export farmers collection to JSON
mongoexport --uri="mongodb+srv://user:pass@cluster.mongodb.net/smartuzhavan" \
  --collection=farmers \
  --out=farmers_backup.json
```

---

**Version:** 4.0  
**Last Updated:** May 2026  
**Status:** Ready for Development
