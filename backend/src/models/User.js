/**
 * 用户模型
 * 字段：用户名、密码Hash、真实姓名、角色ID、联系方式、部门ID与名称、头像、状态、最后登录时间
 * 说明：与 `Role`、`Department`、`SystemLog` 存在关联；`status` 默认为 `active`。
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '主键ID'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '用户名'
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '密码(Hash)'
    },
    real_name: {
      type: DataTypes.STRING(50),
      comment: '真实姓名'
    },
    role_id: {
      type: DataTypes.INTEGER,
      comment: '角色ID'
    },
    phone: {
      type: DataTypes.STRING(20),
      comment: '电话'
    },
    email: {
      type: DataTypes.STRING(100),
      comment: '邮箱'
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '部门ID'
    },
    department: {
      type: DataTypes.STRING(50),
      comment: '部门'
    },
    avatar: {
      type: DataTypes.STRING(255),
      comment: '头像URL'
    },
    settings: {
      type: DataTypes.TEXT,
      comment: '用户设置(JSON字符串)'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
      comment: '状态: active/inactive'
    },
    last_login: {
      type: DataTypes.DATE,
      comment: '最后登录时间'
    }
  },
  {
    tableName: 'users',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '用户表'
  }
);

module.exports = User;
