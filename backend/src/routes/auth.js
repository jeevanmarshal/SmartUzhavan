const express = require('express');
const AuthFactory = require('../factories/AuthFactory');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 */
router.post('/signup', async (req, res, next) => {
  try {
    const result = await AuthFactory.signup(req.body);
    return res.status(201).success(result.user, 'Signup successful');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user & get token
 */
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password, username } = req.body;
    // Handle V5 login (using username) or V6 (using identifier)
    const loginId = identifier || username;
    
    const result = await AuthFactory.login(loginId, password);

    // Set cookie for cross-domain auth
    res.cookie('authToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.success({ user: result.user, token: result.token }, 'Login successful');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Clear auth cookie
 */
router.post('/logout', (req, res) => {
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return res.success(null, 'Logged out successfully');
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 */
router.get('/me', authenticateToken, (req, res) => {
  return res.success(req.user.getPublicProfile(), 'User profile retrieved');
});

/**
 * @route   GET /api/auth/profile
 * @desc    Alias for /me (Backward compatibility)
 */
router.get('/profile', authenticateToken, (req, res) => {
  return res.success(req.user.getPublicProfile(), 'User profile retrieved');
});

module.exports = router;
