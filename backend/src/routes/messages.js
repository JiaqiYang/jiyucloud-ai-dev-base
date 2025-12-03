/**
 * 消息记录与发送路由（需认证）
 * - POST /send      发送消息
 * - GET /records    查询消息记录
 * - PUT /:id        更新消息记录
 */
const express = require('express');

const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/send', authMiddleware, messageController.send);
router.get('/records', authMiddleware, messageController.records);
router.put('/:id', authMiddleware, messageController.update);
router.post('/batch-recall', authMiddleware, messageController.batchRecall);
router.post('/mark-read', authMiddleware, messageController.markRead);
router.post('/read-all', authMiddleware, messageController.markAllRead);

module.exports = router;
