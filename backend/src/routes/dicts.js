/**
 * 字典类型路由
 * - GET /      列出字典类型
 * - POST /     创建字典类型
 * - PUT /:id   更新字典类型
 * - DELETE /:id 删除字典类型
 */
const express = require('express');

const router = express.Router();
const dictController = require('../controllers/dictController');

// 字典类型
router.get('/', dictController.getTypes);
router.post('/', dictController.createType);
router.put('/:id', dictController.updateType);
router.delete('/:id', dictController.deleteType);

module.exports = router;
