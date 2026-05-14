# Antigravity Agent Safety Guardrails & Error Prevention

**Purpose:** Prevent agent from breaking code with unnecessary changes  
**Status:** Before any implementation starts  
**Enforcement:** Strict - agent must verify against this list before ANY code modification

---

## 🚨 RED FLAGS - Stop Agent Immediately If You See

| Red Flag | Action | Reason |
|----------|--------|--------|
| Agent wants to "refactor" components | STOP - Revert | Refactoring breaks backward compatibility |
| Agent wants to "improve" styling | STOP - Revert | CSS changes can break UI |
| Agent wants to reorganize folders | STOP - Revert | Folder structure changes break imports |
| Agent wants to rewrite auth logic | STOP - Revert | Auth changes break login flow |
| Agent wants to use new libraries | STOP - Revert | New dependencies break version compatibility |
| Agent says "this code is old" | STOP - Revert | Old code works, leave it alone |
| Agent makes multiple changes at once | STOP - Revert | Cannot test if multiple changes batched |
| Agent removes files without asking | STOP - Revert | Could break imports in other files |
| Agent changes API endpoints | STOP - Revert | Frontend calls specific endpoints |
| Agent modifies response format | STOP - Revert | Frontend expects specific format |

---

## ✅ GREEN FLAGS - These Changes Are Safe

| Safe Change | Why It's OK |
|-------------|-----------|
| Adding new endpoint to backend | Frontend can ignore if not used |
| Adding new field to response | Frontend can ignore extra fields |
| Adding logging/debugging | Doesn't affect functionality |
| Adding comments to code | Improves readability only |
| Adding validation | Makes code safer |
| Adding error handling | Prevents crashes |
| Adding new file (if not used) | Can be safely removed if not needed |
| Changing backend only | Frontend not affected |
| Adding middleware | As long as it doesn't break requests |

---

## CODE MODIFICATION VERIFICATION CHECKLIST

**Before agent changes ANY code, verify:**

### 1. Necessity Check
```
[ ] Is this change necessary to make the project work?
    YES → continue to next check
    NO → DO NOT MAKE CHANGE
    
[ ] Does this change make something work that is currently broken?
    YES → continue to next check
    NO → DO NOT MAKE CHANGE
```

### 2. Impact Analysis
```
[ ] Will this change break any existing functionality?
    YES → DO NOT MAKE CHANGE
    NO → continue to next check
    
[ ] Will this change require changes in other files?
    YES → list all files that need changes before proceeding
    NO → continue to next check
    
[ ] Will this change require changes in other parts of the codebase?
    YES → list all components/services that need changes
    NO → continue to next check
```

### 3. Testing Plan
```
[ ] Can this change be tested independently?
    YES → continue to next check
    NO → DO NOT MAKE CHANGE
    
[ ] Do we have a way to verify this change works?
    YES → continue to next check
    NO → DO NOT MAKE CHANGE
    
[ ] Can we revert this change if it breaks something?
    YES → continue to next check
    NO → DO NOT MAKE CHANGE
```

### 4. Backward Compatibility
```
[ ] Will this change break old code that depends on it?
    NO → continue to next check
    YES → DO NOT MAKE CHANGE
    
[ ] Will this change require updating client code?
    NO → continue to next check
    YES → list all files that must be updated
```

### 5. Code Quality
```
[ ] Is this change following existing code patterns?
    YES → continue to next check
    NO → DO NOT MAKE CHANGE (use same patterns)
    
[ ] Is this change using existing libraries/dependencies?
    YES → continue to next check
    NO → DO NOT ADD NEW DEPENDENCY
    
[ ] Is this change minimal and surgical?
    YES → continue to next check
    NO → DO NOT MAKE CHANGE (break it into smaller pieces)
```

### 6. Final Approval
```
[ ] User has explicitly approved this specific change
    YES → PROCEED WITH CHANGE
    NO → WAIT FOR APPROVAL
```

---

## FILE PROTECTION LIST

**These files must NEVER be modified without explicit approval:**

### Frontend (DO NOT TOUCH)
```
✓ PROTECTED: /frontend/src/components/*.jsx
  Reason: User interface logic - breaking changes are catastrophic
  
✓ PROTECTED: /frontend/src/pages/*.jsx
  Reason: Page routing and layout - changes can break navigation
  
✓ PROTECTED: /frontend/src/styles/*.css
  Reason: Visual styling - changes can break UI
  
✓ PROTECTED: /frontend/package.json
  Reason: Dependencies - version changes can break build
  
✓ PROTECTED: /frontend/public/index.html
  Reason: Entry point - changes can prevent app from loading
```

