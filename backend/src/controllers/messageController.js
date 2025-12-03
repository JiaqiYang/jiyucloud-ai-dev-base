const { Op } = require('sequelize');

const { MessageRecord, SystemNotification, User } = require('../models');

module.exports = {
  async send(req, res) {
    try {
      const sender = req.user || {};
      const { notification_id, receiver_ids, message_type } = req.body || {};
      let title = String(req.body?.title || '');
      if (title && title.length > 255) {
        return res.status(400).json({ error: '标题长度不能超过255字符' });
      }
      let content = String(req.body?.content || '');
      let receivers = [];
      let type = null;
      if (notification_id) {
        const n = await SystemNotification.findByPk(notification_id);
        if (!n) {
          return res.status(404).json({ error: '通知不存在' });
        }
        content = n.content || content;
        if (!title) {
          title = n.title || '';
        }
        type = 'system';
        let deptIds = [];
        try {
          deptIds = JSON.parse(n.department_ids || '[]');
        } catch {
          deptIds = [];
        }
        if (Array.isArray(deptIds) && deptIds.length > 0) {
          receivers = await User.findAll({
            where: { department_id: deptIds, status: 'active' },
            attributes: ['id', 'username', 'real_name']
          });
        } else {
          receivers = await User.findAll({
            where: { status: 'active' },
            attributes: ['id', 'username', 'real_name']
          });
        }
      } else if (Array.isArray(receiver_ids) && receiver_ids.length) {
        receivers = await User.findAll({
          where: { id: receiver_ids },
          attributes: ['id', 'username', 'real_name']
        });
        type = message_type || 'user';
      }
      if (!receivers.length || !content) {
        return res.status(400).json({ error: '接收者或内容缺失' });
      }
      const priorityFromNotif = notification_id
        ? (await SystemNotification.findByPk(notification_id))?.priority
        : null;
      const reqPriority = String(req.body?.priority || '').toLowerCase();
      const finalPriority =
        priorityFromNotif ||
        (['low', 'normal', 'high'].includes(reqPriority) ? reqPriority : 'normal');
      const rows = receivers.map(r => ({
        sender_id: sender.id || null,
        sender_name: sender.real_name || sender.username || null,
        receiver_id: r.id,
        receiver_name: r.real_name || r.username || null,
        notification_id: notification_id || null,
        title,
        content,
        sent_at: new Date(),
        read_status: 'unread',
        status: 'sent',
        message_type: type,
        priority: finalPriority
      }));
      const createdRows = await MessageRecord.bulkCreate(rows, { returning: true });
      try {
        const hub = require('../services/notificationHub');
        const listToSend = Array.isArray(createdRows) && createdRows.length ? createdRows : rows;
        for (const r of listToSend) {
          hub.sendMessageToUser(r.receiver_id, {
            type: 'message:new',
            id: r.id,
            title: r.title,
            content: r.content,
            sent_at: r.sent_at,
            priority: r.priority,
            message_type: r.message_type,
            sender_id: r.sender_id,
            sender_name: r.sender_name,
            notification_id: r.notification_id
          });
        }
      } catch {}
      if (notification_id) {
        try {
          const n = await SystemNotification.findByPk(notification_id);
          if (n) {
            const nextStatus = 'published';
            if (n.status !== nextStatus) {
              await n.update({ status: nextStatus });
            }
          }
        } catch {}
        try {
          const hub = require('../services/notificationHub');
          hub.broadcastRefresh();
        } catch {}
      }
      res.json({ ok: true, count: rows.length });
    } catch (e) {
      res.status(500).json({ error: '服务器内部错误' });
    }
  },
  async update(req, res) {
    try {
      const { id } = req.params;
      const { title } = req.body || {};
      if (title && title.length > 255) {
        return res.status(400).json({ error: '标题长度不能超过255字符' });
      }
      const row = await MessageRecord.findByPk(id);
      if (!row) {
        return res.status(404).json({ error: '记录不存在' });
      }
      await row.update({ title });
      res.json(row);
    } catch (e) {
      res.status(500).json({ error: '服务器内部错误' });
    }
  },
  async records(req, res) {
    try {
      const {
        page = 1,
        pageSize = 10,
        keyword = '',
        sender_id,
        receiver_id,
        message_type,
        exclude_message_type,
        notification_id,
        status,
        read_status
      } = req.query;
      const where = {};
      if (sender_id) {
        where.sender_id = Number(sender_id);
      }
      if (receiver_id) {
        where.receiver_id = Number(receiver_id);
      }
      if (exclude_message_type) {
        where.message_type = { [Op.ne]: String(exclude_message_type) };
      } else if (message_type) {
        where.message_type = String(message_type);
      }
      if (notification_id) {
        where.notification_id = Number(notification_id);
      }
      if (status) {
        where.status = String(status);
      }
      if (read_status) {
        const v = String(read_status);
        if (v === 'read' || v === 'unread') {
          where.read_status = v;
        }
      }
      if (keyword) {
        const dialect = MessageRecord.sequelize.getDialect();
        const LIKE = dialect === 'postgres' ? Op.iLike : Op.like;
        where[Op.or] = [
          { content: { [LIKE]: `%${keyword}%` } },
          { title: { [LIKE]: `%${keyword}%` } }
        ];
      }
      const limit = parseInt(pageSize);
      const offset = (parseInt(page) - 1) * limit;
      const { count, rows } = await MessageRecord.findAndCountAll({
        where,
        order: [['sent_at', 'DESC']],
        limit,
        offset
      });
      res.json({ list: rows, total: count, page: parseInt(page), pageSize: limit });
    } catch (e) {
      res.status(500).json({ error: '服务器内部错误' });
    }
  },
  async batchRecall(req, res) {
    try {
      const { ids } = req.body || {};
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: '缺少ID列表' });
      }
      const where = { id: ids };
      if (MessageRecord.rawAttributes.status) {
        where.status = { [Op.ne]: 'recalled' };
      }
      const [affected] = await MessageRecord.update({ status: 'recalled' }, { where });
      try {
        const hub = require('../services/notificationHub');
        hub.broadcastRefresh();
      } catch {}
      return res.json({ ok: true, count: affected });
    } catch (e) {
      res.status(500).json({ error: '服务器内部错误' });
    }
  },
  async markRead(req, res) {
    try {
      const { id } = req.body || {};
      const uid = req.user?.id;
      if (!id || !uid) {
        return res.status(400).json({ error: '缺少参数' });
      }
      const row = await MessageRecord.findByPk(id);
      if (!row) {
        return res.status(404).json({ error: '记录不存在' });
      }
      if (Number(row.receiver_id) !== Number(uid)) {
        return res.status(403).json({ error: '无权限标记该记录' });
      }
      await row.update({ read_status: 'read' });
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: '服务器内部错误' });
    }
  },
  async markAllRead(req, res) {
    try {
      const uid = req.user?.id;
      if (!uid) {
        return res.status(401).json({ error: '未登录' });
      }
      const [affected] = await MessageRecord.update(
        { read_status: 'read' },
        { where: { receiver_id: uid, read_status: 'unread' } }
      );
      return res.json({ ok: true, count: affected });
    } catch (e) {
      return res.status(500).json({ error: '服务器内部错误' });
    }
  }
};
