/**
 * 消息记录模型
 * 字段：发送/接收人、通知ID、标题、内容、发送时间、已读状态、消息类型
 * 说明：用于记录消息发送与读取状态。
 */
const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const MessageRecord = sequelize.define(
  'MessageRecord',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, comment: '主键ID' },
    sender_id: { type: DataTypes.INTEGER, allowNull: false, comment: '发送人ID' },
    sender_name: { type: DataTypes.STRING, allowNull: true, comment: '发送人姓名' },
    receiver_id: { type: DataTypes.INTEGER, allowNull: false, comment: '接收人ID' },
    receiver_name: { type: DataTypes.STRING, allowNull: true, comment: '接收人姓名' },
    notification_id: { type: DataTypes.INTEGER, allowNull: true, comment: '通知ID' },
    title: { type: DataTypes.STRING(255), allowNull: true, comment: '消息标题' },
    content: { type: DataTypes.TEXT, allowNull: false, comment: '消息内容' },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '发送时间'
    },
    read_status: {
      type: DataTypes.ENUM('unread', 'read'),
      allowNull: false,
      defaultValue: 'unread',
      comment: '已读状态'
    },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'sent', comment: '状态' },
    message_type: { type: DataTypes.STRING, allowNull: true, comment: '消息类型' },
    priority: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'normal',
      comment: '优先级'
    }
  },
  {
    tableName: 'message_records',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '消息记录表'
  }
);

module.exports = MessageRecord;
