const request = require('supertest');
const express = require('express');

const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/users');
const { sequelize } = require('../models');
const { resetAttempts } = require('../middlewares/loginAttemptMiddleware');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

describe('用户 API 测试', () => {
  let token;

  beforeAll(async () => {
    await sequelize.authenticate();
    resetAttempts('admin');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    token = res.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('GET /api/users 应该返回用户列表', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('code', 'OK');
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('list');
    expect(Array.isArray(res.body.data.list)).toBe(true);
  });
});
process.env.NODE_ENV = 'test';
