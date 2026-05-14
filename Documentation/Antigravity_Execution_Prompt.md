# ANTIGRAVITY EXECUTION PROMPT
## SmartUzhavan V5 Implementation Instructions for AI Code Assistant

---

## CRITICAL PREAMBLE

You are now tasked with executing the **SmartUzhavan V5 Architecture & Implementation Plan**  document (provided in full).

**DO NOT PROCEED without:**
1. Reading the ENTIRE V5 Architecture document
2. Understanding the current system state (mixed localStorage + partial backend)
3. Understanding the target state (full API-driven, real-time, production-ready)
4. Grasping the 9-week timeline and phase sequencing

This prompt provides strict execution instructions. Your job is to implement precisely as specified, maintaining safety, quality, and production-readiness.

---

## EXECUTION PRINCIPLES

### 1. PHASE-DRIVEN EXECUTION
- Execute strictly in order: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
- Do NOT jump ahead
- Complete phase deliverables before starting next phase
- Report completion status after each phase

### 2. ZERO BREAKING CHANGES
- Maintain backward compatibility wherever possible
- If breaking change is necessary, document clearly
- Provide migration path for affected users
- Test thoroughly before breaking changes

### 3. PRODUCTION SAFETY
- Every piece of code must be production-grade
- Comprehensive error handling
- Proper logging and monitoring hooks
- Security best practices enforced
- Performance tested before deployment

### 4. TESTING FIRST
- Write tests before/while implementing features
- Unit tests for all business logic
- Integration tests for all APIs
- E2E tests for critical user flows
- Mobile-responsive testing

### 5. DOCUMENTATION AS CODE
- Self-documenting code (clear variable names, function purposes)
- JSDoc comments for complex functions
- Architecture decisions documented
- API changes documented
- Migration guides for breaking changes

### 6. CONTINUOUS VERIFICATION
- After each file modification: verify no regressions
- After each feature: verify calculations are correct
- After each API: verify response format
- After each UI change: verify Tamil text rendering
- After all work: full system integration test

---

## PHASE 1: BACKEND FOUNDATION
### Duration: Week 1-2
### Objective: Create backend APIs for all V5 modules

---

## PHASE 1 EXECUTION INSTRUCTIONS

### Task 1.1: Database Schema Expansion

**File: `backend/models/Driver.js`**
```
REQUIREMENTS:
- Create Driver model (was missing)
- Fields: id, name, phone (unique), village, pin (unique), baseRate, active, timestamps, createdBy, isDeleted
- Indexes: phone, village, active
- Validation: phone format, pin format
- Methods: toJSON() for API responses, hashPIN() for secure PIN storage
```

**Deliverable:** Driver model working with validation

**Testing:**
```javascript
// Verify these work:
1. Can create driver with valid data
2. Cannot create driver without required fields
3. Phone number validation working
4. PIN hashing working (bcrypt)
5. Indexes created in MongoDB
```

---

**File: `backend/models/Worker.js`**
```
REQUIREMENTS:
- Create Worker model (was missing)
- Fields: id, name, phone, village, workTypes[], rates{}, active, timestamps, isDeleted
- Work types: plowing, harvesting, transport (and more as needed)
- Rates: per-work-type pricing
- Indexes: on active, village
```

**Deliverable:** Worker model fully functional

---

**File: `backend/models/Expense.js`**
```
REQUIREMENTS:
- Create Expense model (was missing)
- Type: enum [business, own_farm, home]
- Category: string (later configurable)
- Fields: amount, date, description, createdBy, timestamps, isDeleted
- Validation: amount > 0, date valid, category required
- Indexes: type, category, date, createdBy
```

**Deliverable:** Expense model with proper categorization

---

**File: `backend/models/HarvesterJob.js`**
```
REQUIREMENTS:
- Create HarvesterJob model (was missing)
- Fields: farmer_id, equipment, location, area, startDate, endDate
- Status: enum [scheduled, in-progress, completed]
- linkedLogIds: array of driver log IDs
- Payments: array of {amount, date, method}
- Validation: date ranges valid, area > 0
- Indexes: farmer_id, status, startDate
```

