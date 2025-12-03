const { Menu, Role } = require('../models');

/**
 * 查询所有菜单
 * @param {object} [opts] Sequelize 查询选项
 * @returns {Promise<any[]>}
 */
async function findAll(opts) {
  return Menu.findAll(opts);
}
/**
 * 按主键查询菜单
 * @param {number|string} id 菜单ID
 * @param {object} [opts] Sequelize 查询选项
 * @returns {Promise<any|null>}
 */
async function findByPk(id, opts) {
  return Menu.findByPk(id, opts);
}
/**
 * 查询单个菜单
 * @param {object} opts Sequelize 查询选项
 * @returns {Promise<any|null>}
 */
async function findOne(opts) {
  return Menu.findOne(opts);
}
/**
 * 创建菜单
 * @param {object} data 菜单数据
 * @returns {Promise<any>}
 */
async function create(data) {
  return Menu.create(data);
}
/**
 * 更新菜单
 * @param {any} row 菜单行
 * @param {object} data 更新数据
 * @returns {Promise<any>}
 */
async function update(row, data) {
  return row.update(data);
}
/**
 * 删除菜单行
 * @param {any} row 菜单行
 * @returns {Promise<void>}
 */
async function destroy(row) {
  return row.destroy();
}
/**
 * 查询子菜单
 * @param {number|string} parentId 父菜单ID
 * @returns {Promise<any[]>}
 */
async function findChildren(parentId) {
  return Menu.findAll({ where: { parent_id: parentId } });
}

/**
 * 通过角色编码查询角色
 * @param {string} role_code 角色编码
 * @returns {Promise<any|null>}
 */
async function getRoleByCode(role_code) {
  return Role.findOne({ where: { role_code } });
}
/**
 * 保存角色菜单键集合
 * @param {any} role 角色行
 * @param {string[]} keys 菜单键集合
 * @returns {Promise<any>}
 */
async function saveRoleMenuKeys(role, keys) {
  role.menu_keys = JSON.stringify(keys);
  return role.save();
}

module.exports = {
  findAll,
  findByPk,
  findOne,
  create,
  update,
  destroy,
  findChildren,
  getRoleByCode,
  saveRoleMenuKeys
};
