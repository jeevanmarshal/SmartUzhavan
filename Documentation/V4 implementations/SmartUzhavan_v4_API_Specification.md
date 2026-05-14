# SmartUzhavan v4 - Complete API Specification

## Base URL
```
Development: http://localhost:5000
Production: https://smartuzhavan-backend.railway.app (or similar)
```

---

## Authentication Endpoints

### 1. POST /api/auth/register
**Description:** Register a new admin user (Super Admin only)

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "john_admin",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "admin"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_admin",
    "email": "john@example.com",
    "role": "admin",
    "createdAt": "2026-05-05T12:00:00Z"
  }
}
```

**Response: 400 Bad Request**
```json
{
  "success": false,
  "errors": [
    {
      "field": "username",
      "message": "Username already exists"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

**Response: 403 Forbidden**
```json
{
  "success": false,
  "message": "Only super_admin can register new users"
}
```

**Validation Rules:**
- `username`: 3-20 chars, alphanumeric + underscore, unique
- `email`: valid email format, unique
- `password`: 8+ chars, must include uppercase, lowercase, number, special char
- `role`: enum [admin, operator] (only super_admin can assign)

---

### 2. POST /api/auth/login
**Description:** Authenticate user and create session

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "john_admin",
  "password": "SecurePass123!"
}
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_admin",
    "email": "john@example.com",
    "role": "admin",
    "lastLogin": "2026-05-05T12:00:00Z"
  }
}
```

**Response: 401 Unauthorized**
```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

**Response: 429 Too Many Requests** (after 5 failed attempts)
```json
{
  "success": false,
  "message": "Too many login attempts. Try again in 15 minutes."
}
```

**Note:** Session cookie automatically set as httpOnly, Secure
```
Set-Cookie: sessionId=abc123...; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=86400
```

---

### 3. GET /api/auth/profile
**Description:** Get current logged-in user profile

**Headers:**
```
Authorization: Cookie (session cookie)
```

**Response: 200 OK**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_admin",
    "email": "john@example.com",
    "role": "admin",
    "lastLogin": "2026-05-05T12:00:00Z",
    "createdAt": "2026-05-01T08:00:00Z"
  }
}
```

**Response: 401 Unauthorized**
```json
{
  "success": false,
  "message": "Not authenticated. Please login first."
}
```

---

### 4. POST /api/auth/logout
**Description:** Destroy session and logout user

**Headers:**
```
Authorization: Cookie (session cookie)
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Note:** Session cookie cleared
```
Set-Cookie: sessionId=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

---

## Farmers CRUD Endpoints

### 5. GET /api/farmers
**Description:** Get all farmers with pagination, filtering, and search

**Query Parameters:**
```
?page=1                    # Page number (default: 1)
&limit=20                  # Records per page (default: 20, max: 100)
&search=ramesh             # Full-text search across name, phone, village
&village=kovilpatti        # Filter by village
&crop=sugarcane            # Filter by crop
&sortBy=createdAt          # Sort field (createdAt, name, village)
&sortOrder=desc            # asc or desc
&includeDeleted=false      # Show soft-deleted (admin only)
```

**Headers:**
```
Authorization: Cookie (session cookie)
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "farmers": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Ramesh Kumar",
        "phone": "+919876543210",
        "village": "Kovilpatti",
        "landArea": 2.5,
        "crops": ["sugarcane", "groundnut"],
        "soilType": "black soil",
        "metadata": {
          "irrigation": "drip",
          "certification": "organic"
        },
        "createdBy": "507f1f77bcf86cd799439012",
        "createdAt": "2026-05-01T08:00:00Z",
        "updatedAt": "2026-05-03T10:30:00Z",
        "isDeleted": false
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 95,
      "recordsPerPage": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Response: 400 Bad Request**
```json
{
  "success": false,
  "errors": [
    {
      "field": "limit",
      "message": "Limit must be between 1 and 100"
    }
  ]
}
```

**Response: 401 Unauthorized**
```json
{
  "success": false,
  "message": "Not authenticated"
}
```

---

### 6. POST /api/farmers
**Description:** Create a new farmer record