**Deliverable:** HarvesterJob model with linking validation

---

**File: `backend/models/Rental.js`**
```
REQUIREMENTS:
- Create Rental model (was missing)
- Fields: farmer_id, equipment_id, startDate, endDate, hours, ratePerHour, totalAmount
- Status: enum [scheduled, in-progress, completed]
- Payment tracking
- Validation: dates valid, hours > 0
```

**Deliverable:** Rental model functional

---

**File: `backend/models/FinanceLending.js`**
```
REQUIREMENTS:
- Create FinanceLending model (was missing)
- Type: enum [loan, advance, credit]
- Fields: farmer_id, amount, purpose, date, dueDate
- Payments: array tracking
- Status: enum [pending, partial, completed]
- Interest calculation if applicable
```

**Deliverable:** Finance model with payment tracking

---

**File: `backend/models/OwnFarmIncome.js`**
```
REQUIREMENTS:
- Create OwnFarmIncome model (was missing)
- Type: enum [paddy, straw]
- Fields: quantity (bags/bundles), price_per_unit, total_amount, date
- Calculation: quantity × price = amount
- Validation: quantity > 0, price > 0
```

**Deliverable:** Income model with type-specific logic

---

**File: `backend/models/DriverLog.js`**
```
REQUIREMENTS:
- Create DriverLog model (was missing)
- Fields: driver_id, date, sessions[], diesel{}, linkedJobId
- Sessions: array of {startTime, endTime, duration}
- Diesel: {mode: [none/litres/rupees], value, pricePerLitre}
- Calculation: sum all session durations, calculate diesel cost
- Status tracking: submitted, approved, paid
```

**Deliverable:** DriverLog with complex session tracking

---

**File: `backend/models/WorkerRecord.js`**
```
REQUIREMENTS:
- Create WorkerRecord model (was missing)
- Fields: worker_id, date, work_type, units, rate_per_unit, total_amount
- Work types: must match worker's available types
- Calculation: units × rate = amount
- Validation: work type in worker's approved list
```

**Deliverable:** WorkerRecord with type validation

---

**File: `backend/models/Settings.js`**
```
REQUIREMENTS:
- Create Settings model (was missing)
- Schema: key (unique), value, type, category, lastUpdated
- Types: prices, configs, categories, work_types
- Categories: [driver_rates, worker_rates, expense_categories, etc]
- Soft update capability (not restarting system)
```

**Deliverable:** Settings model for dynamic configuration

---

### Task 1.2: Create API Routes

**File: `backend/routes/drivers.js`** (Create new, ~300 LOC)
```
ENDPOINTS REQUIRED (8 total):
POST   /api/drivers                  - Create driver
GET    /api/drivers                  - List with pagination
GET    /api/drivers/:id              - Get single driver
PUT    /api/drivers/:id              - Update driver
DELETE /api/drivers/:id              - Soft delete
POST   /api/drivers/:id/change-pin   - Change PIN (admin only)
GET    /api/drivers/:id/salary-history - Get salary records
GET    /api/drivers/:id/pdf/salary   - Generate salary PDF

VALIDATION:
- All endpoints require authentication
- Permission checks: admin only (except salary-history for own user)
- Input validation on all POST/PUT
- Proper error responses (400, 401, 403, 404, 500)

RESPONSE FORMAT (standard):
{
  "success": true,
  "data": {...},
  "meta": {
    "timestamp": ISO8601,
    "requestId": "uuid",
    "version": "v5.0"
  },
  "pagination": {page, limit, total, pages}
}
```

**Deliverable:** All driver endpoints working with tests

---

**File: `backend/routes/workers.js`** (Create new, ~250 LOC)
```
ENDPOINTS REQUIRED (8 total):
POST   /api/workers                  - Create worker
GET    /api/workers                  - List with filtering
GET    /api/workers/:id              - Get worker detail
PUT    /api/workers/:id              - Update worker
DELETE /api/workers/:id              - Soft delete

POST   /api/worker-records           - Log work
GET    /api/worker-records?filter... - List with filters
PUT    /api/worker-records/:id       - Update work record
DELETE /api/worker-records/:id       - Delete work record

FILTERS REQUIRED:
- Date range (fromDate, toDate)
- Work type filtering
- Worker filtering
- Status filtering (submitted, approved, paid)
```

