/**
 * 系统日志模型
 * 字段：user_id、action、module、description、ip_address、user_agent、ip_location、created_at
 * 说明：记录系统操作行为，用户可为空（匿名行为）。
 */
const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const SystemLog = sequelize.define(
  'SystemLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      comment: '操作用户ID'
    },
    action: {
      type: DataTypes.STRING(50),
      comment: '操作动作'
    },
    module: {
      type: DataTypes.STRING(50),
      comment: '所属模块'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '操作描述'
    },
    ip_address: {
      type: DataTypes.STRING(50),
      comment: 'IP地址'
    },
    user_agent: {
      type: DataTypes.STRING(255),
      comment: 'User Agent'
    },
    ip_location: {
      type: DataTypes.STRING(255),
      comment: 'IP所在地'
    }
  },
  {
    tableName: 'system_logs',
    updatedAt: false,
    createdAt: 'created_at',
    comment: '系统日志表'
  }
);

module.exports = SystemLog;