### Backend (HANDLE WITH CARE)
```
⚠ CAREFUL: /backend/src/routes/auth.js
  Why: Authentication is critical - changes can lock users out
  Allowed: Adding routes, adding validation, improving error handling
  Forbidden: Changing request format, changing response format, changing token handling
  
⚠ CAREFUL: /backend/src/models/User.js
  Why: Database schema - changes can cause data loss
  Allowed: Adding optional fields with defaults, adding validation
  Forbidden: Removing fields, changing field types, removing indexes
  
✓ SAFE: /backend/src/routes/expenses.js
  Allowed: Any changes (non-critical route)
  
✓ SAFE: /backend/src/routes/reports.js
  Allowed: Any changes (non-critical route)
```

### PDF Server (UNTOUCHABLE)
```
✓ PROTECTED: /server/*.*
  Reason: Separate service - changes can break PDF generation
  Action: DO NOT MODIFY
```

---

## COMMON MISTAKES TO PREVENT

### Mistake #1: Changing API Response Format

```javascript
// ❌ WRONG - Agent changed response format
app.get('/api/expenses', (req, res) => {
  const expenses = await Expense.find();
  res.json(expenses); // Changed from res.success(expenses)
});

// Problem: Frontend expects JSend format {status, data, ...}
// Result: "Cannot read property 'data'" error in console

// ✅ RIGHT - Keep original response format
app.get('/api/expenses', (req, res) => {
  const expenses = await Expense.find();
  res.success(expenses); // Use res.success()
});
```

### Mistake #2: Changing Authentication Logic

```javascript
// ❌ WRONG - Agent "improved" auth
// Removed old token handling, replaced with new system
// Problem: Frontend can't login anymore

// ✅ RIGHT - Keep auth logic, add to it
// Old code: Login returns {user, token}
// New code: Login returns {user, token, expiresIn}
// Compatible: Frontend still gets user and token
```

### Mistake #3: Moving Files/Folders

```javascript
// ❌ WRONG - Agent reorganized for "cleaner" structure
// Changed: src/services/api.js → src/api/apiClient.js
// Problem: All imports break
// Import errors: Cannot find module '../services/api'

// ✅ RIGHT - Leave folder structure alone
// Keep: src/services/api.js
// If you want new structure, create parallel and migrate slowly
```

### Mistake #4: Adding Required Field Without Default

```javascript
// ❌ WRONG - Agent added new field without considering existing data
User.findByIdAndUpdate(id, {role: 'ADMIN'}, {runValidators: true})
// If schema has new required field with no default, update fails

// ✅ RIGHT - Add optional field with default value
role: {
  type: String,
  enum: ['USER', 'ADMIN', 'DRIVER', 'FARMER'],
  default: 'USER' // ← Always provide default
}
```

### Mistake #5: Batch Changes Without Testing

```
❌ WRONG:
1. Change 5 files
2. Change api.js
3. Change Login.jsx
4. Change backend routes
5. Test - EVERYTHING BROKEN - Which change caused it?

✅ RIGHT:
1. Change 1 file
2. Test - Does it work?
3. If YES, commit and move to next
4. If NO, debug and revert
5. Repeat for next file
```

---

## VERIFICATION SCRIPT FOR AGENT

**Before agent modifies ANY file, run this check:**

```python
CHANGE_VERIFICATION = {
    "file_path": "_____",
    "current_code": """
[Show exact current code]
    """,
    "proposed_code": """
[Show exact proposed code]
    """,
    "reason_for_change": "_____",
    
    "checks": {
        "is_necessary": "YES / NO",  # Is this change required to make something work?
        "breaks_compatibility": "YES / NO",  # Will old code break?
        "requires_other_changes": "YES / NO",  # Need to update other files?
        "has_test_plan": "YES / NO",  # Can we verify it works?
        "can_be_reverted": "YES / NO",  # Can we undo it if it breaks?
        "user_approved": "YES / NO",  # Did user explicitly approve this change?
    },
    
    "impact": {
        "files_affected": ["file1.js", "file2.js"],
        "components_affected": ["Login", "Dashboard"],
        "endpoints_affected": ["/api/auth/login", "/api/expenses"],
        "risk_level": "LOW / MEDIUM / HIGH",
    }
}

# Only proceed if ALL of these are true:
if (all checks are YES or "not applicable") and (user approved) and (risk is LOW):
    PROCEED_WITH_CHANGE()
else:
    STOP_AND_REQUEST_USER_APPROVAL()
```

---

## TESTING PROTOCOL FOR AGENT

**Every change must follow this testing protocol:**

### Step 1: Backup
```bash
# Before making ANY change
cp -r /frontend /frontend.backup  # Backup current state
cp -r /backend /backend.backup
```

### Step 2: Make Single Change
```
Edit ONE file only
Make ONE logical change only
Do NOT bundle multiple changes
```

### Step 3: Verify Syntax
```bash
# Check for syntax errors
npm run lint  # If using ESLint
npm run build # Build frontend
# Or:
npm test      # If tests exist
```

### Step 4: Run Application
```bash
# Start the application
# Terminal 1: npm start (backend)
# Terminal 2: npm start (frontend)
# Check console for errors
```