**Deliverable:** All worker endpoints with filtering

---

**File: `backend/routes/expenses.js`** (Create new, ~200 LOC)
```
ENDPOINTS REQUIRED (6 total):
POST   /api/expenses                 - Create expense
GET    /api/expenses?filter...       - List with filters
PUT    /api/expenses/:id             - Update expense
DELETE /api/expenses/:id             - Delete expense

GET    /api/expenses/summary         - Category summary
GET    /api/expenses/report          - Export report

FILTERS:
- Type (business, own_farm, home)
- Category
- Date range
- Amount range

AGGREGATIONS:
- Sum by category
- Sum by type
- Trend over time
```

**Deliverable:** Expense endpoints with aggregations

---

**File: `backend/routes/harvester.js`** (Create new, ~250 LOC)
```
ENDPOINTS REQUIRED (8 total):
POST   /api/harvester-jobs           - Create job
GET    /api/harvester-jobs           - List jobs
GET    /api/harvester-jobs/:id       - Get job detail
PUT    /api/harvester-jobs/:id       - Update job
DELETE /api/harvester-jobs/:id       - Delete job

POST   /api/harvester-jobs/:id/link-logs - Link driver logs
GET    /api/harvester-jobs/:id/pdf   - Generate job report

VALIDATION:
- Linking: validate logs exist and belong to correct driver
- Date ranges: validate start < end
- Payment tracking: validate amounts, track partial payments
```

**Deliverable:** Harvester endpoints with job management

---

**File: `backend/routes/finance.js`** (Create new, ~250 LOC)
```
ENDPOINTS REQUIRED (7 total):
POST   /api/finance-records          - Create loan/lending
GET    /api/finance-records          - List with status filter
GET    /api/finance-records/:id      - Get loan detail
PUT    /api/finance-records/:id      - Update loan

POST   /api/finance-records/:id/payment - Record payment
DELETE /api/finance-records/:id      - Delete loan

GET    /api/finance-records/summary  - Finance summary
GET    /api/finance-records/overdue  - Overdue payments

CALCULATIONS:
- Total due: principal + interest (if applicable)
- Amount paid: sum of payments
- Balance: due - paid
- Status: pending/partial/completed
```

**Deliverable:** Finance endpoints with payment tracking

---

**File: `backend/routes/own-farm-income.js`** (Create new, ~200 LOC)
```
ENDPOINTS REQUIRED (6 total):
POST   /api/own-farm-income          - Create income entry
GET    /api/own-farm-income?type=... - List by type (paddy/straw)
PUT    /api/own-farm-income/:id      - Update entry
DELETE /api/own-farm-income/:id      - Delete entry

GET    /api/own-farm-income/summary  - Income summary

CALCULATIONS (CRITICAL):
- Type: paddy OR straw (not both in single entry)
- Paddy: bags × price_per_bag = amount
- Straw: bundles × price_per_bundle = amount
- Summary: total paddy, total straw, combined total

VALIDATION:
- Type must be specified
- Quantity > 0
- Price > 0
- Cannot have both paddy and straw in one entry
```

**Deliverable:** Income endpoints with type-specific logic

---

**File: `backend/routes/settings.js`** (Create new, ~200 LOC)
```
ENDPOINTS REQUIRED (4 total):
GET    /api/settings                 - Get all settings
PUT    /api/settings/:key            - Update setting

GET    /api/settings/prices          - Get pricing config
GET    /api/settings/categories      - Get expense categories

SETTINGS STRUCTURE:
{
  key: "expense_categories",
  value: {
    business: ["diesel", "maintenance", "labor", ...],
    own_farm: ["seeds", "fertilizer", ...],
    home: ["food", "utilities", ...]
  },
  type: "categories",
  lastUpdated: ISO8601
}

REQUIRED SETTINGS:
1. Driver base rates
2. Worker rates per work type
3. Expense categories (business, own_farm, home)
4. Worker work types available
5. Machine types
6. Seasons configuration
```

