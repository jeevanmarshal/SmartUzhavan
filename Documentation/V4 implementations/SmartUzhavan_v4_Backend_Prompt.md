# SmartUzhavan v4 Backend Implementation Prompt
## For Anti-Gravity Agent / Claude Code

---

## MISSION STATEMENT

You are implementing the complete backend for **SmartUzhavan v4**, a scalable farm management system. Your goal is to create a production-ready Node.js/Express backend integrated with MongoDB Atlas, Socket.io, and session-based authentication.

**Constraints:**
- Zero infrastructure costs (use only free services)
- Must scale to 100+ concurrent users
- Hybrid architecture: localStorage (browser) + MongoDB (cloud sync)
- Session-based authentication for rural users
- Multi-admin simultaneous access support

---

## PROJECT CONTEXT

**Current State:**
- Frontend: React + Vite (already built)
- Backend: Node.js server exists (only PDF generation on port 5000)
- Database: None (everything in browser localStorage)
- Real-time: Not implemented

**Target State After Implementation:**
- ✅ Full MERN stack with cloud persistence
- ✅ Real-time multi-user updates via Socket.io
- ✅ Audit logging + change history tracking
- ✅ Session-based authentication
- ✅ Server-side reporting and CSV export
- ✅ Deployed to Railway.app or Render.com (free tier)

---

## TECHNOLOGY DECISIONS

| Layer | Technology | Reasoning |
|-------|-----------|-----------|
| **Runtime** | Node.js 18+ (LTS) | Stable, widely supported |
| **Framework** | Express.js 4.x | Lightweight, flexible, perfect for this scale |
| **Database** | MongoDB Atlas (Free: 512MB) | Document-based, JSON-native, easy to use |
| **Sessions** | express-session + connect-mongo | Stateful auth, works offline/online |
| **Real-time** | Socket.io 4.x | Handles reconnects, scales well |
| **Deployment** | Railway.app or Render.com | Free tier, auto-deploys from GitHub |
| **Validation** | express-validator | Middleware validation before DB queries |
| **Password Hashing** | bcryptjs | Industry standard, performant |
| **Logging** | winston | Structured logging for debugging |

---

## DATABASE SCHEMA

### Collections to Create

#### 1. **users**
Purpose: Admin accounts with authentication
```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  password: String (hashed with bcrypt),
  email: String (unique, required),
  role: String (enum: ['admin', 'super_admin', 'operator']),
  lastLogin: Date,
  createdAt: Date,
  isDeleted: Boolean (default: false)
}
```
**Indexes:**
- `username` (unique)
- `email` (unique)

#### 2. **farmers**
Purpose: Core entity - farmer records
```javascript
{
  _id: ObjectId,
  name: String (required),
  phone: String,
  village: String,
  landArea: Number (acres),
  crops: [String],
  soilType: String,
  metadata: Object,
  
  // Audit trail
  createdBy: ObjectId (reference to users),
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean (default: false)
}
```
**Indexes:**
- `name` (text, for full-text search)
- `village`
- `createdAt`
- `isDeleted`
- Text index: `{ name: "text", village: "text", phone: "text" }`

#### 3. **auditLogs**
Purpose: Track all user actions
```javascript
{
  _id: ObjectId,
  userId: ObjectId (reference to users),
  action: String (enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT']),
  entity: String (e.g., 'farmers', 'fields', 'crops'),
  entityId: ObjectId,
  beforeData: Object,
  afterData: Object,
  ipAddress: String,
  timestamp: Date
}
```
**Indexes:**
- `userId`
- `timestamp` (for queries)
- `entityId`

#### 4. **changeHistory**
Purpose: Version control for records
```javascript
{
  _id: ObjectId,
  documentId: ObjectId,
  documentType: String (e.g., 'farmers'),
  version: Number,
  data: Object,
  changedBy: ObjectId,
  changedAt: Date
}
```
**Indexes:**
- `documentId`
- `version`

---

## API ENDPOINTS TO BUILD

### Authentication
```
POST   /api/auth/register      - Register new user (super_admin only)
POST   /api/auth/login         - Login (creates session)
GET    /api/auth/profile       - Get current user (auth required)
POST   /api/auth/logout        - Destroy session
```

### Farmers (Core CRUD)
```
GET    /api/farmers            - List all (with pagination, filtering, search)
POST   /api/farmers            - Create new farmer
GET    /api/farmers/:id        - Get single farmer
PUT    /api/farmers/:id        - Update farmer
DELETE /api/farmers/:id        - Soft delete farmer
```

