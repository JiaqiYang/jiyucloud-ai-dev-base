const controller = require('../src/controllers/systemNotificationController');
const { SystemNotification, sequelize } = require('../src/models');

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
}

beforeAll(async () => {
  await sequelize.sync();
  await SystemNotification.destroy({ where: {} });
  await SystemNotification.bulkCreate([
    { title: '测试1', content: '内容1', status: 'draft', priority: 'normal', receiver_type: 'all' },
    { title: '测试2', content: '内容2', status: 'published', priority: 'high', receiver_type: 'admins' }
  ]);
});

afterAll(async () => {
  await sequelize.close();
});

test('list returns notifications', async () => {
  const req = { query: { page: 1, pageSize: 10 } };
  const res = mockRes();
  await controller.list(req, res);
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body.list)).toBe(true);
  expect(typeof res.body.total).toBe('number');
});

test('create adds new notification', async () => {
  const req = { body: { title: '新增', content: '新增内容', status: 'draft', priority: 'low', receiver_type: 'users' }, user: { id: 1 } };
  const res = mockRes();
  await controller.create(req, res);
  expect(res.statusCode).toBe(200);
  expect(res.body.id).toBeTruthy();
  const found = await SystemNotification.findByPk(res.body.id);
  expect(found.title).toBe('新增');
});
