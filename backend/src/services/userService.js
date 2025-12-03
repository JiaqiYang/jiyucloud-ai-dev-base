const bcrypt = require('bcryptjs');

const repo = require('../repositories/UserRepository');

/**
 * 创建用户
 * @param {object} payload 用户数据
 * @param {string} payload.username 用户名
 * @param {string} payload.password 密码
 * @returns {Promise<{user?: any, error?: string}>}
 */
async function createUser(payload) {
  const { username, password } = payload;
  const existing = await repo.findOne({ where: { username } });
  if (existing) {
    return { error: '用户名已存在' };
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await repo.create({ ...payload, password: hashed });
  return { user };
}

/**
 * 更新用户
 * @param {number|string} id 用户ID
 * @param {object} payload 更新数据
 * @returns {Promise<{user?: any, error?: string}>}
 */
async function updateUser(id, payload) {
  const user = await repo.findByPk(id);
  if (!user) {
    return { error: '用户不存在' };
  }
  const data = { ...payload };
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  if (data.settings && typeof data.settings === 'object') {
    try { data.settings = JSON.stringify(data.settings) } catch {}
  }
  await repo.update(user, data);
  return { user };
}

/**
 * 删除用户
 * @param {number|string} id 用户ID
 * @returns {Promise<{success?: boolean, error?: string}>}
 */
async function deleteUser(id) {
  const user = await repo.findByPk(id, { include: ['Role'] });
  if (!user) {
    return { error: '用户不存在' };
  }
  const roleCode = user.Role ? user.Role.role_code : null;
  if (roleCode === 'super_admin' || user.username === 'admin') {
    return { error: '不可删除超级管理员' };
  }
  await repo.destroy(user);
  return { success: true };
}

module.exports = { createUser, updateUser, deleteUser };