### Farmer History & Search
```
GET    /api/farmers/:id/history     - Get version history
GET    /api/farmers/:id/restore/:version - Restore previous version
POST   /api/farmers/search           - Full-text search
```

### Reporting
```
GET    /api/reports/summary          - Dashboard stats
GET    /api/reports/farmers/export   - CSV/Excel export
GET    /api/reports/audit-log        - Audit trail viewer
```

### WebSocket Events
```
farmer:created    - When new farmer added
farmer:updated    - When farmer modified
farmer:deleted    - When farmer soft deleted
```

---

## IMPLEMENTATION PHASES

### PHASE 1: Foundation (Week 1-2)
**Goal:** Basic API infrastructure working

**Tasks:**
1. ✅ Set up Express server with middleware
   - Body parser
   - CORS
   - Session middleware with connect-mongo
   - Logging (winston)

2. ✅ Connect to MongoDB Atlas
   - Create free tier cluster
   - Create collections with indexes
   - Connection string in .env

3. ✅ Implement authentication
   - POST /api/auth/login (session creation)
   - POST /api/auth/logout (session destroy)
   - GET /api/auth/profile (session verification)
   - POST /api/auth/register (super_admin only)
   - Auth middleware for protected routes

4. ✅ Basic CRUD for farmers
   - GET /api/farmers (with pagination)
   - POST /api/farmers (create)
   - GET /api/farmers/:id (read)
   - PUT /api/farmers/:id (update)
   - DELETE /api/farmers/:id (soft delete only)

5. ✅ Error handling & validation
   - Input validation (express-validator)
   - Consistent error responses
   - HTTP status codes

**Deliverable:** Working API with Postman tests

---

### PHASE 2: Audit & History (Week 3)
**Goal:** Tracking and compliance

**Tasks:**
1. ✅ Audit logging middleware
   - Intercept all mutations (CREATE, UPDATE, DELETE)
   - Capture beforeData, afterData, userId, IP
   - Log to auditLogs collection

2. ✅ Change history
   - On every UPDATE, create changeHistory entry
   - Versioning system
   - GET /api/farmers/:id/history endpoint
   - Restore functionality

