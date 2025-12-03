const repo = require('../repositories/RoleRepository');

/**
 * 创建角色
 * @param {object} payload 角色数据
 * @param {string} payload.role_code 编码
 * @param {string} payload.role_name 名称
 * @returns {Promise<{role?: any, error?: string}>}
 */
async function createRole(payload) {
  const { role_code, role_name } = payload;
  const exists =
    (await repo.findOne({ where: { role_code } })) ||
    (await repo.findOne({ where: { role_name } }));
  if (exists) {
    return { error: '角色编码或名称已存在' };
  }
  const role = await repo.create(payload);
  return { role };
}

/**
 * 更新角色
 * @param {number|string} id 角色ID
 * @param {object} payload 更新数据
 * @returns {Promise<{role?: any, error?: string}>}
 */
async function updateRole(id, payload) {
  const role = await repo.findByPk(id);
  if (!role) {
    return { error: '角色不存在' };
  }
  await repo.update(role, payload);
  return { role };
}

/**
 * 删除角色
 * @param {number|string} id 角色ID
 * @returns {Promise<{success?: boolean, error?: string}>}
 */
async function deleteRole(id) {
  const role = await repo.findByPk(id);
  if (!role) {
    return { error: '角色不存在' };
  }
  await repo.destroy(role);
  return { success: true };
}

module.exports = { createRole, updateRole, deleteRole };