**Headers:**
```
Content-Type: application/json
Authorization: Cookie (session cookie)
```

**Request Body:**
```json
{
  "name": "Ramesh Kumar",
  "phone": "+919876543210",
  "village": "Kovilpatti",
  "landArea": 2.5,
  "crops": ["sugarcane", "groundnut"],
  "soilType": "black soil",
  "metadata": {
    "irrigation": "drip",
    "certification": "organic",
    "yield": "50 tons/acre"
  }
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Farmer created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Ramesh Kumar",
    "phone": "+919876543210",
    "village": "Kovilpatti",
    "landArea": 2.5,
    "crops": ["sugarcane", "groundnut"],
    "soilType": "black soil",
    "metadata": {
      "irrigation": "drip",
      "certification": "organic",
      "yield": "50 tons/acre"
    },
    "createdBy": "507f1f77bcf86cd799439012",
    "createdAt": "2026-05-05T12:00:00Z",
    "updatedAt": "2026-05-05T12:00:00Z"
  }
}
```

**Response: 400 Bad Request**
```json
{
  "success": false,
  "errors": [
    {
      "field": "name",
      "message": "Name is required"
    },
    {
      "field": "landArea",
      "message": "Land area must be a positive number"
    }
  ]
}
```

**Validation Rules:**
- `name`: required, 2-100 chars
- `phone`: optional, valid phone format if provided
- `village`: required, 2-50 chars
- `landArea`: required, positive number
- `crops`: array of strings, optional
- `soilType`: optional
- `metadata`: object, optional (no restrictions)

**Audit Log Created:**
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "action": "CREATE",
  "entity": "farmers",
  "entityId": "507f1f77bcf86cd799439011",
  "beforeData": null,
  "afterData": { ...farmer data... },
  "ipAddress": "192.168.1.1",
  "timestamp": "2026-05-05T12:00:00Z"
}
```

---

### 7. GET /api/farmers/:id
**Description:** Get single farmer with full history and metadata

**Path Parameters:**
```
:id - Farmer MongoDB ObjectId
```

**Headers:**
```
Authorization: Cookie (session cookie)
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "farmer": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Ramesh Kumar",
      "phone": "+919876543210",
      "village": "Kovilpatti",
      "landArea": 2.5,
      "crops": ["sugarcane", "groundnut"],
      "soilType": "black soil",
      "metadata": {
        "irrigation": "drip",
        "certification": "organic"
      },
      "createdBy": "507f1f77bcf86cd799439012",
      "createdAt": "2026-05-01T08:00:00Z",
      "updatedAt": "2026-05-03T10:30:00Z",
      "isDeleted": false
    },
    "changeHistory": [
      {
        "version": 2,
        "data": { ...updated farmer data... },
        "changedBy": "507f1f77bcf86cd799439012",
        "changedAt": "2026-05-03T10:30:00Z"
      },
      {
        "version": 1,
        "data": { ...original farmer data... },
        "changedBy": "507f1f77bcf86cd799439012",
        "changedAt": "2026-05-01T08:00:00Z"
      }
    ]
  }
}
```

**Response: 404 Not Found**
```json
{
  "success": false,
  "message": "Farmer not found"
}
```

---

### 8. PUT /api/farmers/:id
**Description:** Update farmer record and create change history

**Path Parameters:**
```
:id - Farmer MongoDB ObjectId
```

**Headers:**
```
Content-Type: application/json
Authorization: Cookie (session cookie)
```

**Request Body:**
```json
{
  "name": "Ramesh Kumar Singh",
  "landArea": 3.0,
  "crops": ["sugarcane", "groundnut", "jowar"],
  "metadata": {
    "irrigation": "drip",
    "certification": "organic",
    "yield": "55 tons/acre"
  }
}
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Farmer updated successfully",
  "data": {
    "farmer": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Ramesh Kumar Singh",
      "phone": "+919876543210",
      "village": "Kovilpatti",
      "landArea": 3.0,
      "crops": ["sugarcane", "groundnut", "jowar"],
      "soilType": "black soil",
      "metadata": {
        "irrigation": "drip",
        "certification": "organic",
        "yield": "55 tons/acre"
      },
      "updatedBy": "507f1f77bcf86cd799439012",
      "updatedAt": "2026-05-05T14:00:00Z"
    },
    "changeHistoryVersion": 3
  }
}
```

**Response: 404 Not Found**
```json
{
  "success": false,
  "message": "Farmer not found"
}
```

**Change History Created:**
```json
{
  "documentId": "507f1f77bcf86cd799439011",
  "documentType": "farmers",
  "version": 3,
  "data": { ...new farmer data... },
  "changedBy": "507f1f77bcf86cd799439012",
  "changedAt": "2026-05-05T14:00:00Z"
}
```

**Audit Log Created:**
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "action": "UPDATE",
  "entity": "farmers",
  "entityId": "507f1f77bcf86cd799439011",
  "beforeData": { ...old farmer data... },
  "afterData": { ...new farmer data... },
  "ipAddress": "192.168.1.1",
  "timestamp": "2026-05-05T14:00:00Z"
}
```

