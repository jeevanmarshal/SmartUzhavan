# SmartUzhavan v4 - Deployment Guide
## Railway.app & Render.com (Free Tier)

---

## OPTION 1: Deploy to Railway.app (Recommended)

Railway is beginner-friendly and has generous free tier for hobby projects.

### Prerequisites
- GitHub account with your SmartUzhavan backend repo
- MongoDB Atlas cluster (free tier)
- Railway account (https://railway.app)

### Step 1: Prepare Your GitHub Repository

**Ensure your repo structure:**
```
smartuzhavan-backend/
├── config/
├── models/
├── routes/
├── controllers/
├── middleware/
├── utils/
├── .env.example
├── .gitignore
├── server.js
├── package.json
└── README.md
```

**Create `.gitignore`:**
```
node_modules/
.env
.env.local
.env.*.local
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
dist/
.DS_Store
```

**Create `.env.example`:**
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/smartuzhavan
SESSION_SECRET=your-secret-here
FRONTEND_URL=https://your-frontend.com
LOG_LEVEL=info
```

**Verify `package.json` has:**
```json
{
  "name": "smartuzhavan-backend",
  "version": "4.0.0",
  "description": "Farm Management System Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --detectOpenHandles"
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
    "socket.io-client": "^4.5.0",
    "bcryptjs": "^2.4.3",
    "express-validator": "^7.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "winston": "^3.8.2"
  },
  "devDependencies": {
    "nodemon": "^2.0.22",
    "jest": "^29.5.0"
  }
}
```

**Create `server.js`:**
```javascript
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const logger = require('./utils/logger');
const connectDB = require('./config/database');

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

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // 24 hours
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/farmers', require('./routes/farmers'));
app.use('/api/reports', require('./routes/reports'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Socket.io configuration
require('./socket')(io);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});

// Connect to MongoDB and start server
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

### Step 2: Create Railway Account & Project

1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway to access your GitHub
4. Click "Create New Project"
5. Select "Deploy from GitHub repo"
6. Choose your `smartuzhavan-backend` repository
7. Railway will automatically detect Node.js

### Step 3: Add Environment Variables

