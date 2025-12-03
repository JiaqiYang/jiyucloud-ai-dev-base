/**
 * 字典类型模型
 * 字段：code、name、status、description
 * 说明：与 `DictionaryItem` 存在一对多关联；支持软删除。
 */
const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const DictionaryType = sequelize.define(
  'DictionaryType',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(64), allowNull: false, unique: true, comment: '类型编码' },
    name: { type: DataTypes.STRING(128), allowNull: false, comment: '类型名称' },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active', comment: '状态' },
    description: { type: DataTypes.TEXT, comment: '描述' },
    deleted_by: { type: DataTypes.INTEGER, comment: '删除人ID' }
  },
  {
    tableName: 'dictionary_types',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    comment: '字典类型表'
  }
);

module.exports = DictionaryType;
