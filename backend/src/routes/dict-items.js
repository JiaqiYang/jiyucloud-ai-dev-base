/**
 * 字典项路由
 * - GET /      列出字典项
 * - POST /     创建字典项
 * - PUT /:id   更新字典项
 * - DELETE /:id 删除字典项
 */
const express = require('express');

const router = express.Router();
const dictController = require('../controllers/dictController');

// 字典项
router.get('/', dictController.getItems);
router.post('/', dictController.createItem);
router.put('/:id', dictController.updateItem);
router.delete('/:id', dictController.deleteItem);

module.exports = router;
