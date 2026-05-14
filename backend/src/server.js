const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const dns = require('dns');

// Force Google DNS for Atlas SRV resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

const responseFormatter = require('./middleware/responseFormatter');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const connectDB = require('./config/database');

const app = express();
const server = http.createServer(app);

// ============================================
// CORS CONFIGURATION
// ============================================

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://smart-uzhavan.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

const corsOriginValidator = (origin, callback) => {
  if (!origin) return callback(null, true);
  
  const isAllowed = allowedOrigins.includes(origin) || 
                   /^https:\/\/smart-uzhavan(-[\w-]+)?\.vercel\.app$/.test(origin) ||
                   origin.includes('localhost') || 
                   origin.includes('127.0.0.1');

  if (isAllowed) {
    callback(null, true);
  } else {
    console.warn('[CORS] ❌ Denied origin:', origin);
    callback(new Error('Not allowed by CORS policy'));
  }
};

const corsOptions = {
  origin: corsOriginValidator,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  maxAge: 86400,
};

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// JSend Response Formatter (Must be before routes)
app.use(responseFormatter);

// CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
app.use('/api/harvester', require('./routes/harvester'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/own-farm-income', require('./routes/own-farm-income'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/pdf', require('./routes/pdf'));
app.use('/api/rentals', require('./routes/rentals'));

// Health Check
app.get('/api/health', (req, res) => {
  res.success({ status: 'OK', uptime: process.uptime() }, 'Server is healthy');
});

// ============================================
// SOCKET.IO SETUP
// ============================================

const io = socketIo(server, {
  cors: {
    origin: corsOriginValidator,
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  logger.info(`[Socket.io] New client connected: ${socket.id}`);
  
  socket.on('sync:offline_updates', async (updates) => {
    try {
      const syncService = require('./services/syncService');
      if (syncService.processOfflineQueue) {
        await syncService.processOfflineQueue(updates, socket, io);
      }
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    code: 404,
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`✓ SmartUzhavan V6 running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = app;
