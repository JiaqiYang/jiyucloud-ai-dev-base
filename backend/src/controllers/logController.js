const { Op } = require('sequelize');

const { SystemLog, User } = require('../models');

const logController = {
  // 获取日志列表（带分页和筛选）
  async list(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        module,
        action,
        user_id,
        startDate,
        endDate,
        ip_address,
        keyword,
        hasSession
      } = req.query;

      const where = {};

      if (module) {
        where.module = module;
      }
      if (action) {
        where.action = action;
      }
      if (user_id) {
        where.user_id = user_id;
      }
      if (ip_address) {
        where.ip_address = { [Op.like]: `%${ip_address}%` };
      }
      if (hasSession === 'true') {
        where.description = { [Op.like]: '%session:%' };
      }

      if (keyword) {
        const k = `%${keyword}%`;
        where[Op.or] = [
          { description: { [Op.like]: k } },
          { module: { [Op.like]: k } },
          { action: { [Op.like]: k } },
          { user_agent: { [Op.like]: k } },
          { ip_location: { [Op.like]: k } },
          { ip_address: { [Op.like]: k } }
        ];
      }

      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) {
          where.created_at[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          where.created_at[Op.lte] = new Date(endDate);
        }
      }

      const offset = (Number(page) - 1) * Number(pageSize);
      const limit = parseInt(pageSize);

      const runQuery = async w => {
        const total = await SystemLog.count({ where: w });
        const list = await SystemLog.findAll({
          where: w,
          order: [['created_at', 'DESC']],
          offset,
          limit,
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'real_name'] }]
        });
        return { count: total, rows: list };
      };

      let count, rows;
      try {
        ({ count, rows } = await runQuery(where));
      } catch (e) {
        try {
          const safeWhere = { ...where };
          if (safeWhere.created_at) {
            delete safeWhere.created_at;
          }
          ({ count, rows } = await runQuery(safeWhere));
        } catch (e2) {
          return res.json({ list: [], total: 0, page: parseInt(page), pageSize: limit });
        }
      }

      res.json({
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: limit
      });
    } catch (error) {
      console.error('获取日志列表错误:', error);
      return res.json({
        list: [],
        total: 0,
        page: parseInt(req.query.page || 1),
        pageSize: parseInt(req.query.pageSize || 20)
      });
    }
  },

  // 获取日志详情
  async detail(req, res) {
    try {
      const { id } = req.params;
      const log = await SystemLog.findByPk(id, {
        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'real_name'] }]
      });

      if (!log) {
        return res.status(404).json({ error: '日志不存在' });
      }

      res.json(log);
    } catch (error) {
      console.error('获取日志详情错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  },

  // 删除日志
  async delete(req, res) {
    try {
      const { id } = req.params;
      const log = await SystemLog.findByPk(id);

      if (!log) {
        return res.status(404).json({ error: '日志不存在' });
      }

      await log.destroy();
      res.json({ message: '删除成功' });
    } catch (error) {
      console.error('删除日志错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  },

  // 批量删除日志
  async batchDelete(req, res) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: '请提供要删除的日志ID' });
      }

      await SystemLog.destroy({
        where: {
          id: { [Op.in]: ids }
        }
      });

      res.json({ message: `成功删除 ${ids.length} 条日志` });
    } catch (error) {
      console.error('批量删除日志错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  },

  // 获取日志统计信息
  async statistics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const baseWhere = {};
      if (startDate || endDate) {
        baseWhere.created_at = {};
        if (startDate) {
          baseWhere.created_at[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          baseWhere.created_at[Op.lte] = new Date(endDate);
        }
      }

      const safeAgg = async w => {
        const moduleStats = await SystemLog.findAll({
          where: w,
          attributes: [
            'module',
            [SystemLog.sequelize.fn('COUNT', SystemLog.sequelize.col('id')), 'count']
          ],
          group: ['module']
        });
        const actionStats = await SystemLog.findAll({
          where: w,
          attributes: [
            'action',
            [SystemLog.sequelize.fn('COUNT', SystemLog.sequelize.col('id')), 'count']
          ],
          group: ['action']
        });
        return { moduleStats, actionStats };
      };

      let moduleStats, actionStats;
      try {
        ({ moduleStats, actionStats } = await safeAgg(baseWhere));
      } catch (e) {
        const w = { ...baseWhere };
        if (w.created_at) {
          delete w.created_at;
        }
        ({ moduleStats, actionStats } = await safeAgg(w));
      }

      res.json({
        moduleStats,
        actionStats
      });
    } catch (error) {
      console.error('获取日志统计错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
};

module.exports = logController;
