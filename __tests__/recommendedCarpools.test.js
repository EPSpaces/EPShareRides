const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock the authentication middleware to simply attach a test email
jest.mock('../utils/authUtils', () => ({
  authenticateToken: (req, res, next) => {
    req.email = 'test@example.com';
    next();
  }
}));

const apiRoutes = require('../routes/apiRoutes');
const Carpool = require('../schemas/Carpool.model');
const UserSettings = require('../schemas/UserSettings.model');

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

beforeEach(async () => {
  app = express();
  app.use(express.json());
  app.use('/api', apiRoutes);
  await Carpool.deleteMany({});
  await UserSettings.deleteMany({});
});

test('returns recommended carpools based on user interests', async () => {
  await UserSettings.create({ userEmail: 'test@example.com', interests: ['sports', 'academic'] });

  await Carpool.create([
    { seats: 3, userEmail: 'other@example.com', category: 'sports' },
    { seats: 3, userEmail: 'other@example.com', category: 'academic' },
    { seats: 3, userEmail: 'other@example.com', category: 'social' },
    { seats: 3, userEmail: 'test@example.com', category: 'sports' },
    { seats: 3, userEmail: 'other@example.com', category: 'sports', carpoolers: [{ email: 'test@example.com' }] }
  ]);

  const res = await request(app).get('/api/recommended-carpools');
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);

  const categories = res.body.map(c => c.category);
  expect(categories).not.toContain('social');
  // Should only return sports and academic carpools not owned or joined by the user
  expect(categories).toEqual(expect.arrayContaining(['sports', 'academic']));
  expect(categories.length).toBe(2);
});

test('returns empty array when user has no interests set', async () => {
  await UserSettings.create({ userEmail: 'test@example.com', interests: [] });

  await Carpool.create({ seats: 3, userEmail: 'other@example.com', category: 'sports' });

  const res = await request(app).get('/api/recommended-carpools');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual([]);
});
