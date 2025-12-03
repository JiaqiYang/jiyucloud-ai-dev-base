/**
 * 系统配置模型
 * 字段：编码、名称、数据(JSON 字符串)
 * 说明：用于存储系统级配置，如会话阈值、最大设备数等。
 */
const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const SystemConfig = sequelize.define(
  'SystemConfig',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, comment: '主键ID' },
    code: { type: DataTypes.STRING(100), allowNull: false, unique: true, comment: '配置编码' },
    name: { type: DataTypes.STRING(200), allowNull: false, comment: '配置名称' },
    data: { type: DataTypes.TEXT, allowNull: false, comment: 'JSON数据' }
  },
  {
    tableName: 'system_configs',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '系统配置表'
  }
);

module.exports = SystemConfig;