---

### 9. DELETE /api/farmers/:id
**Description:** Soft delete farmer (mark as deleted, don't remove)

**Path Parameters:**
```
:id - Farmer MongoDB ObjectId
```

**Headers:**
```
Authorization: Cookie (session cookie)
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Farmer deleted successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Ramesh Kumar",
    "isDeleted": true,
    "deletedAt": "2026-05-05T15:00:00Z",
    "deletedBy": "507f1f77bcf86cd799439012"
  }
}
```

**Response: 404 Not Found**
```json
{
  "success": false,
  "message": "Farmer not found or already deleted"
}
```

**Audit Log Created:**
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "action": "DELETE",
  "entity": "farmers",
  "entityId": "507f1f77bcf86cd799439011",
  "beforeData": { ...farmer data before delete... },
  "afterData": { isDeleted: true },
  "ipAddress": "192.168.1.1",
  "timestamp": "2026-05-05T15:00:00Z"
}
```

---

## History & Restore Endpoints

### 10. GET /api/farmers/:id/history
**Description:** Get version history for a farmer

**Path Parameters:**
```
:id - Farmer MongoDB ObjectId
```

**Query Parameters:**
```
?limit=10    # Records per page
&page=1      # Page number
```

**Headers:**
```
Authorization: Cookie (session cookie)
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "farmerId": "507f1f77bcf86cd799439011",
    "versions": [
      {
        "version": 3,
        "data": {
          "name": "Ramesh Kumar Singh",
          "landArea": 3.0,
          "crops": ["sugarcane", "groundnut", "jowar"]
        },
        "changedBy": {
          "id": "507f1f77bcf86cd799439012",
          "username": "john_admin"
        },
        "changedAt": "2026-05-05T14:00:00Z"
      },
      {
        "version": 2,
        "data": {
          "name": "Ramesh Kumar",
          "landArea": 2.5,
          "crops": ["sugarcane", "groundnut"]
        },
        "changedBy": {
          "id": "507f1f77bcf86cd799439012",
          "username": "john_admin"
        },
        "changedAt": "2026-05-03T10:30:00Z"
      },
      {
        "version": 1,
        "data": {
          "name": "Ramesh Kumar",
          "landArea": 2.5,
          "crops": ["sugarcane", "groundnut"]
        },
        "changedBy": {
          "id": "507f1f77bcf86cd799439012",
          "username": "john_admin"
        },
        "changedAt": "2026-05-01T08:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalVersions": 3
    }
  }
}
```

---

### 11. POST /api/farmers/:id/restore/:version
**Description:** Restore farmer to a previous version

**Path Parameters:**
```
:id       - Farmer MongoDB ObjectId
:version  - Version number to restore to
```

**Headers:**
```
Authorization: Cookie (session cookie)
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Farmer restored to version 2",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Ramesh Kumar",
    "landArea": 2.5,
    "crops": ["sugarcane", "groundnut"],
    "restoredFrom": 2,
    "restoredAt": "2026-05-05T16:00:00Z"
  }
}
```

**Response: 404 Not Found**
```json
{
  "success": false,
  "message": "Version not found"
}
```

**Audit Log Created:**
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "action": "RESTORE",
  "entity": "farmers",
  "entityId": "507f1f77bcf86cd799439011",
  "beforeData": { ...current data... },
  "afterData": { ...restored data from version 2... },
  "metadata": { "restoredFrom": 2 },
  "ipAddress": "192.168.1.1",
  "timestamp": "2026-05-05T16:00:00Z"
}
```

