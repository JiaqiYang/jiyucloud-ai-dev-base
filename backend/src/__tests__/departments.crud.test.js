process.env.NODE_ENV = 'test';
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

describe('部门 CRUD 测试', () => {
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

  test('创建部门', async () => {
    const res = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '测试部门', code: `dept_${Date.now()}` });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
    createdId = res.body.data.id;
  });

  test('更新部门', async () => {
    const res = await request(app)
      .put(`/api/departments/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '测试部门2' });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
  });

  test('变更部门状态', async () => {
    const res = await request(app)
      .put(`/api/departments/${createdId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'inactive' });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
  });

  test('删除部门', async () => {
    const res = await request(app)
      .delete(`/api/departments/${createdId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
  });
});
