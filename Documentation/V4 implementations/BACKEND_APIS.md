# SmartUzhavan V5 API Documentation

## Base Information
- **Base URL**: `/api`
- **Response Format**: Standard JSON Envelope
- **Authentication**: Session cookies (`connect.sid`)

### Standard Response Envelope
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2026-05-12T00:00:00Z",
    "version": "v5.0",
    "requestId": "uuid"
  },
  "pagination": { "page": 1, "limit": 20, "total": 1, "pages": 1 }
}
```

## 1. Drivers API (`/api/drivers`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/drivers` | Create a new driver | Yes (Admin) |
| GET | `/api/drivers` | List drivers (paginated) | Yes |
| GET | `/api/drivers/:id` | Get driver detail | Yes |
| PUT | `/api/drivers/:id` | Update driver details | Yes (Admin) |
| DELETE | `/api/drivers/:id` | Soft delete driver | Yes (Admin) |
| POST | `/api/drivers/:id/change-pin` | Reset driver PIN | Yes (SuperAdmin) |
| GET | `/api/drivers/:id/salary-history` | Get driver's log/salary history | Yes |

## 2. Workers API (`/api/workers`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/workers` | Create a new worker | Yes |
| GET | `/api/workers` | List workers | Yes |
| GET | `/api/workers/:id` | Get worker detail | Yes |
| PUT | `/api/workers/:id` | Update worker | Yes |
| DELETE | `/api/workers/:id` | Soft delete worker | Yes |

### Worker Records (`/api/workers/records`)
- `POST /api/workers/records` - Log new work record
- `GET /api/workers/records/all` - List work records
- `PUT /api/workers/records/:id` - Update work record
- `DELETE /api/workers/records/:id` - Soft delete record

## 3. Expenses API (`/api/expenses`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/expenses` | Log an expense | Yes |
| GET | `/api/expenses` | List expenses (w/ date filters) | Yes |
| GET | `/api/expenses/summary/aggregate` | Aggregate expenses by category | Yes |
| PUT | `/api/expenses/:id` | Update expense | Yes |
| DELETE | `/api/expenses/:id` | Delete expense | Yes |

## 4. Harvester Jobs API (`/api/harvester-jobs`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/harvester-jobs` | Schedule/Create a job | Yes |
| GET | `/api/harvester-jobs` | List harvester jobs | Yes |
| GET | `/api/harvester-jobs/:id` | Get job details & linked logs | Yes |
| PUT | `/api/harvester-jobs/:id` | Update job status | Yes |
| DELETE | `/api/harvester-jobs/:id` | Delete job | Yes |
| POST | `/api/harvester-jobs/:id/link-logs`| Link driver logs to job | Yes |

## 5. Finance Lending API (`/api/finance-records`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/finance-records` | Issue loan/advance/credit | Yes |
| GET | `/api/finance-records` | List finance records | Yes |
| GET | `/api/finance-records/summary/aggregate` | Aggregate by status | Yes |
| GET | `/api/finance-records/overdue` | List overdue records | Yes |
| GET | `/api/finance-records/:id` | Get record detail | Yes |
| PUT | `/api/finance-records/:id` | Update record | Yes |
| POST | `/api/finance-records/:id/payment`| Record a payment | Yes |
| DELETE | `/api/finance-records/:id` | Delete record | Yes |

## 6. Own Farm Income API (`/api/own-farm-income`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/own-farm-income` | Create income entry (paddy/straw) | Yes |
| GET | `/api/own-farm-income` | List income entries | Yes |
| GET | `/api/own-farm-income/summary/aggregate` | Aggregate by type | Yes |
| PUT | `/api/own-farm-income/:id` | Update entry | Yes |
| DELETE | `/api/own-farm-income/:id` | Delete entry | Yes |

## 7. Settings API (`/api/settings`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/settings` | Get all settings | Yes |
| GET | `/api/settings/prices` | Get only prices | Yes |
| GET | `/api/settings/categories` | Get only categories | Yes |
| GET | `/api/settings/work-types` | Get only work types | Yes |
| PUT | `/api/settings/:key` | Update/Create setting by key | Yes (SuperAdmin) |
