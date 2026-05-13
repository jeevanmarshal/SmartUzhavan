const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Driver name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^\+?[0-9]{10,14}$/, 'Please provide a valid phone number'],
  },
  village: {
    type: String,
    required: [true, 'Village is required'],
    trim: true,
  },
  pin: {
    type: String,
    required: [true, 'PIN is required'],
    match: [/^[0-9]{4,6}$/, 'PIN must be 4-6 digits'],
  },
  baseRate: {
    type: Number,
    required: [true, 'Base rate is required'],
    min: [0, 'Base rate cannot be negative'],
    default: 0,
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true
});

// Indexes
driverSchema.index({ phone: 1 }, { unique: true });
driverSchema.index({ village: 1 });
driverSchema.index({ active: 1 });

// Pre-save hook to hash the PIN
driverSchema.pre('save', async function(next) {
  if (!this.isModified('pin')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to verify PIN
driverSchema.methods.verifyPIN = async function(enteredPin) {
  return await bcrypt.compare(enteredPin, this.pin);
};

// Remove PIN and internal fields from API responses
driverSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.pin;
  delete obj.__v;
  return obj;
};

const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver;
