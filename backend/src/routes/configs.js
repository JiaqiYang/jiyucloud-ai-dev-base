/**
 * 系统配置路由
 * - GET /       列出配置项
 * - GET /:code  获取指定配置
 * - PUT /:code  新建或更新配置
 */
const express = require('express');

const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const configController = require('../controllers/configController');

router.use(authMiddleware);

router.get('/', configController.list);
router.get('/:code', configController.get);
router.put('/:code', configController.upsert);

module.exports = router;
