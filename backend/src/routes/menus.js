/**
 * 菜单相关路由（需认证）
 * - GET /tree                          菜单树结构
 * - GET /enabled/top                   角色可见的一级菜单
 * - GET /enabled/children/:parentKey   角色可见的二级菜单
 * - GET /                              菜单列表（管理）
 * - POST /                             创建菜单
 * - PUT /:id                           更新菜单
 * - DELETE /:id                        删除菜单
 * - GET /config/:roleCode              获取角色菜单配置
 * - POST /config/:roleCode             保存角色菜单配置
 * 公开菜单定义接口由 app.js 注册在 /api/public/menus/definitions
 */
const express = require('express');

const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const menuController = require('../controllers/menuController');

// 已移除：菜单定义公共接口由 app.js 注册到 /api/public/menus/definitions

// 需要登录的接口
router.use(authMiddleware);
router.get('/tree', menuController.tree);
// 基于角色权限的可见菜单（一级/二级）
router.get('/enabled/top', menuController.enabledTop);
router.get('/enabled/children/:parentKey', menuController.enabledChildren);
// 菜单 CRUD
router.get('/', menuController.list);
router.post('/', menuController.create);
router.put('/:id', menuController.update);
router.delete('/:id', menuController.remove);
// 角色菜单配置
router.get('/config/:roleCode', menuController.getRoleConfig);
router.post('/config/:roleCode', menuController.setRoleConfig);

module.exports = router;
/**
 * 文件: backend/src/routes/menus.js
 * 描述: 菜单相关路由定义。公开端点仅用于菜单定义，其余端点需登录鉴权。
 * 作者: 项目组
 * 创建日期: 2025-11-25
 * 修改日期: 2025-11-25
 * 版本: v1.0.0
 * 版权: Copyright (c) 2025 JiyuCloud
 */
