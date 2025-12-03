const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoleMenu = sequelize.define(
  'RoleMenu',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, comment: '主键ID' },
    role_id: { type: DataTypes.INTEGER, allowNull: false, comment: '角色ID' },
    menu_id: { type: DataTypes.INTEGER, allowNull: false, comment: '菜单ID' }
  },
  {
    tableName: 'role_menu',
    updatedAt: false,
    createdAt: 'created_at',
    comment: '角色-菜单关联表'
  }
);

module.exports = RoleMenu;
