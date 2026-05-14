# SmartUzhavan V6 - Daily Execution Checklist

**Status:** 50% Complete | Phases 1-3 Done | Phases 4-6 Remaining  
**Current Date:** May 14, 2026  
**Target Completion:** May 24, 2026 (10 days)

---

## TODAY'S FOCUS: Route Standardization

### ⏰ TIME ALLOCATION

- **Phase 4 (Routes):** 2-3 days
- **Phase 5 (Frontend):** 2-3 days  
- **Phase 6 (Data Migration):** 1-2 days (optional)
- **Testing & Validation:** 2-3 days

---

## PHASE 4 DAILY TASKS (Days 1-3)

### DAY 1: Expenses Route

**What to do:**
1. Open `/backend/src/routes/expenses.js`
2. Replace entire content with code from V6_COMPLETION_ROADMAP.md (Section 4.1)
3. Verify Expense model has these fields:
   - `userId` (required, references User)
   - `category` (string)
   - `amount` (number)
   - `description` (string)
   - `date` (date)
   - `createdAt`, `updatedAt`

**Test it:**
```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Test with curl
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "category": "seeds",
    "amount": 500,
    "description": "Bought premium seeds",
    "date": "2026-05-14"
  }'
```

**Expected Response (SUCCESS):**
```json
{
  "status": "success",
  "code": 201,
  "data": {
    "_id": "...",
    "userId": "...",
    "category": "seeds",
    "amount": 500,
    "description": "Bought premium seeds",
    "date": "2026-05-14T00:00:00Z",
    "createdAt": "2026-05-14T10:30:00Z",
    "updatedAt": "2026-05-14T10:30:00Z"
  },
  "message": "Expense created successfully",
  "timestamp": "2026-05-14T10:30:00Z"
}
```

**Checklist:**
- [ ] Code replaced
- [ ] Model fields verified
- [ ] POST /api/expenses works
- [ ] GET /api/expenses works
- [ ] GET /api/expenses/:id works
- [ ] PUT /api/expenses/:id works
- [ ] DELETE /api/expenses/:id works
- [ ] Error response is JSend format
- [ ] 404 returns JSend format
- [ ] 400 (validation) returns JSend format

---

### DAY 2: Reports Route

**What to do:**
1. Open `/backend/src/routes/reports.js`
2. Replace entire content with code from V6_COMPLETION_ROADMAP.md (Section 4.2)
3. Verify Report model has these fields:
   - `userId` (required, references User)
   - `type` (string: 'harvest', 'expense', 'income', 'summary')
   - `period` (string)
   - `data` (object, contains report calculations)
   - `startDate`, `endDate`
   - `generatedAt`, `createdAt`, `updatedAt`

**Test it:**
```bash
# Create a report
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "expense",
    "period": "monthly",
    "startDate": "2026-05-01",
    "endDate": "2026-05-31"
  }'

# List reports
curl -X GET http://localhost:5000/api/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get report details
curl -X GET http://localhost:5000/api/reports/REPORT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Report Data Structure:**
```json
{
  "status": "success",
  "code": 201,
  "data": {
    "_id": "...",
    "userId": "...",
    "type": "expense",
    "period": "monthly",
    "data": {
      "totalExpenses": 15,
      "totalAmount": 8500,
      "averageAmount": "566.67",
      "byCategory": {
        "seeds": [...],
        "fertilizer": [...],
        "labor": [...]
      }
    },
    "startDate": "2026-05-01T00:00:00Z",
    "endDate": "2026-05-31T23:59:59Z",
    "generatedAt": "2026-05-14T10:30:00Z"
  },
  "message": "Report generated successfully",
  "timestamp": "2026-05-14T10:30:00Z"
}
```

**Checklist:**
- [ ] Code replaced
- [ ] Model fields verified
- [ ] POST /api/reports works
- [ ] GET /api/reports works (list all)
- [ ] GET /api/reports?type=expense works (filter)
- [ ] GET /api/reports/:id works
- [ ] Report calculations are correct
- [ ] Helper functions work (harvest, expense, summary)
- [ ] Date range filtering works
- [ ] Error handling is JSend format

---

### DAY 3: Finance Route

**What to do:**
1. Open `/backend/src/routes/finance.js`
2. Replace entire content with code from V6_COMPLETION_ROADMAP.md (Section 4.3)
3. Verify Finance model has these fields:
   - `userId` (required, references User)
   - `type` (string: 'income', 'expense', 'loan', 'investment')
   - `amount` (number)
   - `description` (string)
   - `category` (string)
   - `date` (date)
   - `createdAt`, `updatedAt`

**Test it:**
```bash
# Get financial summary
curl -X GET http://localhost:5000/api/finance/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Record a transaction
curl -X POST http://localhost:5000/api/finance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "income",
    "amount": 50000,
    "description": "Sold vegetables at market",
    "category": "harvest-sales",
    "date": "2026-05-14"
  }'

