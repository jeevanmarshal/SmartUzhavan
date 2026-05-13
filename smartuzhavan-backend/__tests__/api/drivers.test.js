const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Mock middlewares
jest.mock('../../middleware/auth', () => ({
  isAuthenticated: (req, res, next) => {
    req.session = { userId: new mongoose.Types.ObjectId() };
    next();
  },
  isSuperAdmin: (req, res, next) => next()
}));

jest.mock('../../middleware/audit', () => () => (req, res, next) => next());

// Mock models
const Driver = require('../../models/Driver');
jest.mock('../../models/Driver');
const DriverLog = require('../../models/DriverLog');
jest.mock('../../models/DriverLog');

const driversRouter = require('../../routes/drivers');

const app = express();
app.use(express.json());
app.use('/api/drivers', driversRouter);

describe('Drivers API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Create Driver', () => {
    it('should create a driver with valid data', async () => {
      Driver.findOne.mockResolvedValue(null);
      const mockSave = jest.fn().mockResolvedValue(true);
      Driver.mockImplementation(() => ({
        save: mockSave,
        toObject: () => ({ name: 'Test', phone: '9876543210', pin: 'hash' }),
        toJSON: function() { const o = this.toObject(); delete o.pin; return o; }
      }));

      const res = await request(app)
        .post('/api/drivers')
        .send({
          name: 'Test Driver',
          phone: '9876543210',
          village: 'Test Village',
          pin: '1234',
          baseRate: 50
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should reject missing name', async () => {
      const res = await request(app)
        .post('/api/drivers')
        .send({ phone: '9876543210', village: 'Test', pin: '1234', baseRate: 50 });
      expect(res.statusCode).toEqual(400);
      expect(res.body.error.details.some(e => e.path === 'name')).toBeTruthy();
    });

    it('should reject duplicate phone', async () => {
      Driver.findOne.mockResolvedValue({ id: '123' });
      const res = await request(app)
        .post('/api/drivers')
        .send({ name: 'Test', phone: '9876543210', village: 'Test', pin: '1234', baseRate: 50 });
      expect(res.statusCode).toEqual(400);
      expect(res.body.error.code).toEqual('DUPLICATE_ERROR');
    });
  });

  describe('2. List Drivers', () => {
    it('should list drivers with pagination and filters', async () => {
      Driver.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ name: 'Test Driver' }])
      });
      Driver.countDocuments.mockResolvedValue(1);

      const res = await request(app).get('/api/drivers?page=1&limit=20&village=Test');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toEqual(1);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('3. Update Driver', () => {
    it('should update baseRate', async () => {
      Driver.findOneAndUpdate.mockResolvedValue({ name: 'Test', baseRate: 60 });
      const res = await request(app).put('/api/drivers/123').send({ baseRate: 60 });
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.baseRate).toEqual(60);
    });

    it('should handle duplicate phone on update', async () => {
      Driver.findOneAndUpdate.mockRejectedValue({ code: 11000 });
      const res = await request(app).put('/api/drivers/123').send({ phone: 'existing' });
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('4. Delete Driver', () => {
    it('should soft delete driver', async () => {
      Driver.findOneAndUpdate.mockResolvedValue({ isDeleted: true });
      const res = await request(app).delete('/api/drivers/123');
      expect(res.statusCode).toEqual(200);
      expect(Driver.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '123', isDeleted: false },
        { isDeleted: true },
        { new: true }
      );
    });
  });

  describe('5. Change PIN', () => {
    it('should change PIN and return success', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      Driver.findOne.mockResolvedValue({ _id: '123', pin: 'oldHash', save: mockSave });

      const res = await request(app).post('/api/drivers/123/change-pin').send({ newPin: '5678' });
      
      expect(res.statusCode).toEqual(200);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should reject invalid PIN format', async () => {
      const res = await request(app).post('/api/drivers/123/change-pin').send({ newPin: 'abc' });
      expect(res.statusCode).toEqual(400);
    });
  });
});
