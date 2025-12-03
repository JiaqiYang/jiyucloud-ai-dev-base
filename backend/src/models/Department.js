/**
 * 部门模型
 * 字段：name、code、parent_id、status
 * 说明：支持自引用（父子部门），与 `User` 关联为一对多。
 */
const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const Department = sequelize.define(
  'Department',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, comment: '主键ID' },
    name: { type: DataTypes.STRING(100), allowNull: false, comment: '部门名称' },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: '部门编码' },
    parent_id: { type: DataTypes.INTEGER, allowNull: true, comment: '父部门ID' },
    status: { type: DataTypes.STRING(20), defaultValue: 'active', comment: '状态' }
  },
  {
    tableName: 'departments',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '部门表'
  }
);

module.exports = Department;