# Get all transactions
curl -X GET http://localhost:5000/api/finance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Summary Response:**
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "totalIncome": 150000,
    "totalExpense": 45000,
    "netProfit": 105000,
    "totalHarvest": 2500,
    "profitMargin": 70,
    "lastUpdated": "2026-05-14T10:30:00Z"
  },
  "message": "Financial summary retrieved",
  "timestamp": "2026-05-14T10:30:00Z"
}
```

**Checklist:**
- [ ] Code replaced
- [ ] Model fields verified
- [ ] GET /api/finance/summary works
- [ ] POST /api/finance works
- [ ] GET /api/finance works (list all)
- [ ] GET /api/finance/:id works
- [ ] PUT /api/finance/:id works
- [ ] DELETE /api/finance/:id works
- [ ] Calculations (totalIncome, netProfit) are correct
- [ ] Error handling is JSend format

---

## PHASE 5 DAILY TASKS (Days 4-6)

### DAY 4: Update Login Component

**What to do:**
1. Open `/frontend/src/pages/Login.jsx`
2. Replace with code from V6_COMPLETION_ROADMAP.md (Section 5.1)
3. Update error handling to catch new error structure
4. Verify these fields work:
   - email (text input)
   - password (password input)
   - error message display
   - loading state

**Test it:**
```
1. Open http://localhost:5173/login in browser
2. Try logging in with invalid email
3. Verify error message displays: "Invalid email or password"
4. Try logging in with correct credentials
5. Verify redirect to dashboard (based on user.role)
6. Check localStorage has 'authToken' and 'user'
```

**Checklist:**
- [ ] Component renders
- [ ] Form inputs work
- [ ] Error messages display
- [ ] Loading state shows
- [ ] Successful login stores token
- [ ] Successful login stores user
- [ ] Redirect works based on role
- [ ] ADMIN → /admin-dashboard
- [ ] DRIVER → /driver-dashboard
- [ ] FARMER → /farmer-dashboard

---

### DAY 5: Update Signup Component

**What to do:**
1. Open `/frontend/src/pages/Signup.jsx`
2. Replace with code from V6_COMPLETION_ROADMAP.md (Section 5.2)
3. Verify role-specific fields appear:
   - DRIVER role → show "Driver License" field
   - FARMER role → show "Farm Size" field
   - USER role → hide those fields

**Test it:**
```
1. Navigate to http://localhost:5173/signup
2. Fill in basic fields (name, email, phone, password)
3. Select "Driver" role
4. Verify "Driver License" field appears
5. Fill it and submit
6. Verify redirect to /driver-dashboard
7. Go back, try "Farmer" role
8. Verify "Farm Size" field appears
9. Fill it and submit
10. Verify redirect to /farmer-dashboard
```

**Checklist:**
- [ ] Form renders
- [ ] All basic fields work (name, email, phone, password)
- [ ] Role select works
- [ ] Driver fields show/hide correctly
- [ ] Farmer fields show/hide correctly
- [ ] Password validation works (min 8 chars)
- [ ] Password confirmation validation works
- [ ] Phone validation works (10 digits)
- [ ] Signup creates user
- [ ] Token is stored
- [ ] Redirect works

---

### DAY 6: Test Full Auth Flow

**What to do:**
1. Update apiService.js with code from V6_COMPLETION_ROADMAP.md (Section 5.3)
2. Create ProtectedRoute.jsx component (code provided)
3. Wrap all dashboard routes with ProtectedRoute
4. Test complete flow

**Test it:**
```
1. Clear localStorage (DevTools > Application > Local Storage > Clear All)
2. Navigate to http://localhost:5173/login
3. Try to access /farmer-dashboard without logging in
4. Verify redirect to /login
5. Log in as farmer
6. Verify redirect to /farmer-dashboard
7. Page loads without error
8. Token in localStorage
9. Close browser, reopen
10. Navigate to /farmer-dashboard
11. Should load (token persists)
12. Log out
13. Verify redirect to /login
14. Try /farmer-dashboard again
15. Should redirect to /login
```

**Checklist:**
- [ ] ProtectedRoute component created
- [ ] All routes wrapped with ProtectedRoute
- [ ] Redirects work without login
- [ ] Dashboard loads after login
- [ ] Token persists across page reload
- [ ] Logout clears token
- [ ] 401 from API redirects to login
- [ ] No "map is not a function" errors
- [ ] Console has no errors

---

## PHASE 6 OPTIONAL TASKS (Days 7-8)

### DAY 7: Prepare Data Migration

**Only if you have existing Driver/Farmer data**

**What to do:**
1. Create `/backend/scripts/migrateDrivers.js`
2. Copy code from V6_COMPLETION_ROADMAP.md (Section 6.1)
3. Create backup first

**Test migration:**
```bash
# Create backup
mongodump --uri="mongodb+srv://user:pass@cluster/smartuzhavan" \
  --out=./backup_$(date +%Y%m%d)

