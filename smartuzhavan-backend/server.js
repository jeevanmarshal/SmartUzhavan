const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const connectDB = require('./config/database');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

// ============================================
// CORS CONFIGURATION (IMPROVED - Issue #1 Fixed)
// ============================================

// Allowed origins - add your production URL
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

// Enhanced CORS validator function
const corsOriginValidator = (origin, callback) => {
  console.log('[CORS] Incoming origin:', origin);

  if (!origin) {
    return callback(null, true); // Allow requests without origin (same-origin)
  }

  // Check 1: Exact match with allowed origins
  const isExactMatch = allowedOrigins.includes(origin);

  // Check 2: Regex for Vercel preview deployments (smartuzhavan-*.vercel.app)
  const isVercelPreview = /^https:\/\/smart-uzhavan-[\w-]+\.vercel\.app$/.test(origin);

  // Check 3: Exact match for known localhost ports
  const isLocalhost = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ].includes(origin);

  const isAllowed = isExactMatch || isVercelPreview || isLocalhost;

  if (isAllowed) {
    console.log('[CORS] ✅ Allowed origin:', origin);
    callback(null, true);
  } else {
    console.warn('[CORS] ❌ Denied origin:', origin);
    callback(new Error('Not allowed by CORS policy'));
  }
};

const corsOptions = {
  origin: corsOriginValidator,
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'set-cookie',
  ],
  exposedHeaders: ['Content-Length', 'X-JSON-Response-Code'],
  maxAge: 3600, // Cache preflight for 1 hour
  optionsSuccessStatus: 200, // For legacy browsers
};

// ============================================
// MIDDLEWARE
// ============================================

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS middleware - MUST be applied FIRST
app.use(cors(corsOptions));

// Explicit OPTIONS handling for preflight requests
app.options('*', cors(corsOptions));

// ============================================
// SESSION CONFIGURATION
// ============================================

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
      mongoUrl: process.env.MONGODB_URI,
      touchAfter: 24 * 3600, // Lazy session update (seconds)
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true, // Prevent XSS access to cookie
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // ✅ Essential for cross-domain cookies (Vercel to Railway)
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    proxy: process.env.NODE_ENV === 'production', // Trust proxy headers on Railway
  })
);

// ============================================
// ROUTES
// ============================================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/farmers', require('./routes/farmers'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/search', require('./routes/search'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/workers', require('./routes/workers'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/harvester-jobs', require('./routes/harvester'));
app.use('/api/finance-records', require('./routes/finance'));
app.use('/api/own-farm-income', require('./routes/own-farm-income'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/pdf', require('./routes/pdf'));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================
// SOCKET.IO SETUP (IMPROVED - Issue #5 Fixed)
// ============================================

const io = socketIo(server, {
  cors: {
    origin: corsOriginValidator, // Use same validator as HTTP CORS
    credentials: true,
    methods: ['GET', 'POST'],
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

// Store io instance on app for use in routes
app.set('io', io);

// Socket.io middleware
io.use((socket, next) => {
  const sessionId = socket.handshake.headers.cookie;
  if (!sessionId) {
    return next(new Error('Authentication required'));
  }
  next();
});

// Socket.io connection handler
io.on('connection', (socket) => {
  logger.info(`[Socket.io] New client connected: ${socket.id}`);

  socket.on('sync:offline_updates', async (updates) => {
    try {
      const syncService = require('./services/syncService');
      await syncService.processOfflineQueue(updates, socket, io);
    } catch (err) {
      logger.error(`[Socket.io] Sync error: ${err.message}`);
      socket.emit('sync:error', { message: err.message });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  logger.error(`[Error] ${err.message}`);

  // CORS errors
  if (err.message === 'Not allowed by CORS policy') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CORS_ERROR',
        message: 'CORS policy violation',
        origin: req.get('origin'),
      },
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message,
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║   SmartUzhavan Backend V5                  ║
║   Port: ${PORT.toString().padEnd(38)}║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(31)}║
║   Database: Connected                     ║
║   CORS: Configured                        ║
║   Socket.io: Enabled                      ║
╚═══════════════════════════════════════════╝
      `);

      logger.info('✅ Server ready');
      logger.info(`Allowed origins: ${allowedOrigins.join(', ')}`);
      logger.info(`Preview deployments (regex): smartuzhavan-*.vercel.app`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();

module.exports = app;