**Deliverable:** Settings API with all required configs

---

### Task 1.3: Database Indexes & Performance

**File: `backend/utils/createIndexes.js`** (Update/expand)
```
CREATE INDEXES (critical for performance):

Drivers:
- db.drivers.createIndex({ phone: 1 }, { unique: true })
- db.drivers.createIndex({ village: 1 })
- db.drivers.createIndex({ active: 1 })

DriverLogs:
- db.driver_logs.createIndex({ driver_id: 1, date: -1 })
- db.driver_logs.createIndex({ date: 1 })

Workers:
- db.workers.createIndex({ village: 1 })
- db.workers.createIndex({ active: 1 })

WorkerRecords:
- db.worker_records.createIndex({ worker_id: 1, date: -1 })
- db.worker_records.createIndex({ work_type: 1 })

Expenses:
- db.expenses.createIndex({ type: 1, date: -1 })
- db.expenses.createIndex({ category: 1 })
- db.expenses.createIndex({ createdBy: 1 })

HarvesterJobs:
- db.harvester_jobs.createIndex({ farmer_id: 1 })
- db.harvester_jobs.createIndex({ status: 1 })

Finance:
- db.finance_records.createIndex({ farmer_id: 1, dueDate: 1 })
- db.finance_records.createIndex({ status: 1 })

OwnFarmIncome:
- db.own_farm_income.createIndex({ type: 1, date: -1 })
```

**Deliverable:** All indexes created, query performance verified

---

### Task 1.4: API Testing & Documentation

**File: `backend/__tests__/api/drivers.test.js`** (Create new)
```
TEST CASES (must pass):

1. Create Driver
   - Valid data: should create
   - Missing name: should reject
   - Duplicate phone: should reject
   - PIN hashing: should be hashed, not plaintext

2. List Drivers
   - Default pagination works (page 1, limit 20)
   - Filtering by village works
   - Filtering by active status works
   - Returns proper pagination metadata

3. Update Driver
   - Can update baseRate
   - Cannot duplicate phone
   - Timestamp updates
   - Cannot update to empty name

4. Delete Driver
   - Soft delete (isDeleted flag)
   - Still visible to admin with filter
   - Hidden from normal queries

5. Change PIN
   - Admin can change PIN
   - PIN gets hashed
   - User cannot change own PIN (security)
   - Returns success response
```

**Deliverable:** All tests passing, >90% code coverage

---

**File: `BACKEND_APIS.md`** (Create documentation)
```
Document format:
- Each endpoint with method, path, description
- Required authentication
- Request body example
- Response example (success & error)
- Validation rules
- Error codes possible

Generate from comments in code automatically if possible
Or manually create comprehensive API documentation
```

**Deliverable:** Complete API documentation

---

### PHASE 1 COMPLETION CHECKLIST

- [ ] All 10 models created with validation
- [ ] All 35+ API endpoints implemented
- [ ] All endpoints tested and working
- [ ] Database indexes created and optimized
- [ ] Standard response format implemented
- [ ] Error handling comprehensive
- [ ] API documentation complete
- [ ] Postman collection exported
- [ ] Tests passing (>85% coverage)
- [ ] No console errors or warnings
- [ ] Proper logging in place
- [ ] Performance benchmarks acceptable

**Phase 1 Completion**: Report exact status, any blockers, expected resolution time

---

## PHASE 2: FRONTEND SERVICE LAYER
### Duration: Week 3
### Objective: Replace localStorage with API abstraction, add Socket.io

---

## PHASE 2 EXECUTION INSTRUCTIONS

### Task 2.1: Create Service Layer Abstraction

