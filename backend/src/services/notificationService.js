const repo = require('../repositories/SystemNotificationRepository');

/**
 * 创建系统通知
 * @param {object} payload 通知数据
 * @param {string} payload.title 标题
 * @param {string} payload.content 内容
 * @param {string} [payload.priority] 优先级
 * @param {string} [payload.status] 状态
 * @param {string} [payload.start_time]
 * @param {string} [payload.end_time]
 * @param {number[]} [payload.department_ids]
 * @returns {Promise<{notification?: any}>}
 */
async function createNotification(payload) {
  const d = Array.isArray(payload.department_ids)
    ? payload.department_ids.map(x => Number(x)).filter(x => x > 0)
    : [];
  const row = await repo.create({
    title: payload.title,
    content: payload.content,
    priority: payload.priority || 'normal',
    status: payload.status || 'draft',
    start_time: payload.start_time || null,
    end_time: payload.end_time || null,
    created_by: payload.created_by || null,
    department_ids: JSON.stringify(d)
  });
  return { notification: row };
}

/**
 * 更新系统通知
 * @param {number|string} id 通知ID
 * @param {object} payload 更新数据
 * @returns {Promise<{notification?: any, error?: string}>}
 */
async function updateNotification(id, payload) {
  const row = await repo.findByPk(id);
  if (!row) {
    return { error: '未找到通知' };
  }
  let department_ids = row.department_ids;
  const d = payload.department_ids;
  if (Array.isArray(d)) {
    department_ids = JSON.stringify(d.map(x => Number(x)).filter(x => x > 0));
  }
  await repo.update(row, {
    title: payload.title !== undefined ? payload.title : row.title,
    content: payload.content !== undefined ? payload.content : row.content,
    priority: payload.priority !== undefined ? payload.priority : row.priority,
    status: payload.status !== undefined ? payload.status : row.status,
    start_time: payload.start_time !== undefined ? payload.start_time : row.start_time,
    end_time: payload.end_time !== undefined ? payload.end_time : row.end_time,
    department_ids
  });
  return { notification: row };
}

/**
 * 删除系统通知
 * @param {number|string} id 通知ID
 * @returns {Promise<{success?: boolean, error?: string}>}
 */
async function deleteNotification(id) {
  const row = await repo.findByPk(id);
  if (!row) {
    return { error: '未找到通知' };
  }
  await repo.destroy(row);
  return { success: true };
}

/**
 * 批量删除系统通知
 * @param {number[]} ids 通知ID列表
 * @returns {Promise<{success?: boolean, deleted?: number, error?: string}>}
 */
async function batchDelete(ids) {
  const list = Array.isArray(ids) ? ids : [];
  if (!list.length) {
    return { error: '缺少待删除ID列表' };
  }
  await repo.destroyByIds(list);
  return { success: true, deleted: list.length };
}

module.exports = { createNotification, updateNotification, deleteNotification, batchDelete };
