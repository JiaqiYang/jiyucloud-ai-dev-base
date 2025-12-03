const request = require('supertest');
const express = require('express');

const authRoutes = require('../routes/auth');
const { sequelize } = require('../models');
const { resetAttempts } = require('../middlewares/loginAttemptMiddleware');

// 创建测试应用
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('认证 API 测试', () => {

  beforeAll(async () => {
    // 确保数据库连接
    await sequelize.authenticate();
    resetAttempts('admin');
  });

  afterAll(async () => {
    // 关闭数据库连接
    await sequelize.close();
  });

  describe('POST /api/auth/login', () => {
    test('应该成功登录并返回 token', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'admin',
        password: 'admin123'
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('admin');

      // token 用于后续接口独立获取
    });

    test('应该拒绝错误的密码', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'admin',
        password: 'wrongpassword'
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('应该拒绝不存在的用户', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'nonexistent',
        password: 'password'
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    test('应该返回当前用户信息', async () => {
      // 先登录获取 token
      const loginResponse = await request(app).post('/api/auth/login').send({
        username: 'admin',
        password: 'admin123'
      });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('permissions');
      expect(response.body.user.username).toBe('admin');
    });

    test('应该拒绝没有 token 的请求', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('应该拒绝无效的 token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
process.env.NODE_ENV = 'test';
