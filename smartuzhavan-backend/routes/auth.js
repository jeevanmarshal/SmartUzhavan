const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../utils/logger');
const { isAuthenticated, checkRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', [
  body('username').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  body('role').isIn(['admin', 'operator'])
], isAuthenticated, checkRole(['super_admin']), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { username, email, password, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: existingUser.username === username ? 'username' : 'email',
            message: 'Already exists'
          }
        ]
      });
    }
    
    const user = new User({ username, email, password, role });
    await user.save();
    
    logger.info(`User registered: ${username}`);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: user.toJSON()
    });
  } catch (error) {
    logger.error(`Register error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { username, password } = req.body;
    const user = await User.findOne({ username }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      logger.warn(`Failed login attempt: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    
    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();
    
    // Create session
    req.session.userId = user._id;
    
    logger.info(`User logged in: ${username}`);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: user.toJSON()
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// GET /api/auth/profile
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toJSON()
    });
  } catch (error) {
    logger.error(`Profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// POST /api/auth/logout
router.post('/logout', isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error(`Logout error: ${err.message}`);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Logout failed'
        }
      });
    }
    
    logger.info(`User logged out: ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

module.exports = router;