**File: `frontend/src/services/api.js`** (Create new, ~200 LOC)
```
CLASS: APIService

REQUIREMENTS:
- Base URL from env var REACT_APP_API_URL
- Authentication token management
- Request/response standardization
- Error handling with fallback to offline cache
- Caching strategy (optional)

METHODS (must implement):
- request(endpoint, options) - base method
- getDrivers(page, limit, filters)
- createDriver(data)
- updateDriver(id, data)
- deleteDriver(id)
- ... similar for workers, expenses, harvester, finance, etc.

ERROR HANDLING:
- Network error → fallback to offline cache
- API error (4xx, 5xx) → throw with error code
- Auth error (401) → redirect to login
- Rate limit (429) → implement exponential backoff

CACHING:
- Keep last response in memory
- Update cache after successful mutations
- Use cache as fallback if network fails
```

**Testing:**
```javascript
// Must pass:
1. Can fetch drivers list
2. Can create driver (POST)
3. Can update driver (PUT)
4. Can delete driver (DELETE)
5. Network error falls back to cache
6. Response format verified
7. Pagination working
8. Filters working
```

**Deliverable:** APIService fully functional and tested

---

**File: `frontend/src/services/socketService.js`** (Create new, ~150 LOC)
```
CLASS: SocketService

REQUIREMENTS:
- Connect to backend Socket.io on init
- Authenticate via session
- Reconnection logic (exponential backoff)
- Event subscription/unsubscription
- Event emission

METHODS (must implement):
- connect()
- disconnect()
- subscribe(event, callback)
- unsubscribe(event, callback)
- emit(event, data)
- isConnected() - boolean

RECONNECTION STRATEGY:
- First reconnect: 1 second
- Second: 2 seconds
- Third: 4 seconds
- Maximum: 10 seconds
- Max attempts: 5 (then offline mode)

OFFLINE DETECTION:
- Emit 'connection:offline' when disconnect
- Emit 'connection:online' when reconnect
- Queue events while offline

EVENT CATEGORIES (must support):
- Entity events: driver:created, driver:updated, driver:deleted, etc.
- Transaction events: payment:recorded, advance:given, etc.
- Real-time events: activity:new, report:ready, etc.
```

**Testing:**
```javascript
// Must pass:
1. Can connect to Socket.io
2. Can subscribe to event
3. Can emit event
4. Reconnection works
5. Queue works while offline
6. Unsubscribe works
```

**Deliverable:** SocketService fully functional

---

### Task 2.2: Create Custom Hooks

**File: `frontend/src/hooks/useAPI.js`** (Create new, ~60 LOC)
```
HOOK: useAPI(endpoint, options)

RETURNS: {data, loading, error}

REQUIREMENTS:
- Fetch data on mount
- Handle loading state
- Handle error state
- Fallback to offline cache on error
- Re-fetch on endpoint change

USAGE:
const { data: drivers, loading, error } = useAPI('/api/drivers');

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;
return <list items={data} />;
```

**Deliverable:** Hook working with all use cases

---

**File: `frontend/src/hooks/useRealTime.js`** (Create new, ~40 LOC)
```
HOOK: useRealTime(event, initialData)

RETURNS: data

REQUIREMENTS:
- Subscribe to Socket.io event on mount
- Update state when event fires
- Unsubscribe on unmount
- Handle initial data

USAGE:
const newDrivers = useRealTime('driver:created', []);

// Automatically updates when new drivers created
```

**Deliverable:** Hook working for live updates

---

**File: `frontend/src/hooks/useOfflineMode.js`** (Create new, ~50 LOC)
```
HOOK: useOfflineMode()

RETURNS: {isOnline, queue, syncStatus}

REQUIREMENTS:
- Detect online/offline status
- Manage offline change queue
- Provide sync mechanism
- Track sync progress

USAGE:
const { isOnline, syncStatus } = useOfflineMode();

if (!isOnline) {
  return <div>Offline - changes queued</div>;
}
```

**Deliverable:** Hook managing offline state

---

### Task 2.3: Create Context & State Management

**File: `frontend/src/context/DataContext.jsx`** (Create new, ~80 LOC)
```
CONTEXT: DataContext

PROVIDES (via useContext):
- drivers: [] 
- setDrivers: function
- workers: []
- setWorkers: function
- expenses: []
- setExpenses: function
- harvesterJobs: []
- setHarvesterJobs: function
- ... all entity types

WRAPPED BY: DataProvider component

USAGE IN COMPONENTS:
const { drivers, setDrivers } = useContext(DataContext);

INITIALIZATION:
- Fetch all data on provider mount
- Subscribe to Socket.io events
- Update context when events fire
```

