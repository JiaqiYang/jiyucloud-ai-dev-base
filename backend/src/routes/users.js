/**
 * 用户管理路由（需认证）
 * - GET /                    用户列表
 * - POST /                   创建用户
 * - PUT /:id                 更新用户
 * - DELETE /:id              删除用户
 * - POST /:id/force-logout   强制用户下线（用户级）
 * - POST /:id/force-logout-session 强制用户的指定会话下线
 * - GET /:id/sessions        查询用户最近会话列表
 */
const express = require('express');

const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', userController.list);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);
router.post('/:id/force-logout', userController.forceLogout);
router.post('/:id/force-logout-session', userController.forceLogoutSession);
router.get('/:id/sessions', userController.sessions);

module.exports = router;
