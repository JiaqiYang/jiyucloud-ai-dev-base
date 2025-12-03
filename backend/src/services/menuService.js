const repo = require('../repositories/MenuRepository');

/**
 * 判断是否管理员
 * @param {import('express').Request} req 请求对象
 * @returns {boolean}
 */
function isAdmin(req) {
  const roleCode = (req.user && (req.user.Role?.role_code || req.user.role)) || '';
  return String(roleCode).includes('admin');
}

/**
 * 获取全部菜单（按排序）
 * @returns {Promise<{rows: any[]}>}
 */
async function listAll() {
  const rows = await repo.findAll({
    order: [
      ['order_no', 'ASC'],
      ['id', 'ASC']
    ]
  });
  return { rows };
}

/**
 * 创建菜单（仅管理员）
 * @param {import('express').Request} req 请求对象
 * @param {object} payload 菜单数据
 * @param {string} payload.key 菜单键
 * @param {string} payload.title 菜单标题
 * @param {string} payload.path 菜单路由路径
 * @param {number} [payload.parent_id] 父菜单ID
 * @param {('dir'|'menu'|'button')} [payload.type='menu'] 菜单类型
 * @param {string} [payload.permission_code] 权限编码（按钮）
 * @param {string} [payload.icon] 图标
 * @param {number} [payload.order_no] 排序号
 * @param {string} [payload.status] 状态
 * @returns {Promise<{row?: any, error?: string}>}
 */
async function createMenu(req, payload) {
  if (!isAdmin(req)) {
    return { error: '需要管理员权限' };
  }
  const {
    key,
    title,
    path,
    parent_id,
    type = 'menu',
    permission_code,
    icon,
    order_no,
    status
  } = payload;
  const existed = await repo.findOne({ where: { key } });
  if (existed) {
    return { error: '菜单key已存在' };
  }
  const row = await repo.create({
    key,
    title,
    path,
    parent_id,
    type,
    permission_code,
    icon,
    order_no,
    status
  });
  // 权限系统已移除
  return { row };
}

/**
 * 更新菜单（仅管理员）
 * @param {import('express').Request} req 请求对象
 * @param {number|string} id 菜单ID
 * @param {object} payload 更新字段
 * @returns {Promise<{row?: any, error?: string}>}
 */
async function updateMenu(req, id, payload) {
  if (!isAdmin(req)) {
    return { error: '需要管理员权限' };
  }
  const row = await repo.findByPk(id);
  if (!row) {
    return { error: '未找到菜单' };
  }
  const { title, path, parent_id, type, permission_code, icon, order_no, status } = payload;
  await repo.update(row, { title, path, parent_id, type, permission_code, icon, order_no, status });
  // 权限系统已移除
  return { row };
}

/**
 * 删除菜单（含子菜单，仅管理员）
 * @param {import('express').Request} req 请求对象
 * @param {number|string} id 菜单ID
 * @returns {Promise<{success?: boolean, error?: string}>}
 */
async function deleteMenu(req, id) {
  if (!isAdmin(req)) {
    return { error: '需要管理员权限' };
  }
  const row = await repo.findByPk(id);
  if (!row) {
    return { error: '未找到菜单' };
  }
  const children = await repo.findChildren(id);
  for (const c of children) {
    await repo.destroy(c);
  }
  await repo.destroy(row);
  return { success: true };
}

/**
 * 构建菜单树
 * @returns {Promise<{tree: any[]}>}
 */
async function getTree() {
  const rows = await repo.findAll({
    order: [
      ['order_no', 'ASC'],
      ['id', 'ASC']
    ]
  });
  const byId = new Map(rows.map(r => [r.id, { ...r.toJSON(), children: [] }]));
  const tree = [];
  for (const r of byId.values()) {
    if (r.parent_id && byId.has(r.parent_id)) {
      byId.get(r.parent_id).children.push(r);
    } else {
      tree.push(r);
    }
  }
  return { tree };
}