**Deliverable:** Context fully functional across app

---

### Task 2.4: Refactor Dashboard

**File: `frontend/src/pages/Dashboard.jsx`** (Refactor, ~100 LOC)
```
REQUIREMENTS:
- Remove localStorage initialization
- Use APIService to fetch data
- Use DataContext for shared state
- Implement Socket.io listeners for real-time updates
- Show connection status
- Show sync status if offline

METRICS TO SHOW:
- Total drivers
- Total pending payments
- Total expenses (this month)
- Active jobs

REAL-TIME:
- Update when new driver added
- Update when payment recorded
- Update totals every 30 seconds from backend

OFFLINE MODE:
- Show cached data
- Show "Offline" indicator
- Queue manual refresh
```

**Testing:**
```javascript
// Must pass:
1. Dashboard loads from API
2. Metrics calculate correctly
3. Real-time updates on driver:created
4. Offline shows cached data with indicator
5. Reconnect syncs and updates
```

**Deliverable:** Dashboard fully integrated

---

### Task 2.5: Remove LocalStorage from App.jsx

**File: `frontend/src/App.jsx`** (Refactor, ~120 LOC)
```
CHANGES:
- Remove localStorage.getItem('su_session')
- Remove localStorage.setItem during init
- Remove initialFarmers, initialDrivers seeding
- Add DataProvider wrapper
- Add ErrorBoundary wrapper
- Add Socket.io connection on login
- Add offline indicator to header
- Add sync status to header (if offline)

HEADER ADDITIONS:
- Connection status dot (green/red)
- "Syncing..." indicator if offline with queue
- Number of queued changes

AUTH FLOW:
- Login API call (no localStorage password)
- Store session in context + memory
- Logout clears session and disconnects
```

**Deliverable:** App.jsx working with new architecture

---

### PHASE 2 COMPLETION CHECKLIST

- [ ] APIService created and tested
- [ ] SocketService created and tested
- [ ] useAPI hook working
- [ ] useRealTime hook working
- [ ] useOfflineMode hook working
- [ ] DataContext implemented
- [ ] Dashboard fully refactored
- [ ] App.jsx updated
- [ ] localStorage removed from initialization
- [ ] Socket.io connected and listening
- [ ] Offline mode working
- [ ] Real-time updates visible
- [ ] No regressions in existing features
- [ ] All tests passing
- [ ] Manual QA passed on all pages

**Phase 2 Completion:** Report status, any issues, readiness for Phase 3

---

## CRITICAL WARNINGS DURING EXECUTION

### ⚠️ STOP & VERIFY BEFORE PROCEEDING

**After Phase 1:**
- [ ] Verify EVERY endpoint works in Postman
- [ ] Verify database integrity (no data loss)
- [ ] Verify calculations are correct (salary, expenses, income)
- [ ] Verify error responses match specification
- [ ] Verify rate limiting is in place
- [ ] Verify authentication working

**After Phase 2:**
- [ ] Verify Dashboard loads without errors
- [ ] Verify Socket.io connected (check browser console)
- [ ] Verify real-time updates working (add a driver, see instant update)
- [ ] Verify offline mode queues changes
- [ ] Verify no localStorage references except cache
- [ ] Verify error boundaries catching errors

**If ANY verification fails:**
- DO NOT PROCEED to next phase
- Debug thoroughly
- Fix root cause
- Re-test everything
- Report blocker

---

## EXECUTION REPORTING

**After Each Task:**
```
TASK: [Task Name]
STATUS: [COMPLETE / IN PROGRESS / BLOCKED]
FILES MODIFIED: [list]
FILES CREATED: [list]
TESTS PASSING: [Yes/No]
KNOWN ISSUES: [if any]
ESTIMATED TIME TO NEXT TASK: [hours]
```

