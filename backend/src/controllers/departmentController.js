const { Op } = require('sequelize');

const { Department, SystemLog } = require('../models');
const { ok, fail } = require('../utils/response');
const service = require('../services/departmentService');

const departmentController = {
  async list(req, res) {
    try {
      const { page = 1, pageSize = 10, keyword, status, parent_id } = req.query;
      const where = {};
      if (keyword) {
        const k = `%${keyword}%`;
        where[Op.or] = [{ name: { [Op.like]: k } }, { code: { [Op.like]: k } }];
      }
      if (status) {
        where.status = status;
      }
      if (parent_id !== undefined) {
        where.parent_id = parent_id || null;
      }

      const { count, rows } = await Department.findAndCountAll({
        where,
        limit: parseInt(pageSize),
        offset: (parseInt(page) - 1) * parseInt(pageSize),
        order: [['created_at', 'DESC']]
      });
      res.json({ list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) });
    } catch (e) {
      console.error('获取部门列表错误:', e);
      res.status(500).json({ error: '服务器内部错误' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const row = await Department.findByPk(id);
      if (!row) {
        return res.status(404).json({ error: '部门不存在' });
      }
      res.json(row);
    } catch (e) {
      res.status(500).json({ error: '服务器内部错误' });
    }
  },

  async tree(req, res) {
    try {
      const { status = 'active' } = req.query;
      const where = {};
      if (status) {
        where.status = status;
      }
      const rows = await Department.findAll({
        where,
        order: [
          ['order_no', 'ASC'],
          ['created_at', 'ASC']
        ]
      }).catch(async () => await Department.findAll({ where, order: [['created_at', 'ASC']] }));
      const items = rows.map(r => ({
        id: r.id,
        name: r.name,
        code: r.code,
        status: r.status,
        parent_id: r.parent_id
      }));
      const byParent = new Map();
      for (const it of items) {
        const p = it.parent_id || 0;
        if (!byParent.has(p)) {
          byParent.set(p, []);
        }
        byParent.get(p).push({ ...it, children: [] });
      }
      const attach = node => {
        const children = byParent.get(node.id) || [];
        node.children = children.map(c => attach(c));
        return node;
      };
      const roots = (byParent.get(0) || []).map(r => attach(r));
      return ok(res, roots);
    } catch (e) {
      console.error('获取部门树错误:', e);
      return fail(res, 500, 'INTERNAL_ERROR', '服务器内部错误');
    }
  },

  async create(req, res) {
    try {
      const { department, error } = await service.createDepartment(req.body);
      if (error) {
        return fail(res, 400, 'BAD_REQUEST', error);
      }
      try {
        await SystemLog.create({
          user_id: req.user?.id,
          action: 'create',
          module: 'department',
          description: `create ${department?.code || ''}`,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        });
      } catch {}
      return ok(res, department);
    } catch (e) {
      console.error('创建部门错误:', e);
      return fail(res, 500, 'INTERNAL_ERROR', '服务器内部错误');
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { department, error } = await service.updateDepartment(id, req.body);
      if (error) {
        return fail(res, /不存在/.test(error) ? 404 : 400, 'FAILED', error);
      }
      try {
        await SystemLog.create({
          user_id: req.user?.id,
          action: 'update',
          module: 'department',
          description: `update ${department?.code || ''}`,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        });
      } catch {}
      return ok(res, department);
    } catch (e) {
      console.error('更新部门错误:', e);
      return fail(res, 500, 'INTERNAL_ERROR', '服务器内部错误');
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      const { success, error } = await service.deleteDepartment(id);
      if (error) {
        return fail(res, 404, 'NOT_FOUND', error);
      }
      try {
        await SystemLog.create({
          user_id: req.user?.id,
          action: 'delete',
          module: 'department',
          description: `delete ${id}`,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        });
      } catch {}
      return ok(res, { success });
    } catch (e) {
      console.error('删除部门错误:', e);
      return fail(res, 500, 'INTERNAL_ERROR', '服务器内部错误');
    }
  },

  async changeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const { department, error } = await service.changeStatus(id, status);
      if (error) {
        return fail(res, /不存在/.test(error) ? 404 : 400, 'FAILED', error);
      }
      try {
        await SystemLog.create({
          user_id: req.user?.id,
          action: 'status_change',
          module: 'department',
          description: `status ${department?.code || id} -> ${status}`,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        });
      } catch {}
      return ok(res, department);
    } catch (e) {
      console.error('变更部门状态错误:', e);
      return fail(res, 500, 'INTERNAL_ERROR', '服务器内部错误');
    }
  }
};

module.exports = departmentController;
