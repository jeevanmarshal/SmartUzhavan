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
   * Driver login handler (V3.1 Style)
   */
  static async driverLogin(phone, pin) {
    const Driver = require('../models/Driver');
    const jwt = require('jsonwebtoken');

    if (!phone || !pin) {
      throw { statusCode: 400, message: 'Phone and PIN are required' };
    }

    const driver = await Driver.findOne({ phone, isDeleted: false });
    if (!driver || !driver.active) {
      throw { statusCode: 401, message: 'Invalid phone or inactive driver' };
    }

    const isPinValid = await driver.verifyPIN(pin);
    if (!isPinValid) {
      throw { statusCode: 401, message: 'Invalid PIN' };
    }

    // Generate token with DRIVER role
    const token = jwt.sign(
      { id: driver._id, role: 'DRIVER', phone: driver.phone },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    return {
      user: {
        _id: driver._id,
        name: driver.name,
        role: 'DRIVER',
        phone: driver.phone
      },
      token
    };
  }

  /**
   * Farmer login handler (V3.1 Style - Phone only)
   */
  static async farmerLogin(phone) {
    const Farmer = require('../models/Farmer');
    const jwt = require('jsonwebtoken');

    if (!phone) {
      throw { statusCode: 400, message: 'Phone number is required' };
    }

    const farmer = await Farmer.findOne({ phone, isDeleted: false });
    if (!farmer) {
      throw { statusCode: 404, message: 'Farmer not found with this phone number' };
    }

    // Generate token with FARMER role
    const token = jwt.sign(
      { id: farmer._id, role: 'FARMER', phone: farmer.phone },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    return {
      user: {
        _id: farmer._id,
        name: farmer.name,
        role: 'FARMER',
        phone: farmer.phone
      },
      token
    };
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
