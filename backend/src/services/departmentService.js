const repo = require('../repositories/DepartmentRepository');

/**
 * 创建部门
 * @param {object} payload 部门数据
 * @param {string} payload.name 名称
 * @param {string} payload.code 编码
 * @param {number} [payload.parent_id] 父ID
 * @param {string} [payload.status] 状态
 * @returns {Promise<{department?: any, error?: string}>}
 */
async function createDepartment(payload) {
  const { code } = payload;
  const exists = await repo.findOne({ where: { code } });
  if (exists) {
    return { error: '部门编码已存在' };
  }
  const row = await repo.create({ ...payload, parent_id: payload.parent_id || null });
  return { department: row };
}

/**
 * 更新部门
 * @param {number|string} id 部门ID
 * @param {object} payload 更新数据
 * @returns {Promise<{department?: any, error?: string}>}
 */
async function updateDepartment(id, payload) {
  const row = await repo.findByPk(id);
  if (!row) {
    return { error: '部门不存在' };
  }
  if (payload.code && payload.code !== row.code) {
    const exists = await repo.findOne({ where: { code: payload.code } });
    if (exists) {
      return { error: '部门编码已存在' };
    }
  }
  await repo.update(row, {
    name: payload.name !== undefined ? payload.name : row.name,
    code: payload.code !== undefined ? payload.code : row.code,
    parent_id: payload.parent_id !== undefined ? payload.parent_id || null : row.parent_id,
    status: payload.status !== undefined ? payload.status : row.status
  });
  return { department: row };
}

/**
 * 删除部门
 * @param {number|string} id 部门ID
 * @returns {Promise<{success?: boolean, error?: string}>}
 */
async function deleteDepartment(id) {
  const row = await repo.findByPk(id);
  if (!row) {
    return { error: '部门不存在' };
  }
  await repo.destroy(row);
  return { success: true };
}

/**
 * 变更部门状态
 * @param {number|string} id 部门ID
 * @param {string} status 新状态
 * @returns {Promise<{department?: any, error?: string}>}
 */
async function changeStatus(id, status) {
  const row = await repo.findByPk(id);
  if (!row) {
    return { error: '部门不存在' };
  }
  if (!status) {
    return { error: '缺少状态参数' };
  }
  await repo.update(row, { status });
  return { department: row };
}

module.exports = { createDepartment, updateDepartment, deleteDepartment, changeStatus };
