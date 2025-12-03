/**
 * 角色模型
 * 字段：角色名称、编码、描述、状态、菜单键集合（JSON 字符串）
 * 说明：与 `User`、`Permission` 关联；`menu_keys` 用于前端菜单可见性计算。
 */
const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const Role = sequelize.define(
  'Role',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '主键ID'
    },
    role_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '角色名称'
    },
    role_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '角色编码'
    },
    description: {
      type: DataTypes.STRING(255),
      comment: '描述'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
      comment: '状态'
    },
    menu_keys: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      comment: '菜单键集合(JSON)'
    }
  },
  {
    tableName: 'roles',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '角色表'
  }
);

module.exports = Role;