---

## Search Endpoints

### 12. POST /api/farmers/search
**Description:** Full-text search across farmers

**Headers:**
```
Content-Type: application/json
Authorization: Cookie (session cookie)
```

**Request Body:**
```json
{
  "query": "ramesh",
  "fields": ["name", "phone", "village"],
  "page": 1,
  "limit": 20
}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Ramesh Kumar",
        "phone": "+919876543210",
        "village": "Kovilpatti",
        "score": 0.95,
        "highlights": {
          "name": "**Ramesh** Kumar"
        }
      },
      {
        "id": "507f1f77bcf86cd799439013",
        "name": "S. Ramesh",
        "phone": "+919876543211",
        "village": "Madurai",
        "score": 0.85,
        "highlights": {
          "name": "S. **Ramesh**"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalResults": 2
    }
  }
}
```

---

## Reporting Endpoints

### 13. GET /api/reports/summary
**Description:** Get dashboard statistics

**Headers:**
```
Authorization: Cookie (session cookie)
```

**Query Parameters:**
```
?from=2026-05-01         # Start date
&to=2026-05-31           # End date
&village=kovilpatti      # Optional filter
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalFarmers": 245,
      "activeFarmers": 243,
      "deletedFarmers": 2,
      "totalLandArea": 612.5,
      "averageLandArea": 2.51,
      "topVillages": [
        { "village": "Kovilpatti", "count": 45 },
        { "village": "Madurai", "count": 38 },
        { "village": "Sivaganga", "count": 32 }
      ],
      "cropDistribution": [
        { "crop": "sugarcane", "count": 120 },
        { "crop": "groundnut", "count": 95 },
        { "crop": "jowar", "count": 60 },
        { "crop": "cotton", "count": 40 }
      ],
      "soilTypeDistribution": [
        { "soilType": "black soil", "count": 150 },
        { "soilType": "red soil", "count": 80 },
        { "soilType": "loamy soil", "count": 15 }
      ],
      "recordsCreated": 15,
      "recordsUpdated": 42,
      "recordsDeleted": 2
    },
    "generatedAt": "2026-05-05T17:00:00Z"
  }
}
```

---

### 14. GET /api/reports/farmers/export
**Description:** Export farmers data as CSV with server-side processing

**Headers:**
```
Authorization: Cookie (session cookie)
```

**Query Parameters:**
```
?format=csv                  # csv, xlsx
&fields=name,phone,village   # Comma-separated field names
&filter=village:kovilpatti   # Optional filters
```

**Response: 200 OK (Streaming CSV)**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename=farmers_2026-05-05.csv

name,phone,village,landArea,crops,soilType,createdAt,createdBy
Ramesh Kumar,+919876543210,Kovilpatti,2.5,"sugarcane,groundnut",black soil,2026-05-01T08:00:00Z,john_admin
...
```

**Response: 200 OK (XLSX)**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename=farmers_2026-05-05.xlsx

[Excel file binary data]
```

---

### 15. GET /api/reports/audit-log
**Description:** View audit trail with filtering

**Headers:**
```
Authorization: Cookie (session cookie)
```