In Railway Dashboard:
1. Go to your project
2. Click "Variables"
3. Add these variables:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/smartuzhavan
SESSION_SECRET=generate-random-string-here (use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
FRONTEND_URL=https://your-frontend-domain.com
LOG_LEVEL=info
```

### Step 4: Auto-Deploy

1. Every push to GitHub main branch automatically deploys
2. Railway shows deployment progress in dashboard
3. View logs: Click "Logs" tab

### Step 5: Get Your Backend URL

Railway provides a URL like:
```
https://smartuzhavan-backend-production.railway.app
```

Update your frontend CORS settings to this URL.

### Step 6: Verify Deployment

```bash
curl https://smartuzhavan-backend-production.railway.app/health
# Response: { "status": "OK", "timestamp": "..." }
```

### Troubleshooting Railway

**Problem: Build fails**
- Check `package.json` is in root
- Check `server.js` path is correct
- View logs in Railway dashboard

**Problem: Port binding error**
- Railway sets PORT environment variable
- Use `const PORT = process.env.PORT || 5000`

**Problem: Slow startup**
- First deploy takes 2-3 minutes
- Subsequent deploys: 30-60 seconds

**Problem: MongoDB connection timeout**
- Check MONGODB_URI is correct
- Verify MongoDB Atlas whitelist includes Railway IP (use 0.0.0.0/0)

---

## OPTION 2: Deploy to Render.com

Render is free-tier friendly with automatic deploys.

### Step 1: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render

### Step 2: Create Web Service

1. Click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Choose `smartuzhavan-backend`
5. Fill in settings:
   - **Name:** smartuzhavan-backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free

### Step 3: Add Environment Variables

1. Go to "Environment" tab
2. Click "Add Environment Variable"
3. Add all variables from `.env.example`:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=...
FRONTEND_URL=https://...
LOG_LEVEL=info
```

### Step 4: Deploy

1. Click "Create Web Service"
2. Render automatically starts deployment
3. Watch logs for progress
4. Deployment completes in 2-3 minutes

### Step 5: Get Your URL

Render provides URL like:
```
https://smartuzhavan-backend.onrender.com
```

### Verify Deployment

```bash
curl https://smartuzhavan-backend.onrender.com/health
```

### Render Free Tier Limitations

- ⏰ Spins down after 15 minutes of inactivity (wakes on request)
- ✅ Sufficient for development/testing
- 📊 Max 512 MB RAM (adequate for 100 users)
- 🔄 Automatic deploys on git push

---

## Common Deployment Tasks

### Task 1: Update Backend Code

```bash
git add .
git commit -m "Add feature: farmer search"
git push origin main
# Railway/Render automatically redeploys
```

### Task 2: Check Logs

**Railway:**
- Dashboard → Logs tab
- Real-time logs visible

**Render:**
- Dashboard → Logs
- Shows deploy and runtime logs

### Task 3: View Metrics

**Railway:**
- CPU usage
- Memory usage
- Request count
- Build time

**Render:**
- Memory usage
- CPU usage

### Task 4: Rollback Deployment

**Railway:**
- Click "Deployments"
- Select previous version
- Click "Rollback"

**Render:**
- Click "Deployments"
- Select previous version
- Click "Deploy"

### Task 5: Update Environment Variables

**Railway:**
- Variables tab
- Edit and save
- Automatic restart

**Render:**
- Environment tab
- Edit variables
- Click "Save Changes"
- Manual restart required

---

## Post-Deployment Checklist

- [ ] Backend URL accessible (test /health endpoint)
- [ ] CORS configured for frontend domain
- [ ] MongoDB connection verified
- [ ] Session store created (check MongoDB)
- [ ] First login attempt successful
- [ ] Farmer CRUD operations working
- [ ] Real-time Socket.io events broadcasting
- [ ] Audit logs being created
- [ ] Change history tracking enabled
- [ ] No errors in logs
- [ ] Response times acceptable (<500ms)

---

## Monitoring & Maintenance

### Weekly Tasks
- [ ] Check error logs for issues
- [ ] Monitor database storage usage
- [ ] Test critical API endpoints
- [ ] Review audit logs

### Monthly Tasks
- [ ] Check MongoDB Atlas usage (free tier is 512MB)
- [ ] Review backend logs for patterns
- [ ] Test backup/recovery process
- [ ] Update dependencies if needed

### Alerts to Set Up

**Railway Alerts:**
- Failed deployments
- High memory usage (>400MB)
- Health check failures

**Render Alerts:**
- Build failures
- Excessive memory usage
- Service crashes

---

## Scaling Beyond Free Tier

When you hit limits:

### MongoDB Atlas
```
Free: 512MB → $57/month for 2GB
Free: 3 connections → Upgrade for more
```

### Railway
```
Free: $5 credit/month → Auto-scales
```

### Render
```
Free: Sleeps after 15 min → Upgrade to $7/month
```

---

## Security Checklist

- [ ] SESSION_SECRET is strong (32+ random chars)
- [ ] MONGODB_URI only in environment (not in code)
- [ ] FRONTEND_URL configured correctly
- [ ] HTTPS enforced (both services provide SSL)
- [ ] CORS whitelist specific domains
- [ ] Rate limiting implemented
- [ ] No sensitive data in logs
- [ ] MongoDB whitelist not 0.0.0.0/0 in production

---

## CI/CD Setup (Optional)

### GitHub Actions Workflow

**File: `.github/workflows/deploy.yml`**

```yaml
name: Deploy to Railway/Render

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 18
      - run: npm install
      - run: npm run test
      # Deploy happens automatically via Railway/Render webhook
```

---

## Troubleshooting Deployment

| Problem | Solution |
|---------|----------|
| **Port already in use** | Use environment PORT variable |
| **MongoDB connection timeout** | Whitelist 0.0.0.0/0 in Atlas |
| **CORS errors** | Update FRONTEND_URL to exact domain |
| **Session not persisting** | Check connect-mongo connection |
| **Socket.io not connecting** | Verify CORS in socket.io config |
| **Slow startup** | Check buildpack, dependencies |
| **Memory errors** | Check for memory leaks, increase plan |
| **Timeout on requests** | Increase timeout, optimize queries |

---

## Cost Breakdown (Monthly)

| Component | Free Tier | Cost |
|-----------|-----------|------|
| Backend (Railway) | ✅ $5 credit | Free |
| Backend (Render) | 15 min sleep | $7 if upgrade |
| MongoDB Atlas | 512MB | Free |
| GitHub | Unlimited repos | Free |
| **Total** | | **FREE** |

---

## Performance Targets After Deployment

| Metric | Target | Status |
|--------|--------|--------|
| API Response | <500ms | Monitor logs |
| DB Query | <200ms | Check indexes |
| Login | <1s | Monitor flow |
| Socket.io Broadcast | <2s | Check overhead |
| CSV Export | <5s for 1000 rows | Test at scale |

---

## Next Steps After Deployment

1. **Connect Frontend** → Update API URL in React
2. **Test Integration** → Login, create farmer, check sync
3. **Load Test** → Simulate 10-100 concurrent users
4. **Monitor Logs** → Set up daily log review
5. **Backup Strategy** → Test MongoDB export monthly
6. **Documentation** → Create runbook for team

---

**Version:** 4.0  
**Last Updated:** May 2026  
**Status:** Production Deployment Ready
