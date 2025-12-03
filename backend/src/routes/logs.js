/**
 * 系统日志路由（需认证）
 * - GET /                    日志列表
 * - GET /:id                 日志详情
 * - DELETE /:id              删除日志
 * - POST /batch-delete       批量删除
 * - GET /statistics/summary  日志统计摘要
 */
const express = require('express');

const router = express.Router();
const logController = require('../controllers/logController');
const authMiddleware = require('../middlewares/authMiddleware');

// 所有路由都需要认证
router.use(authMiddleware);

// 日志列表
router.get('/', logController.list);

// 日志详情
router.get('/:id', logController.detail);

// 删除日志
router.delete('/:id', logController.delete);

// 批量删除
router.post('/batch-delete', logController.batchDelete);

// 日志统计
router.get('/statistics/summary', logController.statistics);

module.exports = router;
