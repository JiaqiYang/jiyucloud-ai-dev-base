const fs = require('fs');
const path = require('path');
// axios not used
const { Op } = require('sequelize');

const User = require('../models/User');
const Role = require('../models/Role');
const SystemLog = require('../models/SystemLog');
const SystemConfig = require('../models/SystemConfig');
const { Department } = require('../models');
const { ok, fail } = require('../utils/response');
const service = require('../services/userService');

let ipSearcher = null;
const ipCache = new Map();
/**
 * 初始化 IP 位置解析器
 * 优先使用 ip2region-xdb（更快更小），否则回退到 ip2region
 * @returns {{search: (ip:string)=>string} | null}
 */
function initIpSearcher() {
  if (ipSearcher) {
    return ipSearcher;
  }
  const xdbPath =
    process.env.IP2REGION_XDB || path.join(__dirname, '..', 'assets', 'ip2region.xdb');
  try {
    if (fs.existsSync(xdbPath)) {
      const { XDBSearcher } = require('ip2region-xdb');
      const searcher = XDBSearcher.newWithFileOnly(xdbPath);
      ipSearcher = {
        search: ip => {
          try {
            const str = searcher.search(ip) || '';
            const parts = String(str).split('|').filter(Boolean);
            const loc = [parts[0], parts[2], parts[3]].filter(Boolean).join('') || '-';
            return loc;
          } catch {
            return '-';
          }
        }
      };
      return ipSearcher;
    }
  } catch {}
  try {
    const { Searcher } = require('ip2region');
    const searcher = new Searcher();
    ipSearcher = {
      search: ip => {
        try {
          const r = searcher.search(ip) || {};
          const loc = [r.country, r.province, r.city].filter(Boolean).join('') || '-';
          return loc;
        } catch {
          return '-';
        }
      }
    };
    return ipSearcher;
  } catch {}
  return null;
}
/**
 * 获取会话空闲阈值毫秒数，默认 300000(5分钟)
 * @returns {Promise<number>}
 */
async function getInactiveMs() {
  try {
    const cfg = await SystemConfig.findOne({ where: { code: 'auto_logout' } });
    if (!cfg) {
      return 300000;
    }
    const data = JSON.parse(cfg.data || '{}');
    const ms = Number(data.inactive_ms);
    if (ms && ms > 0) {
      return ms;
    }
    return 300000;
  } catch (e) {
    return 300000;
  }
}

/**
 * 用户列表查询（支持在线状态与多条件过滤）
 * @param {import('express').Request} req 请求对象
 * @param {import('express').Response} res 响应对象
 * @returns {Promise<void>}
 */
exports.list = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      username,
      keyword,
      status,
      role_id,
      online,
      department_id
    } = req.query;
    const offset = (page - 1) * pageSize;
    let where = {};
    if (username) {
      where.username = username;
    } else if (keyword) {
      const k = `%${keyword}%`;
      where = {
        [Op.or]: [
          { username: { [Op.like]: k } },
          { real_name: { [Op.like]: k } },
          { phone: { [Op.like]: k } },
          { email: { [Op.like]: k } }
        ]
      };
    }
    if (status) {
      where.status = status;
    }
    if (role_id) {
      where.role_id = role_id;
    }
    if (department_id) {
      where.department_id = department_id;
    }

    const baseQuery = {
      where,
      include: [{ model: Role }, { model: Department, attributes: ['id', 'name', 'code'] }],
      attributes: { exclude: ['password'] }
    };
    let count, rows;
    if (online) {
      rows = await User.findAll(baseQuery);
      count = rows.length;
    } else {
      const r = await User.findAndCountAll({
        ...baseQuery,
        offset: parseInt(offset),
        limit: parseInt(pageSize)
      });
      count = r.count;
      rows = r.rows;
    }

    // 计算在线状态与最近活跃时间（基于心跳/登录日志）
    const now = Date.now();
    const listWithStatus = await Promise.all(
      rows.map(async u => {
        const lastLog = await SystemLog.findOne({
          where: { user_id: u.id, action: ['heartbeat', 'login'] },
          order: [['created_at', 'DESC']]
        }).catch(() => null);
        let lastSid = null;
        if (lastLog && lastLog.description) {
          const m = lastLog.description.match(/session:([0-9a-f-]+)/i);
          lastSid = m ? m[1] : null;
        }
        const lastForce = await SystemLog.findOne({
          where: { user_id: u.id, action: 'force_logout' },
          order: [['created_at', 'DESC']]
        }).catch(() => null);
        let lastSessionForce = null;
        if (lastSid) {
          lastSessionForce = await SystemLog.findOne({
            where: {
              user_id: u.id,
              action: 'force_logout_session',
              description: { [Op.like]: `%${lastSid}%` }
            },
            order: [['created_at', 'DESC']]
          }).catch(() => null);
        }
        const lastActiveAt = lastLog ? new Date(lastLog.created_at).toISOString() : null;
        const inactiveMs = await getInactiveMs();
        let isOnline = lastLog ? now - new Date(lastLog.created_at).getTime() < inactiveMs : false;
        if (lastForce && lastLog) {
          const forceAt = new Date(lastForce.created_at).getTime();
          const activeAt = new Date(lastLog.created_at).getTime();
          if (forceAt >= activeAt) {
            isOnline = false;
          }
        }
        if (lastSessionForce && lastLog) {
          const forceAt = new Date(lastSessionForce.created_at).getTime();
          const activeAt = new Date(lastLog.created_at).getTime();
          if (forceAt >= activeAt) {
            isOnline = false;
          }
        }
        return { ...u.toJSON(), last_active_at: lastActiveAt, is_online: isOnline };
      })
    );

    if (online) {
      const filtered = listWithStatus.filter(u =>
        online === 'online' ? u.is_online === true : u.is_online === false
      );
      const total = filtered.length;
      const start = (parseInt(page) - 1) * parseInt(pageSize);
      const sliced = filtered.slice(start, start + parseInt(pageSize));
      return ok(res, { total, list: sliced, page: parseInt(page), pageSize: parseInt(pageSize) });
    } else {
      return ok(res, {
        total: count,
        list: listWithStatus,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
    }
  } catch (error) {
    return fail(res, 500, 'INTERNAL_ERROR', '服务器内部错误');
  }
};

