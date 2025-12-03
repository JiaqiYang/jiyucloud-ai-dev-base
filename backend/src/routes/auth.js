/**
 * 认证相关路由
 * - POST /login 用户登录（公开）
 * - GET /me 获取当前用户信息
 * - POST /heartbeat 上报心跳
 * - POST /logout 退出登录
 */
const express = require('express');

const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// 公开路由：登录
router.post('/login', authController.login);

// 受保护路由：需要登录态
router.get('/me', authMiddleware, authController.getMe);
router.post('/heartbeat', authMiddleware, authController.heartbeat);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
