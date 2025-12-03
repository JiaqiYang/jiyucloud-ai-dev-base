const { User } = require('../models');

/**
 * 分页查询用户
 * @param {object} opts Sequelize 查询选项
 * @returns {Promise<{rows:any[],count:number}>}
 */
async function findAndCount(opts) {
  return User.findAndCountAll(opts);
}
/**
 * 查询所有用户
 * @param {object} opts Sequelize 查询选项
 * @returns {Promise<any[]>}
 */
async function findAll(opts) {
  return User.findAll(opts);
}
/**
 * 主键查询用户
 * @param {number|string} id 用户ID
 * @param {object} [opts] Sequelize 查询选项
 * @returns {Promise<any|null>}
 */
async function findByPk(id, opts) {
  return User.findByPk(id, opts);
}
/**
 * 查询单个用户
 * @param {object} opts Sequelize 查询选项
 * @returns {Promise<any|null>}
 */
async function findOne(opts) {
  return User.findOne(opts);
}
/**
 * 创建用户
 * @param {object} data 用户数据
 * @returns {Promise<any>}
 */
async function create(data) {
  return User.create(data);
}
/**
 * 更新用户
 * @param {any} row 用户行
 * @param {object} data 更新数据
 * @returns {Promise<any>}
 */
async function update(row, data) {
  return row.update(data);
}
/**
 * 删除用户
 * @param {any} row 用户行
 * @returns {Promise<void>}
 */
async function destroy(row) {
  return row.destroy();
}

module.exports = { findAndCount, findAll, findByPk, findOne, create, update, destroy };