**Query Parameters:**
```
?page=1                      # Page number
&limit=50                    # Records per page
&userId=507f1f77bcf86cd799439012    # Filter by user
&action=CREATE               # Filter by action (CREATE, UPDATE, DELETE)
&entity=farmers              # Filter by entity type
&fromDate=2026-05-01         # Date range
&toDate=2026-05-05           # Date range
&sortBy=timestamp            # Sort field
&sortOrder=desc              # asc or desc
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "507f1f77bcf86cd799439015",
        "user": {
          "id": "507f1f77bcf86cd799439012",
          "username": "john_admin"
        },
        "action": "CREATE",
        "entity": "farmers",
        "entityId": "507f1f77bcf86cd799439011",
        "beforeData": null,
        "afterData": {
          "name": "Ramesh Kumar",
          "village": "Kovilpatti",
          "landArea": 2.5
        },
        "ipAddress": "192.168.1.1",
        "timestamp": "2026-05-05T12:00:00Z"
      },
      {
        "id": "507f1f77bcf86cd799439016",
        "user": {
          "id": "507f1f77bcf86cd799439012",
          "username": "john_admin"
        },
        "action": "UPDATE",
        "entity": "farmers",
        "entityId": "507f1f77bcf86cd799439011",
        "beforeData": {
          "landArea": 2.5
        },
        "afterData": {
          "landArea": 3.0
        },
        "ipAddress": "192.168.1.1",
        "timestamp": "2026-05-05T14:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 234,
      "recordsPerPage": 50
    }
  }
}
```

---

## WebSocket Events

### Real-time Farmer Events

**Event: farmer:created**
```javascript
// Server broadcasts to all connected clients
io.emit('farmer:created', {
  farmer: {
    id: "507f1f77bcf86cd799439011",
    name: "Ramesh Kumar",
    village: "Kovilpatti",
    landArea: 2.5,
    createdBy: "john_admin",
    createdAt: "2026-05-05T12:00:00Z"
  }
});

// Client listener
socket.on('farmer:created', (data) => {
  console.log('New farmer added:', data.farmer);
  // Update UI, refresh list
});
```

**Event: farmer:updated**
```javascript
// Server broadcasts to all connected clients
io.emit('farmer:updated', {
  farmerId: "507f1f77bcf86cd799439011",
  changes: {
    landArea: 3.0,
    crops: ["sugarcane", "groundnut", "jowar"]
  },
  updatedBy: "john_admin",
  updatedAt: "2026-05-05T14:00:00Z"
});

// Client listener
socket.on('farmer:updated', (data) => {
  console.log('Farmer updated:', data);
  // Update UI with delta
});
```

**Event: farmer:deleted**
```javascript
// Server broadcasts to all connected clients
io.emit('farmer:deleted', {
  farmerId: "507f1f77bcf86cd799439011",
  deletedBy: "john_admin",
  deletedAt: "2026-05-05T15:00:00Z"
});

// Client listener
socket.on('farmer:deleted', (data) => {
  console.log('Farmer deleted:', data);
  // Remove from UI
});
```

---

## Error Responses

### Standard Error Format

**400 Bad Request**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      {
        "field": "phone",
        "message": "Invalid phone format"
      }
    ]
  }
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please login first."
  }
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to perform this action"
  }
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

**429 Too Many Requests**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "An unexpected error occurred. Our team has been notified."
  }
}
```

---

## Rate Limiting

Global rate limits (per IP):
- Login attempts: 5 per 15 minutes
- General API: 100 requests per minute
- Export: 5 per hour

Response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1620340800
```

---

## Pagination

All list endpoints follow this pagination format:

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 95,
      "recordsPerPage": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## Summary of Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | /api/auth/register | Register user | Super Admin |
| POST | /api/auth/login | Login | Public |
| GET | /api/auth/profile | Get profile | Required |
| POST | /api/auth/logout | Logout | Required |
| GET | /api/farmers | List farmers | Required |
| POST | /api/farmers | Create farmer | Required |
| GET | /api/farmers/:id | Get farmer | Required |
| PUT | /api/farmers/:id | Update farmer | Required |
| DELETE | /api/farmers/:id | Delete farmer | Required |
| GET | /api/farmers/:id/history | Get history | Required |
| POST | /api/farmers/:id/restore/:version | Restore farmer | Required |
| POST | /api/farmers/search | Search farmers | Required |
| GET | /api/reports/summary | Dashboard stats | Required |
| GET | /api/reports/farmers/export | Export data | Required |
| GET | /api/reports/audit-log | View audit trail | Required |

---

**Version:** 4.0  
**Last Updated:** May 2026  
**Status:** Production Ready
