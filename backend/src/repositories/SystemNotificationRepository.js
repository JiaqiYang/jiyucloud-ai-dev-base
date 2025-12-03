const { SystemNotification } = require('../models');

/**
 * 分页查询系统通知
 * @param {object} opts Sequelize 查询选项
 * @returns {Promise<{rows:any[],count:number}>}
 */
async function findAndCount(opts) {
  return SystemNotification.findAndCountAll(opts);
}
/**
 * 查询所有系统通知
 * @param {object} opts Sequelize 查询选项
 * @returns {Promise<any[]>}
 */
async function findAll(opts) {
  return SystemNotification.findAll(opts);
}
/**
 * 主键查询系统通知
 * @param {number|string} id 通知ID
 * @param {object} [opts] Sequelize 查询选项
 * @returns {Promise<any|null>}
 */
async function findByPk(id, opts) {
  return SystemNotification.findByPk(id, opts);
}
/**
 * 创建系统通知
 * @param {object} data 通知数据
 * @returns {Promise<any>}
 */
async function create(data) {
  return SystemNotification.create(data);
}
/**
 * 更新系统通知
 * @param {any} row 通知行
 * @param {object} data 更新数据
 * @returns {Promise<any>}
 */
async function update(row, data) {
  return row.update(data);
}
/**
 * 删除系统通知
 * @param {any} row 通知行
 * @returns {Promise<void>}
 */
async function destroy(row) {
  return row.destroy();
}
/**
 * 按ID列表删除系统通知
 * @param {number[]} ids 通知ID列表
 * @returns {Promise<number>} 删除条数
 */
async function destroyByIds(ids) {
  return SystemNotification.destroy({ where: { id: ids } });
}

module.exports = { findAndCount, findAll, findByPk, create, update, destroy, destroyByIds };