### Step 5: Test Manually
```
For backend changes:
- Use Postman to test endpoints
- Verify response format
- Check error handling

For frontend changes:
- Open browser console
- Check for JavaScript errors
- Test the specific feature that was changed
- Verify no other features broke
```

### Step 6: Verify Backward Compatibility
```
If old code uses this file:
- Test that old code still works
- Test that new code works
- Test that both work together
```

### Step 7: Commit or Revert
```bash
# If tests pass:
git add .
git commit -m "Change: [specific change]"

# If tests fail:
cp -r /frontend.backup /frontend
cp -r /backend.backup /backend
# Report error to user
```

---

## APPROVAL GATE TEMPLATE FOR AGENT

**For EVERY code change, use this template:**

```
╔════════════════════════════════════════════════════════════════╗
║              CODE CHANGE APPROVAL REQUEST                      ║
╚════════════════════════════════════════════════════════════════╝

FILE: [exact file path]
CHANGE TYPE: [add/modify/delete/refactor]

CURRENT CODE:
[Show exact current code - 5 lines before and after change]

PROPOSED CODE:
[Show exact proposed code - 5 lines before and after change]

REASON FOR CHANGE:
[Why this change is necessary]

IMPACT ANALYSIS:
✓ Backward compatible? YES / NO
✓ Requires other changes? YES / NO (if YES, list them)
✓ Breaks any functionality? YES / NO
✓ Can be tested independently? YES / NO
✓ Can be reverted if needed? YES / NO

RISK LEVEL: [LOW / MEDIUM / HIGH]

TEST PLAN:
[Steps to verify this change works]

FILES AFFECTED:
[List of all files that depend on this]

USER APPROVAL REQUIRED:
[ ] User has reviewed this change
[ ] User approves making this change
[ ] User understands the impact

PROCEED ONLY IF:
☐ All questions answered
☐ User approval obtained
☐ Risk is acceptable
```

---

## EMERGENCY REVERT PROCEDURE

**If changes break the project:**

```bash
# Step 1: Stop the application
Ctrl+C in all terminals

# Step 2: Revert to backup
cp -r /frontend.backup /frontend
cp -r /backend.backup /backend

# Step 3: Verify restored state
npm install  # Reinstall dependencies if needed
npm start    # Start again

# Step 4: Report to user
"The change broke [specific thing]. Reverted to backup.
Details: [error message, line number, etc]"
```

---

## CLEAR COMMUNICATION RULES FOR AGENT

**Agent must communicate changes like this:**

### ✅ GOOD: Clear and Specific
```
CHANGE REQUEST:
File: /backend/src/routes/expenses.js
Action: Add validation for amount field

Current line 45:
  router.post('/', async (req, res) => {

Proposed line 45-50:
  router.post('/', async (req, res) => {
    if (req.body.amount <= 0) {
      return res.fail({amount: 'must be positive'}, 'Invalid amount', 400);
    }

Reason: Prevent negative expenses from being created

Risk: LOW (validation only, doesn't affect existing data)

Testing: Try to create expense with negative amount - should fail

USER APPROVAL NEEDED: YES
```

### ❌ BAD: Vague and Risky
```
"I think the code is messy. Let me refactor everything
to be cleaner. I'll reorganize the folders, rewrite the
components, and improve the architecture. Trust me!"
```

---

## FINAL SAFETY CHECKLIST

Before agent does ANYTHING:

```
PHASE 1 ANALYSIS - Safe (Read-only)
  ✓ List files
  ✓ Read code
  ✓ Understand structure
  ✗ Do NOT modify
  
PHASE 2 VERIFICATION - Safe (Read-only)
  ✓ Check logic
  ✓ Find issues
  ✓ Report findings
  ✗ Do NOT modify
  
PHASE 3 APPROVAL - Safe (Informational)
  ✓ Create change request
  ✓ Show exact code
  ✓ Explain impact
  ✗ Wait for user approval
  
PHASE 4 IMPLEMENTATION - DANGEROUS
  ✓ Only with explicit approval
  ✓ One file at a time
  ✓ One change at a time
  ✓ Test after each change
  ✗ No batching
  ✗ No refactoring
  ✗ No reorganizing
```

---

## SUCCESS CRITERIA

Project is successful when:

✅ All agent changes have explicit user approval  
✅ No files were modified "to improve" anything  
✅ No unnecessary refactoring occurred  
✅ No folder structure changed  
✅ Frontend works exactly like V3.1  
✅ Backend links properly to frontend  
✅ PDF server still works  
✅ Zero errors in console  
✅ All tests pass  
✅ Complete backward compatibility  

---

## FINAL MESSAGE TO USER

**If agent breaks the code:**

1. It's not your fault - the safeguards weren't enforced
2. Revert immediately using backup
3. Give agent stricter instructions
4. Use this document as the enforcement tool
5. Require approval for EVERY change
6. Have agent show exact code before/after
7. Do NOT trust agent to "know what's best"
8. You are in control - agent is a tool

**This is your project. Protect it.**
