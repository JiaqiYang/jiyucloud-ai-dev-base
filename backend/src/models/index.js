/**
 * 模型聚合与关联定义
 * 说明：
 * - 用户 User 与 角色 Role：一对多（User.belongsTo(Role)，Role.hasMany(User)）
 * - 角色 Role 与 权限 Permission：多对多（通过 RolePermission）
 * - 用户 User 与 系统日志 SystemLog：一对多
 * - 字典类型 DictionaryType 与 字典项 DictionaryItem：一对多（按 type_code）
 * - 部门 Department 与 用户 User：一对多；部门自引用 children/parent
 */
const sequelize = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const SystemLog = require('./SystemLog');
const SystemConfig = require('./SystemConfig');
const SystemNotification = require('./SystemNotification');
const MessageRecord = require('./MessageRecord');
const UserNotificationRead = require('./UserNotificationRead');
const DictionaryType = require('./DictionaryType');
const DictionaryItem = require('./DictionaryItem');
const Menu = require('./Menu');
const Department = require('./Department');
const RoleMenu = require('./RoleMenu');

// 关联关系定义

// 1. 用户与角色
User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

// 用户与系统日志
SystemLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(SystemLog, { foreignKey: 'user_id', as: 'logs' });

// 14.1 系统通知
SystemNotification.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// 15. 字典管理
DictionaryType.hasMany(DictionaryItem, { foreignKey: 'type_code', sourceKey: 'code' });
DictionaryItem.belongsTo(DictionaryType, { foreignKey: 'type_code', targetKey: 'code' });

// 16. 部门
Department.hasMany(User, { foreignKey: 'department_id' });
User.belongsTo(Department, { foreignKey: 'department_id' });
Department.hasMany(Department, { foreignKey: 'parent_id', as: 'children' });
Department.belongsTo(Department, { foreignKey: 'parent_id', as: 'parent' });

module.exports = {
  sequelize,
  User,
  Role,
  RoleMenu,
  SystemLog,
  SystemConfig,
  SystemNotification,
  UserNotificationRead,
  DictionaryType,
  DictionaryItem,
  Menu,
  Department,
  MessageRecord
};
Role.belongsToMany(Menu, { through: RoleMenu, foreignKey: 'role_id' });
Menu.belongsToMany(Role, { through: RoleMenu, foreignKey: 'menu_id' });
