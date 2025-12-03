const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

/**
 * 菜单模型定义：支持目录、菜单、按钮
 * 字段说明：
 * - id: 主键
 * - key: 菜单唯一键
 * - title: 菜单标题
 * - path: 前端路由路径
 * - parent_id: 父菜单ID，可为空
 * - type: 'dir' | 'menu' | 'button'
 * - permission_code: 按钮权限编码
 * - icon: 图标名称
 * - order_no: 排序序号
 * - status: 状态（active 等）
 * - component: 前端视图组件标识，如 'system/UserList'
 */
const Menu = sequelize.define(
  'Menu',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, comment: '主键ID' },
    key: { type: DataTypes.STRING(100), allowNull: false, unique: true, comment: '菜单键' },
    title: { type: DataTypes.STRING(100), allowNull: false, comment: '菜单标题' },
    path: { type: DataTypes.STRING(200), allowNull: false, comment: '前端路由路径' },
    parent_id: { type: DataTypes.INTEGER, allowNull: true, comment: '父菜单ID' },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'menu',
      comment: '类型: dir/menu/button'
    },
    permission_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '按钮权限编码(已废弃)'
    },
    icon: { type: DataTypes.STRING(50), comment: '图标' },
    order_no: { type: DataTypes.INTEGER, defaultValue: 0, comment: '排序序号' },
    status: { type: DataTypes.STRING(20), defaultValue: 'active', comment: '状态' },
    component: { type: DataTypes.STRING(200), allowNull: true, comment: '前端组件标识' }
  },
  {
    tableName: 'menus',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '菜单表'
  }
);

module.exports = Menu;

/**
 * 文件: backend/src/models/Menu.js
 * 描述: Sequelize 菜单模型定义，支持目录与菜单类型，以及前端组件标识。
 * 作者: 项目组
 * 创建日期: 2025-11-25
 * 修改日期: 2025-11-25
 * 版本: v1.0.0
 * 版权: Copyright (c) 2025 JiyuCloud
 */
