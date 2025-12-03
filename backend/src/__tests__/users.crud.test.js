process.env.NODE_ENV = 'test';
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

describe('用户 CRUD 测试', () => {
  let token;
  let createdId;

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

  test('创建用户', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: `u_${Date.now()}`, password: 'p123456' });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
    createdId = res.body.data.user.id;
  });

  test('更新用户', async () => {
    const res = await request(app)
      .put(`/api/users/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ real_name: '更新' });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
  });

  test('删除用户', async () => {
    const res = await request(app)
      .delete(`/api/users/${createdId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
  });
});
