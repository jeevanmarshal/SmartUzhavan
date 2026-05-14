const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  startTime: {
    type: String, // format "HH:MM"
    required: true,
  },
  endTime: {
    type: String, // format "HH:MM"
    required: true,
  },
  duration: {
    type: Number, // hours (e.g., 2.5)
    required: true,
    min: 0,
  }
});

const dieselSchema = new mongoose.Schema({
  mode: {
    type: String,
    enum: ['none', 'litres', 'rupees'],
    default: 'none'
  },
  value: {
    type: Number,
    default: 0,
    min: 0
  },
  pricePerLitre: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCost: {
    type: Number,
    default: 0,
    min: 0
  }
});

const driverLogSchema = new mongoose.Schema({
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: [true, 'Driver ID is required'],
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  sessions: [sessionSchema],
  totalDuration: {
    type: Number,
    default: 0,
    min: 0
  },
  diesel: {
    type: dieselSchema,
    default: () => ({})
  },
  linkedJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HarvesterJob',
  },
  status: {
    type: String,
    enum: ['submitted', 'approved', 'paid'],
    default: 'submitted',
  },
  // Salary specific fields
  baseSalary: { type: Number, default: 0, min: 0 },
  bonus: { type: Number, default: 0, min: 0 },
  extraAmount: { type: Number, default: 0, min: 0 },
  advance: { type: Number, default: 0, min: 0 },
  payments: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    method: { type: String, default: 'cash' }
  }],
  notes: {
    type: String,
    trim: true
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

// Pre-save calculation for total duration and diesel cost
driverLogSchema.pre('save', function(next) {
  // Sum sessions duration
  if (this.sessions && this.sessions.length > 0) {
    this.totalDuration = this.sessions.reduce((sum, s) => sum + s.duration, 0);
  } else {
    this.totalDuration = 0;
  }

  // Calculate diesel cost
  if (this.diesel) {
    if (this.diesel.mode === 'litres' && this.diesel.value && this.diesel.pricePerLitre) {
      this.diesel.totalCost = this.diesel.value * this.diesel.pricePerLitre;
    } else if (this.diesel.mode === 'rupees' && this.diesel.value) {
      this.diesel.totalCost = this.diesel.value;
      // Optionally calculate litres if price is provided
      if (this.diesel.pricePerLitre > 0 && !this.diesel.value_litres) {
        // Just for reference, not stored unless added to schema
      }
    } else {
      this.diesel.totalCost = 0;
    }
  }

  next();
});

// Indexes
driverLogSchema.index({ driver_id: 1, date: -1 });
driverLogSchema.index({ date: 1 });
driverLogSchema.index({ linkedJobId: 1 });
driverLogSchema.index({ status: 1 });

const DriverLog = mongoose.model('DriverLog', driverLogSchema);

module.exports = DriverLog;
