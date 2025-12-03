const { Role } = require('../models');

/**
 * 查询角色
 * @param {object} opts Sequelize 查询选项
 * @returns {Promise<any[]>}
 */
async function findAll(opts) {
  return Role.findAll(opts);
}
/**
 * 主键查询角色
 * @param {number|string} id 角色ID
 * @param {object} [opts] Sequelize 查询选项
 * @returns {Promise<any|null>}
 */
async function findByPk(id, opts) {
  return Role.findByPk(id, opts);
}
/**
 * 查询单个角色
 * @param {object} opts Sequelize 查询选项
 * @returns {Promise<any|null>}
 */
async function findOne(opts) {
  return Role.findOne(opts);
}
/**
 * 创建角色
 * @param {object} data 角色数据
 * @returns {Promise<any>}
 */
async function create(data) {
  return Role.create(data);
}
/**
 * 更新角色
 * @param {any} row 角色行
 * @param {object} data 更新数据
 * @returns {Promise<any>}
 */
async function update(row, data) {
  return row.update(data);
}
/**
 * 删除角色
 * @param {any} row 角色行
 * @returns {Promise<void>}
 */
async function destroy(row) {
  return row.destroy();
}

module.exports = {
  findAll,
  findByPk,
  findOne,
  create,
  update,
  destroy
};