# Run migration script
node backend/scripts/migrateDrivers.js

# Verify in MongoDB Compass
# Check User collection for migrated drivers
# Verify roleData is populated
# Check all fields are there
```

**Checklist:**
- [ ] Backup created
- [ ] Script runs without errors
- [ ] All drivers migrated
- [ ] No data loss
- [ ] roleData populated correctly
- [ ] Email/phone unique constraints respected

---

## PHASE 7: COMPREHENSIVE TESTING (Days 9-10)

### Test Matrix

```
ROUTE           METHOD  ENDPOINT                      AUTH    EXPECTED
────────────────────────────────────────────────────────────────────────
Auth            POST    /api/auth/signup              NO      201 + token
Auth            POST    /api/auth/login               NO      200 + token
Auth            POST    /api/auth/logout              YES     200
Auth            GET     /api/auth/me                  YES     200 + user
────────────────────────────────────────────────────────────────────────
Expenses        GET     /api/expenses                 YES     200 + array
Expenses        POST    /api/expenses                 YES     201
Expenses        GET     /api/expenses/:id             YES     200
Expenses        PUT     /api/expenses/:id             YES     200
Expenses        DELETE  /api/expenses/:id             YES     200
────────────────────────────────────────────────────────────────────────
Reports         GET     /api/reports                  YES     200 + array
Reports         POST    /api/reports                  YES     201
Reports         GET     /api/reports/:id              YES     200
────────────────────────────────────────────────────────────────────────
Finance         GET     /api/finance/summary          YES     200 + summary
Finance         GET     /api/finance                  YES     200 + array
Finance         POST    /api/finance                  YES     201
Finance         GET     /api/finance/:id              YES     200
Finance         PUT     /api/finance/:id              YES     200
Finance         DELETE  /api/finance/:id              YES     200
```

### Response Format Verification

Every endpoint must return:
```json
{
  "status": "success|fail|error",
  "code": 200-500,
  "data": {...},
  "message": "string",
  "timestamp": "ISO-8601"
}
```

### Error Response Examples

**Validation Error (400):**
```json
{
  "status": "fail",
  "code": 400,
  "data": {"amount": "must be positive"},
  "message": "Invalid amount",
  "timestamp": "..."
}
```

**Not Found (404):**
```json
{
  "status": "error",
  "code": 404,
  "data": null,
  "message": "Expense not found",
  "timestamp": "..."
}
```

**Unauthorized (401):**
```json
{
  "status": "error",
  "code": 401,
  "data": null,
  "message": "Invalid or expired token",
  "timestamp": "..."
}
```

### Postman Test Steps

1. Create collection "SmartUzhavan V6"
2. Add these requests:
   - POST /auth/signup
   - POST /auth/login
   - GET /auth/me
   - POST /expenses
   - GET /expenses
   - GET /expenses/:id
   - PUT /expenses/:id
   - DELETE /expenses/:id
   - POST /reports
   - GET /finance/summary

3. For each request:
   - [ ] Set correct method
   - [ ] Set correct headers (Content-Type, Authorization)
   - [ ] Send valid test data
   - [ ] Verify response is JSend format
   - [ ] Verify status code is correct
   - [ ] Verify error handling works

---

## KNOWN ISSUES & QUICK FIXES

### Issue: "Cannot read property 'data' of undefined"

**Cause:** apiService interceptor not unwrapping JSend

**Fix:**
```javascript
// In apiService.js response interceptor
if (data.status === 'success') {
  return data.data; // ← Make sure this returns just the data, not wrapped
}
```

### Issue: "Token not sent in Authorization header"

**Cause:** localStorage token not being added

**Fix:**
```javascript
// In apiService.js request interceptor
const token = localStorage.getItem('authToken');
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

