const { Op } = require('sequelize');

const { SystemNotification, User } = require('../models');
const { ok, fail } = require('../utils/response');

const systemNotificationController = {
  async unreadCount(req, res) {
    try {
      const now = new Date();
      const userId = req.user?.id;
      const baseWhere = {
        status: 'published',
        [Op.and]: [
          { [Op.or]: [{ start_time: null }, { start_time: { [Op.lte]: now } }] },
          { [Op.or]: [{ end_time: null }, { end_time: { [Op.gte]: now } }] }
        ]
      };
      const userDeptId = req.user?.department_id || null;
      if (!userDeptId) {
        try {
          console.log('[UnreadCount] user has no department, return 0');
        } catch {}
        return res.json({ count: 0 });
      }
      const dialect = SystemNotification.sequelize.getDialect();
      const LIKE = dialect === 'postgres' ? Op.iLike : Op.like;
      const patterns = [
        `%[${userDeptId},%`,
        `%,${userDeptId},%`,
        `%,${userDeptId}]%`,
        `%[${userDeptId}]%`
      ];
      const where = {
        ...baseWhere,
        [Op.or]: patterns.map(p => ({ department_ids: { [LIKE]: p } }))
      };
      const candidates = await SystemNotification.findAll({
        where,
        attributes: ['id', 'department_ids']
      });
      const count = candidates.filter(r => {
        let deptArr = [];
        try {
          deptArr = JSON.parse(r.department_ids || '[]');
        } catch {
          deptArr = [];
        }
        return Array.isArray(deptArr) && deptArr.map(x => Number(x)).includes(Number(userDeptId));
      }).length;
      try {
        console.log('[UnreadCount] user:', { id: userId, dept: userDeptId });
        console.log('[UnreadCount] rawCandidates:', candidates.length);
        console.log('[UnreadCount] finalCount:', count);
      } catch {}
      res.json({ count });
    } catch (e) {
      res.status(500).json({ error: '获取未读数失败' });
    }
  },
  async list(req, res) {
    try {
      const {
        page = 1,
        pageSize = 10,
        keyword = '',
        status,
        priority,
        department_id,
        valid
      } = req.query;
      const where = {};
      if (keyword) {
        const dialect = SystemNotification.sequelize.getDialect();
        const LIKE = dialect === 'postgres' ? Op.iLike : Op.like;
        where[Op.or] = [
          { title: { [LIKE]: `%${keyword}%` } },
          { content: { [LIKE]: `%${keyword}%` } }
        ];
      }
      if (status) {
        where.status = status;
      }
      if (priority) {
        where.priority = priority;
      }

      if (valid === 'true') {
        const now = new Date();
        where[Op.and] = [
          { [Op.or]: [{ start_time: null }, { start_time: { [Op.lte]: now } }] },
          { [Op.or]: [{ end_time: null }, { end_time: { [Op.gte]: now } }] }
        ];
      }
      let count, rows;
      const limit = parseInt(pageSize);
      const offset = (parseInt(page) - 1) * limit;
      if (department_id) {
        const id = Number(department_id);
        const dialect = SystemNotification.sequelize.getDialect();
        const LIKE = dialect === 'postgres' ? Op.iLike : Op.like;
        const deptWhere = { ...where };
        const patterns = [`%[${id},%`, `%,${id},%`, `%,${id}]%`, `%[${id}]%`];
        deptWhere[Op.or] = [
          ...(deptWhere[Op.or] || []),
          ...patterns.map(p => ({ department_ids: { [LIKE]: p } }))
        ];
        const allRows = await SystemNotification.findAll({
          where: deptWhere,
          order: [['created_at', 'DESC']],
          include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'real_name'] }]
        });
        const exact = allRows.filter(r => {
          try {
            const arr = JSON.parse(r.department_ids || '[]');
            return Array.isArray(arr) && arr.map(x => Number(x)).includes(id);
          } catch {
            return false;
          }
        });
        count = exact.length;
        rows = exact.slice(offset, offset + limit);
      } else {
        ({ count, rows } = await SystemNotification.findAndCountAll({
          where,
          limit,
          offset,
          order: [['created_at', 'DESC']],
          include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'real_name'] }]
        }));
      }
      const list = rows.map(r => {
        const obj = r.toJSON();
        try {
          obj.department_ids = JSON.parse(obj.department_ids || '[]');
        } catch {
          obj.department_ids = [];
        }
        return obj;
      });
      return ok(res, { list, total: count, page: parseInt(page), pageSize: parseInt(pageSize) });
    } catch (e) {
      return fail(res, 500, 'INTERNAL_ERROR', '服务器内部错误');
    }
  },

  async create(req, res) {
    try {
      if (!req.body.title || !req.body.content) {
        return fail(res, 400, 'BAD_REQUEST', '标题与内容为必填');
      }
      const service = require('../services/notificationService');
      const { notification, error } = await service.createNotification({
        ...req.body,
        created_by: req.user?.id || null
      });
      if (error) {
        return fail(res, 400, 'BAD_REQUEST', error);
      }
      try {
        const hub = require('../services/notificationHub');
        hub.broadcastRefresh();
      } catch {}
      return ok(res, notification);
    } catch (e) {
      return fail(res, 500, 'INTERNAL_ERROR', '创建失败');
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const row = await SystemNotification.findByPk(id, {
        include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'real_name'] }]
      });
      if (!row) {
        return res.status(404).json({ error: '未找到通知' });
      }
      const obj = row.toJSON();
      try {
        obj.department_ids = JSON.parse(obj.department_ids || '[]');
      } catch {
        obj.department_ids = [];
      }
      res.json(obj);
    } catch (e) {
      res.status(500).json({ error: '服务器内部错误' });
    }
  },

  async markRead(req, res) {
    try {
      return res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: '标记已读失败' });
    }
  },

  async markAllRead(req, res) {
    try {
      return res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: '全部已读失败' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const service = require('../services/notificationService');
      const { notification, error } = await service.updateNotification(id, req.body);
      if (error) {
        return fail(res, 404, 'NOT_FOUND', error);
      }
      try {
        const hub = require('../services/notificationHub');
        hub.broadcastRefresh();
      } catch {}
      return ok(res, notification);
    } catch (e) {
      return fail(res, 500, 'INTERNAL_ERROR', '更新失败');
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      const service = require('../services/notificationService');
      const { success, error } = await service.deleteNotification(id);
      if (error) {
        return fail(res, 404, 'NOT_FOUND', error);
      }
      try {
        const hub = require('../services/notificationHub');
        hub.broadcastRefresh();
      } catch {}
      return ok(res, { success });
    } catch (e) {
      return fail(res, 500, 'INTERNAL_ERROR', '删除失败');
    }
  },

  async batchDelete(req, res) {
    try {
      const { ids } = req.body;
      const service = require('../services/notificationService');
      const { success, deleted, error } = await service.batchDelete(ids);
      if (error) {
        return fail(res, 400, 'BAD_REQUEST', error);
      }
      try {
        const hub = require('../services/notificationHub');
        hub.broadcastRefresh();
      } catch {}
      return ok(res, { success, deleted });
    } catch (e) {
      return fail(res, 500, 'INTERNAL_ERROR', '批量删除失败');
    }
  }
};

module.exports = systemNotificationController;