/**
 * 创建用户
 * @param {import('express').Request} req 请求对象
 * @param {import('express').Response} res 响应对象
 * @returns {Promise<void>}
 */
exports.create = async (req, res) => {
  try {
    const { user, error } = await service.createUser(req.body);
    if (error) {
      return fail(res, 400, 'BAD_REQUEST', error);
    }
    return ok(res, { user });
  } catch (error) {
    return fail(res, 500, 'INTERNAL_ERROR', '服务器内部错误');
  }
};

/**
 * 更新用户
 * @param {import('express').Request} req 请求对象
 * @param {import('express').Response} res 响应对象
 * @returns {Promise<void>}
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { user, error } = await service.updateUser(id, req.body);
    if (error) {
      return fail(res, 404, 'NOT_FOUND', error);
    }
    return ok(res, { user });
  } catch (error) {
    return fail(res, 500, 'INTERNAL_ERROR', '服务器内部错误');
  }
};

/**
 * 删除用户
 * @param {import('express').Request} req 请求对象
 * @param {import('express').Response} res 响应对象
 * @returns {Promise<void>}
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { success, error } = await service.deleteUser(id);
    if (error) {
      return fail(res, /不存在|Not found/.test(error) ? 404 : 403, 'FAILED', error);
    }
    return ok(res, { success });
  } catch (error) {
    return fail(res, 500, 'INTERNAL_ERROR', '服务器内部错误');
  }
};

/**
 * 强制下线某用户（用户级）
 * @param {import('express').Request} req 请求对象
 * @param {import('express').Response} res 响应对象
 * @returns {Promise<void>}
 */
