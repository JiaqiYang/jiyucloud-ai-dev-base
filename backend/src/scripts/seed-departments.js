const dotenv = require('dotenv');

dotenv.config();
const sequelize = require('../config/database');
const { Department } = require('../models');

async function ensureTable() {
  await sequelize.authenticate();
  await Department.sync();
}

async function seed() {
  await ensureTable();
  const defs = [
    { name: '总部', code: 'HQ', status: 'active' },
    { name: '技术部', code: 'TECH', status: 'active', parent: 'HQ' },
    { name: '市场部', code: 'MKT', status: 'active', parent: 'HQ' },
    { name: '人事部', code: 'HR', status: 'inactive', parent: 'HQ' },
    { name: '财务部', code: 'FIN', status: 'inactive', parent: 'HQ' },
    { name: '后端组', code: 'TECH-BE', status: 'active', parent: 'TECH' },
    { name: '前端组', code: 'TECH-FE', status: 'inactive', parent: 'TECH' },
    { name: '测试组', code: 'TECH-QA', status: 'active', parent: 'TECH' },
    { name: '渠道组', code: 'MKT-CH', status: 'inactive', parent: 'MKT' },
    { name: '内容组', code: 'MKT-CNT', status: 'active', parent: 'MKT' }
  ];
  const map = new Map();
  const existing = await Department.findAll();
  for (const d of existing) {
    map.set(d.code, d);
  }
  const roots = defs.filter(d => !d.parent);
  for (const r of roots) {
    let row = map.get(r.code);
    if (!row) {
      row = await Department.create({ name: r.name, code: r.code, status: r.status });
      map.set(r.code, row);
    } else {
      await row.update({ name: r.name, status: r.status });
    }
  }
  const children = defs.filter(d => d.parent);
  for (const c of children) {
    const parent = map.get(c.parent);
    if (!parent) {
      continue;
    }
    let row = map.get(c.code);
    const payload = { name: c.name, code: c.code, status: c.status, parent_id: parent.id };
    if (!row) {
      row = await Department.create(payload);
      map.set(c.code, row);
    } else {
      await row.update(payload);
    }
  }
  await sequelize.close();
}

seed().catch(async e => {
  try {
    await sequelize.close();
  } catch {}
  process.exit(1);
});
