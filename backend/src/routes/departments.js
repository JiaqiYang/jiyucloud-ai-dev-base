/**
 * 部门管理路由
 * - GET /           部门列表
 * - GET /tree       部门树
 * - GET /:id        获取部门
 * - POST /          创建部门（需要权限 department:create）
 * - PUT /:id        更新部门（需要权限 department:update）
 * - DELETE /:id     删除部门（需要权限 department:delete）
 * - PUT /:id/status 变更状态（需要权限 department:status）
 */
const express = require('express');

const router = express.Router();
const departmentController = require('../controllers/departmentController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', departmentController.list);
router.get('/tree', departmentController.tree);
router.get('/:id', departmentController.getById);

router.post('/', departmentController.create);
router.put('/:id', departmentController.update);
router.delete('/:id', departmentController.remove);
router.put('/:id/status', departmentController.changeStatus);

module.exports = router;