exports.forceLogout = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, { include: [Role] });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // 允许对任何账号进行强制下线（包括超级管理员）
    await SystemLog.create({
      user_id: user.id,
      action: 'force_logout',
      module: 'user',
      description: `管理员 ${req.user.username} 强制下线用户 ${user.username}`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 强制下线某用户的指定会话（session 级）
 * @param {import('express').Request} req 请求对象
 * @param {import('express').Response} res 响应对象
 * @returns {Promise<void>}
 */
exports.forceLogoutSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: '缺少会话ID' });
    }
    const user = await User.findByPk(id, { include: [Role] });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const requesterId = req.user?.id;
    const currentJti = req.tokenPayload?.jti;
    if (
      String(id) === String(requesterId) &&
      currentJti &&
      String(sessionId) === String(currentJti)
    ) {
      return res.status(400).json({ message: '不能强制下线当前会话' });
    }
    // 允许对任何账号的指定会话进行强制下线（包括超级管理员）
    await SystemLog.create({
      user_id: user.id,
      action: 'force_logout_session',
      module: 'user',
      description: `session:${sessionId}`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
    const inactiveMs = await getInactiveMs();
    const fiveMinAgo = new Date(Date.now() - inactiveMs);
    const recentLogs = await SystemLog.findAll({
      where: {
        user_id: user.id,
        action: ['heartbeat', 'login'],
        created_at: { [Op.gte]: fiveMinAgo },
        description: { [Op.notLike]: `%${sessionId}%` }
      },
      order: [['created_at', 'DESC']]
    });
    let anyOnline = false;
    for (const l of recentLogs) {
      const m = (l.description || '').match(/session:([0-9a-f-]+)/i);
      const sid = m ? m[1] : null;
      if (!sid) {
        anyOnline = true;
        break;
      }
      const kicked = await SystemLog.findOne({
        where: {
          user_id: user.id,
          action: 'force_logout_session',
          description: { [Op.like]: `%${sid}%` },
          created_at: { [Op.gte]: l.created_at }
        },
        order: [['created_at', 'DESC']]
      });
      if (!kicked) {
        anyOnline = true;
        break;
      }
    }
    if (!anyOnline) {
      await SystemLog.create({
        user_id: user.id,
        action: 'force_logout',
        module: 'user',
        description: 'no_active_sessions',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
    }
    res.json({ ok: true, anyOnline });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 查询用户最近会话列表（近 30 天）
 * @param {import('express').Request} req 请求对象
 * @param {import('express').Response} res 响应对象
 * @returns {Promise<void>}
 */
exports.sessions = async (req, res) => {
  try {
    const { id } = req.params;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const logs = await SystemLog.findAll({
      where: { user_id: id, action: ['login', 'heartbeat'], created_at: { [Op.gte]: since } },
      order: [['created_at', 'DESC']],
      limit: 1000
    });
    const sessionsMap = new Map();
    for (const log of logs) {
      const desc = log.description || '';
      const sidMatch = desc.match(/session:([0-9a-f-]+)/i);
      const sid = sidMatch ? sidMatch[1] : null;
      const key = sid || `${log.user_agent || ''}|${log.ip_address || ''}`;
      const item = sessionsMap.get(key) || {
        id: key,
        session_id: sid || null,
        device: log.user_agent || 'Unknown',
        ip: log.ip_address || '-',
        location: '-',
        login_time: null,
        last_active: null
      };
      const ts = new Date(log.created_at).toISOString();
      if (log.action === 'login') {
        item.login_time = item.login_time || ts;
      }
      item.last_active = item.last_active && item.last_active > ts ? item.last_active : ts;
      sessionsMap.set(key, item);
    }
    // 计算每个会话是否在线：最近活跃 < 5分钟 且未被强制下线（用户级/会话级）
    const nowMs = Date.now();
    const inactiveMs = await getInactiveMs();
    const forcedLogs = await SystemLog.findAll({
      where: {
        user_id: id,
        action: ['force_logout', 'force_logout_session'],
        created_at: { [Op.gte]: since }
      },
      order: [['created_at', 'DESC']],
      limit: 200
    });
    const lastUserForce = forcedLogs.find(l => l.action === 'force_logout') || null;
    const sessionForceMap = new Map();
    for (const l of forcedLogs) {
      if (l.action !== 'force_logout_session') {
        continue;
      }
      const m = (l.description || '').match(/session:([0-9a-f-]+)/i);
      const sid = m ? m[1] : null;
      if (sid) {
        const prev = sessionForceMap.get(sid);
        const t = new Date(l.created_at).getTime();
        if (!prev || prev < t) {
          sessionForceMap.set(sid, t);
        }
      }
    }
    let list = Array.from(sessionsMap.values()).map(it => {
      const lastActiveMs = it.last_active ? new Date(it.last_active).getTime() : 0;
      let online = lastActiveMs ? nowMs - lastActiveMs < inactiveMs : false;
      const userForceMs = lastUserForce ? new Date(lastUserForce.created_at).getTime() : 0;
      if (userForceMs && lastActiveMs && userForceMs >= lastActiveMs) {
        online = false;
      }
      const sid = it.session_id;
      if (sid && sessionForceMap.has(sid)) {
        const forceMs = sessionForceMap.get(sid);
        if (forceMs && lastActiveMs && forceMs >= lastActiveMs) {
          online = false;
        }
      }
      return { ...it, is_online: online };
    });
    const ipSet = new Set(list.map(x => x.ip).filter(Boolean));
    const isPrivate = ip => {
      if (!ip) {
        return true;
      }
      if (ip === '::1') {
        return true;
      }
      return (
        /^127\./.test(ip) ||
        /^10\./.test(ip) ||
        /^192\.168\./.test(ip) ||
        /^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip)
      );
    };
    const searcher = initIpSearcher();
    for (const ip of ipSet) {
      if (isPrivate(ip)) {
        ipCache.set(ip, '本地网络');
        continue;
      }
      if (ipCache.has(ip)) {
        continue;
      }
      if (searcher) {
        const loc = searcher.search(ip);
        ipCache.set(ip, loc || '-');
      } else {
        ipCache.set(ip, '-');
      }
    }
    list = list.map(x => ({ ...x, location: ipCache.get(x.ip) || x.location }));
    // 将解析结果持久化到数据库，便于长期复用
    for (const ip of ipSet) {
      const loc = ipCache.get(ip);
      if (!loc) {
        continue;
      }
      await SystemLog.update(
        { ip_location: loc },
        { where: { user_id: id, ip_address: ip, ip_location: null } }
      );
    }
    res.json({ list });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
