process.env.NODE_ENV = 'test'
const request = require('supertest')
const express = require('express')

const authRoutes = require('../routes/auth')
const menuRoutes = require('../routes/menus')
const menuController = require('../controllers/menuController')
const { sequelize } = require('../models')
const { resetAttempts } = require('../middlewares/loginAttemptMiddleware')

const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/menus', menuRoutes)
// 公开端点（免登录）
app.get('/api/public/menus/definitions', menuController.definitions)

describe('菜单 CRUD 与树接口 测试', () => {
  let token
  let createdId
  let createdKey

  beforeAll(async () => {
    await sequelize.authenticate()
    resetAttempts('admin')
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
    token = res.body.token
  })

  afterAll(async () => {
    await sequelize.close()
  })

  test('创建菜单', async () => {
    createdKey = `m_${Date.now()}`
    const res = await request(app)
      .post('/api/menus')
      .set('Authorization', `Bearer ${token}`)
      .send({ key: createdKey, title: '测试菜单', path: '/test/menu', type: 'menu', status: 'active' })
    expect(res.status).toBe(200)
    expect(res.body.code).toBe('OK')
    createdId = res.body.data.id || res.body.data?.row?.id || res.body.data?.user?.id
    expect(createdId).toBeDefined()
  })

  test('菜单列表', async () => {
    const res = await request(app)
      .get('/api/menus')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.code).toBe('OK')
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  test('菜单树', async () => {
    const res = await request(app)
      .get('/api/menus/tree')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.code).toBe('OK')
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  test('公开菜单定义', async () => {
    const res = await request(app)
      .get('/api/public/menus/definitions')
    expect(res.status).toBe(200)
    expect(res.body.code).toBe('OK')
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  test('更新菜单', async () => {
    const res = await request(app)
      .put(`/api/menus/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '测试菜单-更新' })
    expect(res.status).toBe(200)
    expect(res.body.code).toBe('OK')
  })

  test('删除菜单', async () => {
    const res = await request(app)
      .delete(`/api/menus/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.code).toBe('OK')
  })
})

