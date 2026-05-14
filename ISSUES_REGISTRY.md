# SmartUzhavan V6 Issues Registry

This document tracks the architectural weaknesses identified during the V5 audit, which will be resolved in the V6 restructure.

## 1. API Response Inconsistencies
| Endpoint | Current Format | V6 Target | Priority |
|----------|----------------|-----------|----------|
| `/api/auth/login` | `{ success: true, user: {...} }` | `{ status: 'success', data: { user: {...}, token: '...' } }` | CRITICAL |
| `/api/drivers` | `[...]` (Raw Array) | `{ status: 'success', data: [...] }` | HIGH |
| `/api/farmers` | `[...]` (Raw Array) | `{ status: 'success', data: [...] }` | HIGH |
| `/api/harvester-jobs` | `{ success: true, data: [...] }` | `{ status: 'success', data: [...] }` | MEDIUM |
| Error States | Varies (JSON or 500 HTML) | `{ status: 'error', message: '...', code: 500 }` | CRITICAL |

## 2. Authentication Fragmentation
- **Admin**: Uses `User` model, sessions, and `auth.js` middleware.
- **Driver**: Uses `Driver` model, custom `/login` in `drivers.js`, PIN-based.
- **Farmer**: No secure login (frontend-only logic), uses `Farmer` model.
- **V6 Solution**: Unified `User` model with `role` field and JWT-based Auth Factory.

## 3. Path Mapping Mismatches
| Component | Frontend Call | Backend Route | Status |
|-----------|---------------|---------------|--------|
| `Workers.jsx` | `/api/workers/records` | `/api/workers/records` | FIXED (Conflict resolved) |
| `Rental.jsx` | `/api/rentals` | `/api/rentals` | FIXED (Added missing route) |
| `Auth` | `/api/auth/profile` | `/api/auth/profile` | Inconsistent naming (me vs profile) |

## 4. CORS & Environment Vulnerabilities
- Regex in `server.js` was too restrictive (blocked main domain).
- Fallback URLs in `api.js` were hardcoded to localhost in some versions.
- **V6 Solution**: Standardized environment variables and broader Vercel domain support.

## 5. Validation Gaps
- `Driver` model missing mandatory field checks in some controller paths.
- `User` seed script had duplicate key errors due to missing existence checks.
- **V6 Solution**: Joi or Express-Validator enforcement across all POST/PUT routes.
