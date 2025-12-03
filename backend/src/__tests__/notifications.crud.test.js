process.env.NODE_ENV = 'test';
const request = require('supertest');
const express = require('express');

const authRoutes = require('../routes/auth');
const notifRoutes = require('../routes/notifications');
const { sequelize } = require('../models');
const { resetAttempts } = require('../middlewares/loginAttemptMiddleware');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notifRoutes);

describe('通知 CRUD 测试', () => {
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

  test('创建通知', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 't', content: 'c' });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
    createdId = res.body.data.id;
  });

  test('更新通知', async () => {
    const res = await request(app)
      .put(`/api/notifications/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'published' });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
  });

  test('删除通知', async () => {
    const res = await request(app)
      .delete(`/api/notifications/${createdId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
  });
});
