const bcrypt = require('bcryptjs');

const { sequelize, User, Role, Menu } = require('../models');

async function ensureRole(code, name, description = '') {
  const exist = await Role.findOne({ where: { role_code: code } });
  if (exist) {
    return exist;
  }
  return Role.create({ role_code: code, role_name: name, description });
}

async function createUserIfNotExists(username, password, realName, roleId) {
  const exist = await User.findOne({ where: { username } });
  if (exist) {
    return exist;
  }
  const hashed = await bcrypt.hash(password, 10);
  return User.create({
    username,
    password: hashed,
    real_name: realName,
    role_id: roleId,
    status: 'active'
  });
}

async function main() {
  try {
    console.log('准备生成测试角色与账号...');
    await sequelize.authenticate();

    const roles = {
      admin: await ensureRole('admin', '超级管理员', '系统最高权限'),
      manager: await ensureRole('manager', '墓园经理', '管理墓园日常事务'),
      operator: await ensureRole('operator', '业务操作员', '处理日常业务操作'),
      auditor: await ensureRole('auditor', '审计员', '审计与合规检查'),
      guest: await ensureRole('guest', '访客', '只读访问')
    };

    const preset = [
      { u: 'admin', p: 'admin123', n: '系统管理员', r: roles.admin.id },
      { u: 'manager01', p: 'Pass123!', n: '经理01', r: roles.manager.id },
      { u: 'operator01', p: 'Pass123!', n: '操作员01', r: roles.operator.id },
      { u: 'auditor01', p: 'Pass123!', n: '审计员01', r: roles.auditor.id },
      { u: 'guest01', p: 'Pass123!', n: '访客01', r: roles.guest.id }
    ];

    const moreUsers = [];
    const gen = (prefix, count, roleId, baseName) => {
      for (let i = 2; i <= count + 1; i++) {
        const idx = String(i).padStart(2, '0');
        moreUsers.push({ u: `${prefix}${idx}`, p: 'Pass123!', n: `${baseName}${idx}`, r: roleId });
      }
    };
    gen('manager', 4, roles.manager.id, '经理');
    gen('operator', 8, roles.operator.id, '操作员');
    gen('auditor', 4, roles.auditor.id, '审计员');
    gen('guest', 4, roles.guest.id, '访客');

    const all = [...preset, ...moreUsers];
    const created = [];
    for (const item of all) {
      const u = await createUserIfNotExists(item.u, item.p, item.n, item.r);
      created.push({ username: u.username, password: item.p, role_id: item.r });
    }

    const menus = await Menu.findAll({
      where: { status: 'active', type: 'menu' },
      order: [
        ['order_no', 'ASC'],
        ['id', 'ASC']
      ]
    });
    const allKeys = menus.map(m => m.key);
    const hasDashboard = menus.some(m => m.key === 'dashboard');
    const dashboardKeys = hasDashboard ? ['dashboard'] : [];
    const nonSystemKeys = menus
      .filter(m => {
        const p = m.path || '';
        const c = m.component || '';
        const t = m.title || '';
        return !/system/i.test(p) && !/system/i.test(c) && !/系统|角色|用户|菜单|字典/.test(t);
      })
      .map(m => m.key);
    const logsKeys = menus
      .filter(m => {
        const p = m.path || '';
        const t = m.title || '';
        return /log/i.test(p) || /日志/.test(t);
      })
      .map(m => m.key);

    await roles.admin.update({ menu_keys: JSON.stringify(allKeys) });
    const managerKeys = nonSystemKeys.length
      ? Array.from(new Set([...dashboardKeys, ...nonSystemKeys]))
      : Array.from(new Set([...dashboardKeys, ...allKeys]));
    await roles.manager.update({ menu_keys: JSON.stringify(managerKeys) });
    const operatorSubset = nonSystemKeys.length
      ? nonSystemKeys.slice(0, Math.max(1, Math.ceil(nonSystemKeys.length * 0.6)))
      : allKeys;
    await roles.operator.update({
      menu_keys: JSON.stringify(Array.from(new Set([...dashboardKeys, ...operatorSubset])))
    });
    const auditorAssigned = Array.from(new Set([...dashboardKeys, ...logsKeys]));
    await roles.auditor.update({ menu_keys: JSON.stringify(auditorAssigned) });
    const guestAssigned = dashboardKeys.length ? dashboardKeys : allKeys.length ? [allKeys[0]] : [];
    await roles.guest.update({ menu_keys: JSON.stringify(guestAssigned) });

    console.log('\n✅ 测试账号与角色生成完成');
    console.table(created.map(x => ({ 用户名: x.username, 密码: x.password, 角色ID: x.role_id })));
    console.table([
      { 角色: roles.admin.role_code, 菜单数量: allKeys.length },
      { 角色: roles.manager.role_code, 菜单数量: managerKeys.length },
      { 角色: roles.operator.role_code, 菜单数量: operatorSubset.length + dashboardKeys.length },
      { 角色: roles.auditor.role_code, 菜单数量: auditorAssigned.length },
      { 角色: roles.guest.role_code, 菜单数量: guestAssigned.length }
    ]);
    process.exit(0);
  } catch (e) {
    console.error('生成失败:', e);
    process.exit(1);
  }
}

main();
