/**
 * 字典项模型
 * 字段：type_code、key、value、label、status、order_no、deleted_by
 * 说明：属于某字典类型（按 type_code 关联）；支持软删除与排序。
 */
const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const DictionaryItem = sequelize.define(
  'DictionaryItem',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type_code: { type: DataTypes.STRING(64), allowNull: false, comment: '所属类型编码' },
    key: { type: DataTypes.STRING(64), allowNull: false, comment: '字典键' },
    value: { type: DataTypes.STRING(128), allowNull: false, comment: '字典值' },
    label: { type: DataTypes.STRING(256), allowNull: false, comment: '显示文本' },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active', comment: '状态' },
    order_no: { type: DataTypes.INTEGER, defaultValue: 0, comment: '排序号' },
    deleted_by: { type: DataTypes.INTEGER, comment: '删除人ID' }
  },
  {
    tableName: 'dictionary_items',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    comment: '字典项表'
  }
);

module.exports = DictionaryItem;
