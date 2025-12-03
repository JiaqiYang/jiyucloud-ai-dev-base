/**
 * 角色管理路由（需认证）
 * - GET /                 角色列表
 * - POST /                创建角色
 * - PUT /:id              更新角色
 * - DELETE /:id           删除角色
 * - POST /:id/permissions 设置角色权限
 * - GET /:id/permissions  获取角色权限ID列表
 */
const express = require('express');

const router = express.Router();
const roleController = require('../controllers/roleController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', roleController.list);
router.post('/', roleController.create);
router.put('/:id', roleController.update);
router.delete('/:id', roleController.delete);

module.exports = router;