**After Each Phase:**
```
PHASE [X] COMPLETION REPORT
===============================
DURATION: [actual time vs estimated]
DELIVERABLES COMPLETED: [checklist]
TESTS PASSING: [% coverage]
REGRESSIONS FOUND: [if any, with fixes]
BLOCKERS ENCOUNTERED: [if any, with resolutions]
READINESS FOR PHASE [X+1]: [YES/NO]
CONFIDENCE LEVEL: [HIGH/MEDIUM/LOW]
NEXT PHASE START: [date/time]
```

---

## EXECUTION SAFETY GATES

### Gate 1: After Phase 1
**Requirement:** All backend APIs working, tested, documented
**Approval:** Manual testing via Postman, code review
**Proceed to Phase 2?** [YES / BLOCKED]

### Gate 2: After Phase 2
**Requirement:** Frontend services working, first page refactored
**Approval:** Dashboard loads, real-time works, offline works
**Proceed to Phase 3?** [YES / BLOCKED]

### Gate 3: After Phase 3
**Requirement:** All modules migrated to APIs
**Approval:** Full feature parity with localStorage version
**Proceed to Phase 4?** [YES / BLOCKED]

### Gate 4: After Phase 4
**Requirement:** All new features implemented
**Approval:** Reports, PDFs, settings working
**Proceed to Phase 5?** [YES / BLOCKED]

### Gate 5: After Phase 5
**Requirement:** Production-ready
**Approval:** Security, performance, testing complete
**Deploy to Production?** [YES / BLOCKED]

---

## PRODUCTION CONSTRAINTS

### You MUST NOT:
- ❌ Deploy code with console.errors
- ❌ Commit commented-out code
- ❌ Use hardcoded values (all configurable)
- ❌ Skip error handling (all paths covered)
- ❌ Leave TODO comments (complete the work)
- ❌ Commit without tests passing
- ❌ Deploy without data backup
- ❌ Change API response format without migration
- ❌ Break existing features
- ❌ Deploy without update verification

### You MUST:
- ✅ Write tests for all logic
- ✅ Document all APIs
- ✅ Handle all error cases
- ✅ Test on mobile devices
- ✅ Verify Tamil text rendering
- ✅ Log important operations
- ✅ Implement error recovery
- ✅ Cache strategically
- ✅ Optimize performance
- ✅ Verify calculations are correct

---

## FINAL EXECUTION CHECKLIST

**Before Starting:**
- [ ] Read full V5 Architecture document
- [ ] Understand current system state
- [ ] Understand target state
- [ ] Setup development environment
- [ ] Database backups created
- [ ] Git repository ready
- [ ] Testing infrastructure ready
- [ ] Monitoring ready

**During Execution:**
- [ ] Commit after each task completion
- [ ] Report status after each phase
- [ ] Verify tests passing continuously
- [ ] Keep documentation updated
- [ ] Communicate blockers immediately
- [ ] Follow safety gates strictly
- [ ] Maintain backward compatibility

**At Completion:**
- [ ] All phases done
- [ ] All tests passing
- [ ] All documentation complete
- [ ] Data migration verified
- [ ] Performance verified
- [ ] Security verified
- [ ] Production ready
- [ ] Team trained

---

## SUCCESS DEFINITION

V5 is complete when:
1. ✅ All 35+ APIs implemented and tested
2. ✅ 100% of frontend modules using APIs
3. ✅ Real-time synchronization working
4. ✅ All PDFs generating correctly
5. ✅ All calculations verified correct
6. ✅ Zero localStorage dependencies
7. ✅ Offline/online transitions smooth
8. ✅ Mobile responsive and tested
9. ✅ Tamil localization complete
10. ✅ Production monitoring in place
11. ✅ Team trained and confident
12. ✅ Zero regressions from V4

---

**EXECUTION AUTHORIZED**

Date: [Current Date]  
Authorized by: [Approver]  
Timeline: 9 weeks  
Budget: [As allocated]  
Resource: 2 Engineers + 1 QA  

**Proceed with Phase 1 immediately upon approval.**

---

END OF ANTIGRAVITY EXECUTION PROMPT

