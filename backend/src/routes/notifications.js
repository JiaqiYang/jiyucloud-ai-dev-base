/**
 * 系统通知路由（需认证与权限）
 * - GET /                 列表（notification:read）
 * - GET /unread-count     未读计数（notification:read）
 * - POST /                创建（notification:create）
 * - GET /:id              详情（notification:read）
 * - PUT /:id              更新（notification:update）
 * - DELETE /:id           删除（notification:delete）
 * - POST /batch-delete    批量删除（notification:delete）
 * - POST /:id/read        标记已读（notification:read）
 * - POST /read-all        全部标记已读（notification:read）
 */
const express = require('express');

const router = express.Router();
const controller = require('../controllers/systemNotificationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', controller.list);
router.get('/unread-count', controller.unreadCount);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.post('/batch-delete', controller.batchDelete);
router.post('/:id/read', controller.markRead);
router.post('/read-all', controller.markAllRead);

module.exports = router;
