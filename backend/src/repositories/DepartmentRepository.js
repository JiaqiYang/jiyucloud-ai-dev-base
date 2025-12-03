const { Department } = require('../models');

/**
 * 分页查询部门
 * @param {object} opts Sequelize 查询选项
 * @returns {Promise<{rows:any[],count:number}>}
 */
async function findAndCount(opts) {
  return Department.findAndCountAll(opts);
}
/**
 * 查询所有部门
 * @param {object} opts Sequelize 查询选项
 * @returns {Promise<any[]>}
 */
async function findAll(opts) {
  return Department.findAll(opts);
}
/**
 * 主键查询部门
 * @param {number|string} id 部门ID
 * @param {object} [opts] Sequelize 查询选项
 * @returns {Promise<any|null>}
 */
async function findByPk(id, opts) {
  return Department.findByPk(id, opts);
}
/**
 * 查询单个部门
 * @param {object} opts Sequelize 查询选项
 * @returns {Promise<any|null>}
 */
async function findOne(opts) {
  return Department.findOne(opts);
}
/**
 * 创建部门
 * @param {object} data 部门数据
 * @returns {Promise<any>}
 */
async function create(data) {
  return Department.create(data);
}
/**
 * 更新部门
 * @param {any} row 部门行
 * @param {object} data 更新数据
 * @returns {Promise<any>}
 */
async function update(row, data) {
  return row.update(data);
}
/**
 * 删除部门
 * @param {any} row 部门行
 * @returns {Promise<void>}
 */
async function destroy(row) {
  return row.destroy();
}

module.exports = { findAndCount, findAll, findByPk, findOne, create, update, destroy };
