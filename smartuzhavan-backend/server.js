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

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Routes
const auditMiddleware = require('./middleware/audit');
app.use('/api/', auditMiddleware);
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

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Socket.io setup
app.set('io', io);

io.use((socket, next) => {
  const sessionId = socket.handshake.headers.cookie;
  if (!sessionId) {
    return next(new Error('Authentication required'));
  }
  next();
});

io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);
  
  socket.on('sync:offline_updates', async (updates) => {
    try {
      const syncService = require('./services/syncService');
      await syncService.processOfflineQueue(updates, socket, io);
    } catch (err) {
      logger.error(`Sync error: ${err.message}`);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});

// Start server
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
