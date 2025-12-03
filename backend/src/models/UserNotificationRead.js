/**
 * 用户通知已读记录模型
 * 字段：
 * - id: 主键
 * - user_id: 用户ID
 * - notification_id: 通知ID
 * 说明：同一用户-通知对唯一（联合唯一索引），用于统计未读与已读状态。
 */
const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const UserNotificationRead = sequelize.define(
  'UserNotificationRead',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, comment: '主键ID' },
    user_id: { type: DataTypes.INTEGER, allowNull: false, comment: '用户ID' },
    notification_id: { type: DataTypes.INTEGER, allowNull: false, comment: '通知ID' }
  },
  {
    tableName: 'user_notification_reads',
    createdAt: 'created_at',
    updatedAt: false,
    comment: '用户通知已读表',
    indexes: [{ fields: ['user_id', 'notification_id'], unique: true }]
  }
);

module.exports = UserNotificationRead;
