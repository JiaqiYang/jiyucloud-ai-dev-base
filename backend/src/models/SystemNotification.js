/**
 * 系统通知模型
 * 字段：标题、内容、接收类型、优先级、状态、起止时间、创建人、部门ID集合(JSON)
 * 说明：与 `User`、`Department` 有业务关联，支持按部门/全员推送。
 */
const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const SystemNotification = sequelize.define(
  'SystemNotification',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, comment: '主键ID' },
    title: { type: DataTypes.STRING(200), allowNull: false, comment: '通知标题' },
    content: { type: DataTypes.TEXT, allowNull: false, comment: '通知内容' },
    receiver_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'all',
      comment: '接收类型'
    },
    priority: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'normal',
      comment: '优先级'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'draft',
      comment: '状态'
    },
    start_time: { type: DataTypes.DATE, allowNull: true, comment: '开始时间' },
    end_time: { type: DataTypes.DATE, allowNull: true, comment: '结束时间' },
    created_by: { type: DataTypes.INTEGER, allowNull: true, comment: '创建人ID' },
    department_ids: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '[]',
      comment: '部门ID集合(JSON)'
    }
  },
  {
    tableName: 'system_notifications',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '系统通知表'
  }
);

module.exports = SystemNotification;
