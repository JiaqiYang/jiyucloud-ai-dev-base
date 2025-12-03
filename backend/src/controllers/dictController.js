const { Op } = require('sequelize');

const { DictionaryType, DictionaryItem } = require('../models');

const dictController = {
  async getTypes(req, res) {
    try {
      const { page = 1, pageSize = 10, keyword } = req.query;
      const where = {};
      if (keyword) {
        const dialect = DictionaryType.sequelize.getDialect();
        const LIKE = dialect === 'postgres' ? Op.iLike : Op.like;
        where[Op.or] = [{ code: { [LIKE]: `%${keyword}%` } }, { name: { [LIKE]: `%${keyword}%` } }];
      }

      const { count, rows } = await DictionaryType.findAndCountAll({
        where,
        limit: parseInt(pageSize),
        offset: (parseInt(page) - 1) * parseInt(pageSize),
        order: [['created_at', 'DESC']]
      });

      res.json({ list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) });
    } catch (error) {
      console.error('获取字典类型错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  },

  async createType(req, res) {
    try {
      const { code, name, status = 'active', description } = req.body;
      if (!code || !name) {
        return res.status(400).json({ error: '缺少必要参数' });
      }
      const exists = await DictionaryType.findOne({ where: { code } });
      if (exists) {
        return res.status(400).json({ error: '类型编码已存在' });
      }
      const type = await DictionaryType.create({ code, name, status, description });
      res.status(201).json(type);
    } catch (error) {
      console.error('创建字典类型错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  },

  async updateType(req, res) {
    try {
      const { id } = req.params;
      const { name, status, description } = req.body;
      const type = await DictionaryType.findByPk(id);
      if (!type) {
        return res.status(404).json({ error: '字典类型不存在' });
      }
      type.name = name ?? type.name;
      type.status = status ?? type.status;
      type.description = description ?? type.description;
      await type.save();
      res.json(type);
    } catch (error) {
      console.error('更新字典类型错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  },

  async deleteType(req, res) {
    try {
      const { id } = req.params;
      const type = await DictionaryType.findByPk(id);
      if (!type) {
        return res.status(404).json({ error: '字典类型不存在' });
      }
      await type.destroy();
      res.json({ message: '删除成功' });
    } catch (error) {
      console.error('删除字典类型错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  },

  async getItems(req, res) {
    try {
      const { page = 1, pageSize = 10, typeCode, keyword } = req.query;
      const where = {};
      if (typeCode) {
        where.type_code = typeCode;
      }
      if (keyword) {
        const dialect = DictionaryItem.sequelize.getDialect();
        const LIKE = dialect === 'postgres' ? Op.iLike : Op.like;
        where[Op.or] = [
          { key: { [LIKE]: `%${keyword}%` } },
          { value: { [LIKE]: `%${keyword}%` } },
          { label: { [LIKE]: `%${keyword}%` } }
        ];
      }
      const { count, rows } = await DictionaryItem.findAndCountAll({
        where,
        order: [
          ['order_no', 'ASC'],
          ['created_at', 'DESC']
        ],
        limit: parseInt(pageSize),
        offset: (parseInt(page) - 1) * parseInt(pageSize)
      });
      res.json({ list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) });
    } catch (error) {
      console.error('获取字典项错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  },

  async createItem(req, res) {
    try {
      const { type_code, key, value, label, status = 'active', order_no = 0 } = req.body;
      if (!type_code || !key || !value || !label) {
        return res.status(400).json({ error: '缺少必要参数' });
      }
      const type = await DictionaryType.findOne({ where: { code: type_code } });
      if (!type) {
        return res.status(404).json({ error: '字典类型不存在' });
      }
      const exists = await DictionaryItem.findOne({ where: { type_code, key } });
      if (exists) {
        return res.status(400).json({ error: '该键已存在' });
      }
      const item = await DictionaryItem.create({ type_code, key, value, label, status, order_no });
      res.status(201).json(item);
    } catch (error) {
      console.error('创建字典项错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  },

  async updateItem(req, res) {
    try {
      const { id } = req.params;
      const item = await DictionaryItem.findByPk(id);
      if (!item) {
        return res.status(404).json({ error: '字典项不存在' });
      }
      const { value, label, status, order_no, type_code } = req.body;
      if (type_code) {
        item.type_code = type_code;
      }
      if (value !== undefined) {
        item.value = value;
      }
      if (label !== undefined) {
        item.label = label;
      }
      if (status !== undefined) {
        item.status = status;
      }
      if (order_no !== undefined) {
        item.order_no = order_no;
      }
      await item.save();
      res.json(item);
    } catch (error) {
      console.error('更新字典项错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  },

  async deleteItem(req, res) {
    try {
      const { id } = req.params;
      const item = await DictionaryItem.findByPk(id);
      if (!item) {
        return res.status(404).json({ error: '字典项不存在' });
      }
      await item.destroy();
      res.json({ message: '删除成功' });
    } catch (error) {
      console.error('删除字典项错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
};

module.exports = dictController;