/**
 * 计算角色可见的一级菜单
 * @param {import('express').Request} req 请求对象
 * @returns {Promise<{top: {key:string,title:string,type:string,icon?:string}[]}>}
 */
async function enabledTop(req) {
  const role = req.user && req.user.Role ? req.user.Role : null;
  let keys = role ? JSON.parse(role.menu_keys || '[]') : [];
  const all = await repo.findAll({
    where: { status: 'active' },
    order: [
      ['order_no', 'ASC'],
      ['id', 'ASC']
    ]
  });
  const isAdminUser = isAdmin(req);
  if (isAdminUser && (!Array.isArray(keys) || keys.length === 0)) {
    keys = all.filter(r => r.type === 'menu').map(r => r.key);
    if (!keys.includes('dashboard')) {
      keys.push('dashboard');
    }
  }
  const dirs = all.filter(r => r.type === 'dir');
  const top = [];
  const dashboard = all.find(r => r.key === 'dashboard');
  if (dashboard && keys.includes('dashboard')) {
    top.push({ key: dashboard.key, title: dashboard.title, type: 'menu', icon: dashboard.icon });
  }
  for (const d of dirs) {
    const children = all.filter(r => r.parent_id === d.id && r.type === 'menu');
    const anyEnabled = children.some(c => keys.includes(c.key));
    if (anyEnabled) {
      top.push({ key: d.key, title: d.title, type: 'dir', icon: d.icon });
    }
  }
  return { top };
}

/**
 * 计算目录下角色可见的二级菜单
 * @param {import('express').Request} req 请求对象
 * @param {string} parentKey 目录键
 * @returns {Promise<{list: {key:string,title:string,path:string,parent_key:string,component?:string,icon?:string}[]}>}
 */
async function enabledChildren(req, parentKey) {
  const role = req.user && req.user.Role ? req.user.Role : null;
  const keys = role ? JSON.parse(role.menu_keys || '[]') : [];
  const parent = await repo.findOne({ where: { key: parentKey, type: 'dir' } });
  if (!parent) {
    return { list: [] };
  }
  const children = await repo.findAll({
    where: { parent_id: parent.id, type: 'menu', status: 'active' },
    order: [
      ['order_no', 'ASC'],
      ['id', 'ASC']
    ]
  });
  const list = children
    .filter(c => keys.includes(c.key))
    .map(c => ({
      key: c.key,
      title: c.title,
      path: c.path,
      parent_key: parentKey,
      component: c.component,
      icon: c.icon
    }));
  return { list };
}

/**
 * 获取角色菜单配置
 * @param {string} roleCode 角色编码
 * @returns {Promise<{role_code:string, keys:string[]}>}
 */
async function getRoleConfig(roleCode) {
  const role = await repo.getRoleByCode(roleCode);
  const keys = role ? JSON.parse(role.menu_keys || '[]') : [];
  return { role_code: roleCode, keys };
}

/**
 * 保存角色菜单配置（仅管理员）
 * @param {import('express').Request} req 请求对象
 * @param {string} roleCode 角色编码
 * @param {string[]} keys 菜单键集合
 * @returns {Promise<{role_code?:string, keys?:string[], error?:string}>}
 */
async function setRoleConfig(req, roleCode, keys) {
  if (!isAdmin(req)) {
    return { error: '需要管理员权限' };
  }
  const safeKeys = Array.isArray(keys) ? keys.filter(k => typeof k === 'string') : [];
  const role = await repo.getRoleByCode(roleCode);
  if (!role) {
    return { error: '角色不存在' };
  }
  await repo.saveRoleMenuKeys(role, safeKeys);
  return { role_code: roleCode, keys: safeKeys };
}

module.exports = {
  listAll,
  createMenu,
  updateMenu,
  deleteMenu,
  getTree,
  enabledTop,
  enabledChildren,
  getRoleConfig,
  setRoleConfig
};
