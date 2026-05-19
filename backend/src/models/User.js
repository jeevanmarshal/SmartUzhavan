const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

const userSchema = new mongoose.Schema(
  {
    // Core Identity
    username: {
      type: String,
      unique: true,
      trim: true,
      sparse: true, // Allow nulls while maintaining uniqueness
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      match: [/^[0-9]{10,14}$/, 'Phone number must be valid'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },

    // Profile
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    profileImage: { type: String, default: null },
    address: {
      street: String,
      city: { type: String, default: 'Thanjavur' },
      state: { type: String, default: 'Tamil Nadu' },
      zipCode: String,
      country: { type: String, default: 'India' },
    },

    // RBAC
    role: {
      type: String,
      enum: ['USER', 'DRIVER', 'FARMER', 'ADMIN', 'SUPER_ADMIN'],
      default: 'USER',
      required: true,
    },

    // Role-specific data
    roleData: {
      // Driver fields
      driverLicense: String,
      licenseExpiry: Date,
      vehicleNumber: String,
      vehicleType: { type: String, enum: ['AUTO', 'TRUCK', 'VAN'] },
      
      // Farmer fields
      farmSize: Number,
      cropTypes: [String],
      bankAccount: {
        accountNumber: String,
        ifscCode: String,
      },
    },

    // Status
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },

    // Security
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, default: null, select: false },
    lastLogin: Date,
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry }
  );
  return token;
};

userSchema.methods.isAccountLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isAccountLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) };
  }

  return await this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function () {
  return await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    username: this.username,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phoneNumber: this.phoneNumber,
    role: this.role,
    profileImage: this.profileImage,
    address: this.address,
    roleData: this.roleData,
    isVerified: this.isVerified,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
