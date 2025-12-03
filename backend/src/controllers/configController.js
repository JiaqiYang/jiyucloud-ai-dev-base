const { SystemConfig } = require('../models');

const configController = {
  async get(req, res) {
    try {
      const { code } = req.params;
      const cfg = await SystemConfig.findOne({ where: { code } });
      if (!cfg) {
        return res.json({ code, name: '', data: {} });
      }
      let data = {};
      try {
        data = JSON.parse(cfg.data || '{}');
      } catch {
        data = {};
      }
      res.json({ code: cfg.code, name: cfg.name, data, updated_at: cfg.updated_at });
    } catch (e) {
      res.status(500).json({ error: '服务器内部错误' });
    }
  },
  async upsert(req, res) {
    try {
      const { code } = req.params;
      const { name, data } = req.body;
      const row = await SystemConfig.findOne({ where: { code } });
      const json = JSON.stringify(data || {});
      if (row) {
        if (name) {
          row.name = name;
        }
        row.data = json;
        await row.save();
        return res.json({ code: row.code, name: row.name, data: JSON.parse(row.data || '{}') });
      } else {
        const created = await SystemConfig.create({ code, name: name || code, data: json });
        return res.json({
          code: created.code,
          name: created.name,
          data: JSON.parse(created.data || '{}')
        });
      }
    } catch (e) {
      res.status(500).json({ error: '服务器内部错误' });
    }
  },
  async list(req, res) {
    try {
      const rows = await SystemConfig.findAll({ order: [['updated_at', 'DESC']] });
      const list = rows.map(r => ({
        code: r.code,
        name: r.name,
        data: (() => {
          try {
            return JSON.parse(r.data || '{}');
          } catch {
            return {};
          }
        })(),
        updated_at: r.updated_at
      }));
      res.json({ list });
    } catch (e) {
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
};

module.exports = configController;
