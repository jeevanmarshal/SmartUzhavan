# SmartUzhavan (Rural Ledger & Machinery Management System) 🌾🚜

SmartUzhavan is a comprehensive full-stack farm and machinery management application designed to digitalize agricultural bookkeeping. This system allows farmers, machine operators, and agricultural managers to track land areas, crop distributions, expenses, incomes, and machinery rentals with seamless reporting capabilities.

## 🚀 Project Overview

The repository has recently been upgraded to a **V4 Architecture**, transitioning the project into a professional, production-ready MERN Stack monorepo. 

### Key Features
- **Role-Based Authentication:** Secure, session-based login for Super Admins, Admins, and Operators.
- **Farmer Management:** Complete CRUD operations for tracking farmer profiles, land areas, soil types, and crop history.
- **Audit Logging & Change History:** Robust tracking of all system mutations (Create, Update, Restore, Delete) with a built-in offline-first sync queue.
- **Real-Time Data (Socket.io):** Instant UI updates broadcasted globally whenever a farmer profile is altered.
- **Advanced Reporting & Export:** Full-text search and comprehensive CSV/Excel export functionality.

## 📂 Repository Structure

```text
├── smartuzhavan-frontend/       # React + Vite Frontend Application
├── smartuzhavan-backend/        # Node.js + Express + MongoDB Backend (V4)
├── server/                      # Legacy V3 Backend (Archived)
├── Documentation/               # Project reports and system documentation
└── V4 implementations/          # Architectural plans and API specifications
```

## 🛠️ Technology Stack
- **Frontend:** React, Vite, CSS Modules
- **Backend:** Node.js, Express.js, Socket.io
- **Database:** MongoDB Atlas (Mongoose)
- **Deployment:** Railway.app (Backend)

## 💻 Local Setup & Development

### 1. Backend Setup
```bash
cd smartuzhavan-backend
npm install
```
Ensure you create a `.env` file inside `smartuzhavan-backend` with:
```env
MONGODB_URI=your_mongodb_cluster_url
SESSION_SECRET=your_secure_secret
PORT=5000
NODE_ENV=development
```
Start the backend server:
```bash
npm run dev
# Server will listen on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd smartuzhavan-frontend
npm install
```
Start the frontend development server:
```bash
npm run dev
```
*(The frontend is configured via `.env` to connect directly to the live production server or local server depending on your configuration).*

## 🔗 Live Deployment
- **Production Backend URL:** `https://smartuzhavan-production.up.railway.app`

---
*Built to empower rural agriculture through digital precision.*
