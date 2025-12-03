const request = require('supertest');
const express = require('express');

const authRoutes = require('../routes/auth');
const deptRoutes = require('../routes/departments');
const { sequelize } = require('../models');
const { resetAttempts } = require('../middlewares/loginAttemptMiddleware');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/departments', deptRoutes);

describe('部门 API 测试', () => {
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

  test('GET /api/departments/tree 应该返回部门树', async () => {
    const res = await request(app)
      .get('/api/departments/tree')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('code', 'OK');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
process.env.NODE_ENV = 'test';
