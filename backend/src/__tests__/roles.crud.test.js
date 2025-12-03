process.env.NODE_ENV = 'test';
const request = require('supertest');
const express = require('express');

const authRoutes = require('../routes/auth');
const roleRoutes = require('../routes/roles');
const { sequelize } = require('../models');
const { resetAttempts } = require('../middlewares/loginAttemptMiddleware');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);

describe('角色 CRUD 测试', () => {
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

  test('创建角色', async () => {
    const res = await request(app)
      .post('/api/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ role_name: '测试角色', role_code: `test_${Date.now()}` });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
    expect(res.body.data).toHaveProperty('id');
    createdId = res.body.data.id;
  });

  test('更新角色', async () => {
    const res = await request(app)
      .put(`/api/roles/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: '更新描述' });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
  });

  test('删除角色', async () => {
    const res = await request(app)
      .delete(`/api/roles/${createdId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
  });
});