3. ✅ Soft deletes
   - Mark isDeleted: true (don't remove)
   - Filter out deleted from queries by default
   - Admin view to see deleted records

**Deliverable:** Complete audit trail system

---

### PHASE 3: Real-time & Sync (Week 4)
**Goal:** Multi-user simultaneous access

**Tasks:**
1. ✅ Socket.io integration
   - Set up Socket.io server
   - Authentication via session cookie
   - Room-based messaging

2. ✅ Real-time events
   - farmer:created → broadcast to all clients
   - farmer:updated → broadcast with delta
   - farmer:deleted → broadcast soft delete

3. ✅ Browser-server sync
   - When farmer created locally → sync to DB
   - When DB updates from another user → push to localStorage
   - Conflict resolution (timestamps)

4. ✅ Connection handling
   - Reconnection logic
   - Graceful degradation if offline
   - Queue updates while offline

**Deliverable:** Live multi-user experience

---

### PHASE 4: Reporting & Export (Week 5)
**Goal:** Business intelligence

**Tasks:**
1. ✅ Dashboard reporting
   - GET /api/reports/summary
   - Total farmers, crops distribution, villages
   - Return aggregation results

2. ✅ CSV/Excel export
   - Server-side generation (handles large datasets)
   - Stream response for memory efficiency
   - Include audit metadata

3. ✅ Full-text search
   - Implement text indexes in MongoDB
   - POST /api/farmers/search endpoint
   - Return highlighted results

4. ✅ Audit log viewer
   - GET /api/reports/audit-log with filters
   - User, date range, action type filters

**Deliverable:** Reporting suite ready

---

### PHASE 5: Deployment & Testing (Week 6)
**Goal:** Production deployment

**Tasks:**
1. ✅ Environment setup
   - .env file with MongoDB, session secrets
   - Different configs for dev/prod
   - No secrets in code

2. ✅ Deploy to Railway/Render
   - Connect GitHub repo
   - Auto-deploy on push
   - Set environment variables
   - Test endpoints

3. ✅ Testing
   - Integration tests with Jest
   - Test authentication flow
   - Test CRUD + audit logging
   - Test real-time events

4. ✅ Documentation
   - API docs (Postman collection)
   - Deployment guide
   - Troubleshooting guide

5. ✅ Monitoring & Optimization
   - Check MongoDB usage
   - Monitor API response times
   - Set up error tracking (optional)

**Deliverable:** Production-ready system

---

## KEY FEATURES TO IMPLEMENT

### Feature 1: Session-Based Authentication
**Why:** Works offline, easier for rural internet
**Implementation:**
- express-session stores in MongoDB
- Secure httpOnly cookies
- Auto logout after 24 hours inactivity
- Middleware to check auth on protected routes

### Feature 2: Audit Logging
**Why:** Compliance, debugging, accountability
**Implementation:**
- Middleware that intercepts all mutations
- Store before/after data
- Include user, timestamp, IP
- Queryable audit log endpoint

### Feature 3: Change History
**Why:** Data recovery, audit trail, undo capability
**Implementation:**
- On update, save snapshot to changeHistory
- Include version number
- Allow restore to previous version
- GET /api/farmers/:id/history endpoint

### Feature 4: Real-time Sync
**Why:** Multiple admins same data
**Implementation:**
- Socket.io broadcasts farmer:created, farmer:updated, farmer:deleted
- Client listener updates UI
- Sync to localStorage automatically
- Handles network disruptions

### Feature 5: Server-side Reporting
**Why:** Handles 100+ users, large datasets
**Implementation:**
- MongoDB aggregation for statistics
- Pagination for export (50k+ records)
- Stream CSV response
- No client-side data loading limits

---

## CRITICAL IMPLEMENTATION RULES

### Rule 1: Always Use Transactions for Multi-step Operations
```javascript
// When updating farmer, also create auditLog
// Use session to ensure both succeed or both fail
const session = await mongoose.startSession();
try {
  await session.withTransaction(async () => {
    await Farmer.updateOne({_id}, {data}, {session});
    await AuditLog.insertOne({...}, {session});
  });
} catch (err) {
  // Both rolled back automatically
}
```

### Rule 2: Validate Input Before DB Query
```javascript
// Use express-validator
router.post('/farmers', [
  body('name').trim().isLength({min: 1}),
  body('phone').isMobilePhone(),
  body('landArea').isFloat({min: 0})
], (req, res) => {
  // Validation happens first
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json(errors);
  // Then process
});
```

### Rule 3: Never Store Passwords in Plain Text
```javascript
// Always hash before saving
const hashedPassword = await bcrypt.hash(password, 10);
user.password = hashedPassword;
```

### Rule 4: Filter Soft Deletes by Default
```javascript
// Query: include isDeleted: false in all reads
db.farmers.find({isDeleted: false})

// Exception: Admin audit view shows deleted
if (user.role === 'super_admin') {
  // Allow deleted records
}
```

### Rule 5: Log All Errors with Context
```javascript
try {
  await farmer.save();
} catch (err) {
  logger.error('Farmer creation failed', {
    userId: req.user._id,
    error: err.message,
    body: req.body,
    timestamp: new Date()
  });
  res.status(500).json({error: 'Database error'});
}
```

### Rule 6: Broadcast Events After DB Commit
```javascript
// Don't broadcast before DB confirms
await farmer.save(); // Wait for DB
io.emit('farmer:created', {id: farmer._id}); // Then broadcast
```

---

## FILE STRUCTURE

```
server/
├── config/
│   ├── database.js          # MongoDB connection
│   └── session.js           # Session store config
├── middleware/
│   ├── auth.js              # Authentication check
│   ├── audit.js             # Audit logging
│   └── errorHandler.js
├── models/
│   ├── User.js
│   ├── Farmer.js
│   ├── AuditLog.js
│   └── ChangeHistory.js
├── routes/
│   ├── auth.js              # /api/auth/*
│   ├── farmers.js           # /api/farmers/*
│   ├── reports.js           # /api/reports/*
│   └── search.js            # /api/search/*
├── controllers/
│   ├── authController.js
│   ├── farmerController.js
│   ├── reportController.js
│   └── searchController.js
├── utils/
│   ├── validators.js        # Input validation
│   ├── logger.js            # Winston logger
│   └── errorResponse.js
├── .env                     # Secrets (NOT in git)
├── .env.example             # Template for .env
├── server.js                # Main entry point
├── socket.js                # Socket.io setup
└── package.json
```

---

## ENVIRONMENT VARIABLES (.env)

```env
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/smartuzhavan

# Session
SESSION_SECRET=generate-random-string-here
SESSION_TIMEOUT=86400000  # 24 hours in ms

# CORS
FRONTEND_URL=https://your-frontend.com

# Logging
LOG_LEVEL=info
```

---

## TESTING CHECKLIST

### Unit Tests
- [ ] User model validation
- [ ] Farmer model validation
- [ ] Password hashing
- [ ] Soft delete filtering

### Integration Tests
- [ ] Register → Login → Profile → Logout flow
- [ ] Create farmer → triggers audit log
- [ ] Update farmer → creates change history
- [ ] Delete farmer → soft delete only
- [ ] Socket.io farmer:created broadcast

### Load Tests
- [ ] 100 concurrent users
- [ ] 1000 farmer records
- [ ] Query with pagination
- [ ] CSV export with 5000+ records

### Security Tests
- [ ] SQL injection attempts blocked
- [ ] Session hijacking prevented
- [ ] Passwords never logged
- [ ] Soft delete prevents data leakage

---

## DEPLOYMENT CHECKLIST

### Before Deployment
- [ ] All env vars set (no defaults for secrets)
- [ ] CORS configured for frontend domain
- [ ] MongoDB indexes created
- [ ] Error logging working
- [ ] Tests passing
- [ ] No console.logs in production

### Railway/Render Setup
- [ ] GitHub connected
- [ ] Environment variables added
- [ ] Build script: `npm install && npm run build`
- [ ] Start script: `node server.js`
- [ ] Health check endpoint: `GET /health` (returns 200)

### Post-Deployment
- [ ] Test login from production URL
- [ ] Check MongoDB connection
- [ ] Verify Socket.io working
- [ ] Monitor first 24 hours for errors
- [ ] Check storage usage (should be <100MB)

---

## PERFORMANCE TARGETS

| Metric | Target | How to Achieve |
|--------|--------|----------------|
| Login response | <500ms | Index on username, efficient session lookup |
| List farmers (100 items) | <200ms | Pagination, indexed queries |
| Create farmer | <300ms | Validate → Save → Broadcast |
| Broadcast update | <1s latency | Socket.io with no DB re-query |
| CSV export (1000 records) | <5s | Stream response, MongoDB aggregation |
| Real-time sync | <2s | Batch updates, efficient diffs |

---

## TROUBLESHOOTING GUIDE

### Problem: MongoDB connection timeout
**Solution:** Check MONGODB_URI in .env, whitelist IP in Atlas

### Problem: Session not persisting
**Solution:** connect-mongo session store not connected, restart server

### Problem: Socket.io not broadcasting
**Solution:** Check io.emit() called after DB commit, frontend listening

### Problem: Slow exports
**Solution:** Add indexes, use aggregation pipeline, stream response

### Problem: Memory leak in production
**Solution:** Check for circular references, use delete for cleanup

---

## SUCCESS CRITERIA

✅ Backend is DONE when:
1. All CRUD endpoints working with Postman
2. Session-based auth protects endpoints
3. Audit logs created for all mutations
4. Change history tracks all updates
5. Socket.io broadcasts to multiple clients
6. CSV export works for 5000+ records
7. Deployed to Railway/Render with auto-deploy
8. Handles 100+ concurrent users without issues
9. MongoDB storage <200MB
10. All tests passing (unit + integration)

---

## NEXT STEPS FOR ANTI-GRAVITY AGENT

1. **Start with Phase 1**: Set up Express + MongoDB + Auth
2. **Build incrementally**: Each phase should be deployable
3. **Test after each phase**: Don't skip to phase 5
4. **Use this prompt as reference**: Come back to architecture decisions
5. **Document as you go**: Update API docs, environment setup
6. **Ask clarification questions** if anything is ambiguous

---

## Questions to Ask the User If Stuck

1. "Should we use MongoDB Atlas free tier or would you prefer PostgreSQL?"
2. "For soft deletes, should admins have option to permanently delete?"
3. "Do you need scheduled exports (daily CSV to email)?"
4. "Should each farmer have associated records (fields, crops, expenses)?"
5. "What's your target number of farmers before year-end?"

---

**Generated:** May 2026  
**For:** SmartUzhavan Project  
**Status:** Ready for Implementation
