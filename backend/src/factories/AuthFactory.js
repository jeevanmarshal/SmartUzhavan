const User = require('../models/User');

class AuthFactory {
  /**
   * Universal login handler
   */
  static async login(identifier, password) {
    if (!identifier || !password) {
      throw { statusCode: 400, message: 'Identifier and password required' };
    }

    // Support login by email, phone, or username
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phoneNumber: identifier },
        { username: identifier }
      ]
    }).select('+password');

    if (!user) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    if (user.isAccountLocked()) {
      throw { statusCode: 429, message: 'Account locked. Try again later.' };
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    await user.resetLoginAttempts();
    user.lastLogin = new Date();
    await user.save();

    const token = user.generateAuthToken();
    return { user: user.getPublicProfile(), token };
  }

  /**
   * Universal signup handler
   */
  static async signup(userData) {
    const { email, phoneNumber, password, firstName, lastName, role = 'USER', roleData = {} } = userData;

    if (!email || !phoneNumber || !password || !firstName || !lastName) {
      throw { statusCode: 400, message: 'Missing required fields' };
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phoneNumber }]
    });

    if (existingUser) {
      throw { statusCode: 409, message: 'User already exists with this email or phone' };
    }

    const user = new User({
      email: email.toLowerCase(),
      phoneNumber,
      password,
      firstName,
      lastName,
      role,
      roleData
    });

    await user.save();
    const token = user.generateAuthToken();

    return { user: user.getPublicProfile(), token };
  }

  /**
   * Verify JWT token and return user
   */
  static async verifyToken(token) {
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
      const user = await User.findById(decoded.id);
      
      if (!user || !user.isActive) {
        throw { statusCode: 401, message: 'User not found or inactive' };
      }

      return user;
    } catch (error) {
      throw { statusCode: 401, message: 'Invalid or expired token' };
    }
  }

  /**
   * Refresh token logic
   */
  static async refreshToken(userId) {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw { statusCode: 401, message: 'User not found or inactive' };
    }

    const newToken = user.generateAuthToken();
    return { token: newToken };
  }
}

module.exports = AuthFactory;