### Issue: "CORS error from Vercel"

**Cause:** Backend CORS not configured for Vercel domain

**Fix:** In server.js:
```javascript
const allowedOrigins = [
  'http://localhost:5173', // dev
  'https://smartuzhavan.vercel.app', // production
];
```

### Issue: "map is not a function" in React component

**Cause:** Component expects array but gets object

**Fix:** In component:
```javascript
// Wrong:
const expenses = response; // might be object
expenses.map(...) // Error!

// Right:
const expenses = Array.isArray(response) ? response : [];
expenses.map(...)
```

---

## SUCCESS CRITERIA

### ✅ Must Have (Day 10)

- [ ] All 3 routes (expenses, reports, finance) return JSend
- [ ] Login/Signup work with new payload format
- [ ] All CRUD operations work
- [ ] Error responses are JSend formatted
- [ ] Token auth works (Authorization header)
- [ ] Expired token redirects to login
- [ ] Frontend apiService unwraps JSend
- [ ] ProtectedRoute component blocks unauthorized access
- [ ] Zero "map is not a function" errors
- [ ] All Postman tests pass

### 🎯 Should Have (Optional)

- [ ] Data migration completed (if applicable)
- [ ] Unit tests for new routes
- [ ] Integration tests for auth flow
- [ ] E2E tests in Cypress/Playwright
- [ ] API documentation updated
- [ ] README updated with V6 info

### 🚀 Nice To Have

- [ ] Response time < 200ms
- [ ] Test coverage > 80%
- [ ] Monitoring/error tracking setup
- [ ] CI/CD pipeline working

---

## DAILY STANDUP TEMPLATE

Use this each morning:

```
🟢 COMPLETED (Yesterday)
- [ ] Expense route standardized
- [ ] All endpoints tested
- [ ] Postman collection created

🟡 IN PROGRESS (Today)
- [ ] Reports route migration
- [ ] Testing error cases

🔴 BLOCKED
- None

📊 PROGRESS: 60% (Phase 4 of 6)

⏱️ TIMELINE
- Phase 4 (Routes): Today ✓
- Phase 5 (Frontend): Tomorrow-Day After
- Phase 6 (Data): Optional
- Testing: 2 days
- **Completion: May 24** (10 days)
```

---

## QUICK REFERENCE LINKS

- **Main Plan:** V6_Architecture_Restructure_Plan.md
- **Completion Guide:** V6_COMPLETION_ROADMAP.md (this file)
- **Code Examples:** All provided in ROADMAP above

---

## 🚀 YOU'RE READY!

**Current momentum is excellent.** Follow this daily checklist and V6 will be complete in 10 days.

**Next action:** Copy expenses.js code and start today.

Good luck! 💪
