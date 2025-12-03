const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { Searcher } = require('ip2region');

const { User, Role, SystemLog } = require('../models');
const SystemConfig = require('../models/SystemConfig');
const {
  checkLockout,
  recordFailedAttempt,
  resetAttempts
} = require('../middlewares/loginAttemptMiddleware');
const captchaModule = require('../routes/captcha');
const verifyCaptcha =
  typeof captchaModule.verifyCaptcha === 'function' ? captchaModule.verifyCaptcha : null;

const authController = {
  /**
   * 用户登录
   * @param {import('express').Request} req 请求对象
   * @param {import('express').Response} res 响应对象
   * @returns {Promise<void>}
   */
  async login(req, res) {
    try {
      const { username, password, captchaId, captchaText } = req.body;

      const captchaDisabled =
        process.env.DISABLE_CAPTCHA === '1' || process.env.NODE_ENV !== 'production';
      if (!captchaDisabled) {
        if (!captchaId || !captchaText) {
          return res.status(400).json({ error: '请输入验证码' });
        }
        if (!verifyCaptcha) {
          return res.status(503).json({ error: '验证码服务暂不可用' });
        }
        const captchaResult = verifyCaptcha(captchaId, captchaText);
        if (!captchaResult.valid) {
          return res.status(400).json({ error: captchaResult.message || '验证码错误' });
        }
      }

      // 1. 检查账号是否被锁定
      const lockStatus = checkLockout(username);
      if (lockStatus.locked) {
        return res.status(429).json({
          error: `账号已锁定，请在 ${lockStatus.remainingMinutes} 分钟后重试`,
          lockedUntil: lockStatus.remainingMinutes
        });
      }

      // 2. 查找用户
      const user = await User.findOne({
        where: { username },
        include: [{ model: Role }]
      });

      if (!user) {
        // 记录失败尝试
        const failInfo = recordFailedAttempt(username);
        const errorMsg =
          failInfo.lockoutMinutes > 0
            ? `用户名或密码错误，账号已锁定 ${failInfo.lockoutMinutes} 分钟`
            : '用户名或密码错误';
        return res.status(401).json({ error: errorMsg });
      }

      // 3. 验证密码
      if (!user.password) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        // 记录失败尝试
        const failInfo = recordFailedAttempt(username);
        const errorMsg =
          failInfo.lockoutMinutes > 0
            ? `用户名或密码错误，账号已锁定 ${failInfo.lockoutMinutes} 分钟`
            : '用户名或密码错误';
        return res.status(401).json({ error: errorMsg });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ error: '账号已被禁用' });
      }

      // 3.1 校验同时登录设备数量限制（生产环境启用，可通过环境变量禁用）
      const deviceLimitEnabled =
        process.env.NODE_ENV === 'production' && process.env.DISABLE_DEVICE_LIMIT !== '1';
      if (deviceLimitEnabled) {
        const maxDevices = await getMaxLoginDevices();
        const activeCount = await countActiveSessions(user.id);
        if (activeCount >= maxDevices) {
          return res.status(429).json({ error: '已达到同时登录设备数量上限' });
        }
      }

      // 4. 登录成功，重置失败计数
      resetAttempts(username);

      // 5. 更新登录时间
      user.last_login = new Date();
      await user.save();

      // 6. 生成 Token（带会话ID）
      const sessionId = crypto.randomUUID();
      const payload = {
        id: user.id,
        username: user.username,
        role: user.Role ? user.Role.role_code : null,
        jti: sessionId
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '24h'
      });

      // 7. 记录日志
      await SystemLog.create({
        user_id: user.id,
        action: 'login',
        module: 'auth',
        description: `session:${sessionId}`,
        ip_address: req.ip,
        ip_location: getIpLocation(req.ip),
        user_agent: req.headers['user-agent']
      });

      res.json({
        message: '登录成功',
        token,
        user: {
          id: user.id,
          username: user.username,
          real_name: user.real_name,
          role: user.Role ? user.Role.role_name : null,
          role_code: user.Role ? user.Role.role_code : null,
          avatar: user.avatar
        }
      });
    } catch (error) {
      console.error('登录错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  },

  /**
   * 获取当前用户信息
   * @param {import('express').Request} req 请求对象
   * @param {import('express').Response} res 响应对象
   * @returns {Promise<void>}
   */
  async getMe(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Role
          }
        ]
      });

      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }

      const permissions = [];

      res.json({
        user,
        permissions
      });
    } catch (error) {
      console.error('获取用户信息错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  },
  /**
   * 心跳上报（用于在线状态计算与会话追踪）
   * @param {import('express').Request} req 请求对象
   * @param {import('express').Response} res 响应对象
   * @returns {Promise<void>}
   */
  async heartbeat(req, res) {
    try {
      const sid = (req.tokenPayload && req.tokenPayload.jti) || '';
      await SystemLog.create({
        user_id: req.user.id,
        action: 'heartbeat',
        module: 'auth',
        description: sid ? `session:${sid}` : '',
        ip_address: req.ip,
        ip_location: getIpLocation(req.ip),
        user_agent: req.headers['user-agent']
      });
      res.json({ ok: true });
    } catch (error) {
      console.error('心跳错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  },
  /**
   * 用户退出登录（记录日志并使令牌失效）
   * @param {import('express').Request} req 请求对象
   * @param {import('express').Response} res 响应对象
   * @returns {Promise<void>}
   */
  async logout(req, res) {
    try {
      const sid = (req.tokenPayload && req.tokenPayload.jti) || '';
      if (sid) {
        await SystemLog.create({
          user_id: req.user.id,
          action: 'force_logout_session',
          module: 'auth',
          description: `session:${sid}`,
          ip_address: req.ip,
          ip_location: getIpLocation(req.ip),
          user_agent: req.headers['user-agent']
        });
      }
      await SystemLog.create({
        user_id: req.user.id,
        action: 'force_logout',
        module: 'auth',
        description: '用户退出登录（全量会话下线）',
        ip_address: req.ip,
        ip_location: getIpLocation(req.ip),
        user_agent: req.headers['user-agent']
      });
      await SystemLog.create({
        user_id: req.user.id,
        action: 'logout',
        module: 'auth',
        description: '用户退出登录',
        ip_address: req.ip,
        ip_location: getIpLocation(req.ip),
        user_agent: req.headers['user-agent']
      });
      res.json({ ok: true });
    } catch (error) {
      console.error('退出登录错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
};

module.exports = authController;
/**
 * 根据 IP 解析地理位置（内网地址直接返回“本地网络”）
 * @param {string} ip IP 地址
 * @returns {string} 位置字符串
 */
function getIpLocation(ip) {
  try {
    if (
      !ip ||
      ip === '::1' ||
      /^127\./.test(ip) ||
      /^10\./.test(ip) ||
      /^192\.168\./.test(ip) ||
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip)
    ) {
      return '本地网络';
    }
    const searcher = new Searcher();
    const r = searcher.search(ip) || {};
    const loc = [r.country, r.province, r.city].filter(Boolean).join('') || '-';
    return loc;
  } catch {
    return '-';
  }
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
  } catch {
    return 300000;
  }
}

/**
 * 获取最大同时登录设备数，默认 Number.MAX_SAFE_INTEGER
 * @returns {Promise<number>}
 */
async function getMaxLoginDevices() {
  try {
    const cfg = await SystemConfig.findOne({ where: { code: 'max_login_devices' } });
    if (!cfg) {
      return Number.MAX_SAFE_INTEGER;
    }
    const data = JSON.parse(cfg.data || '{}');
    const n = Number(data.count);
    return n && n > 0 ? n : Number.MAX_SAFE_INTEGER;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

/**
 * 统计用户活跃会话数量（最近 30 天）
 * @param {number|string} userId 用户ID
 * @returns {Promise<number>} 活跃会话数量
 */
async function countActiveSessions(userId) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const logs = await SystemLog.findAll({
    where: { user_id: userId, action: ['login', 'heartbeat'], created_at: { [Op.gte]: since } },
    order: [['created_at', 'DESC']],
    limit: 1000
  });
  const sessionsMap = new Map();
  for (const log of logs) {
    const desc = log.description || '';
    const sidMatch = desc.match(/session:([0-9a-f-]+)/i);
    const sid = sidMatch ? sidMatch[1] : null;
    const key = sid || `${log.user_agent || ''}|${log.ip_address || ''}`;
    const item = sessionsMap.get(key) || { last_active: null, sid };
    const ts = new Date(log.created_at).toISOString();
    item.last_active = item.last_active && item.last_active > ts ? item.last_active : ts;
    sessionsMap.set(key, item);
  }
  // 考虑强制下线日志，剔除被强制的会话或用户
  const forcedLogs = await SystemLog.findAll({
    where: {
      user_id: userId,
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
    const sid2 = m ? m[1] : null;
    if (sid2) {
      const prev = sessionForceMap.get(sid2);
      const t = new Date(l.created_at).getTime();
      if (!prev || prev < t) {
        sessionForceMap.set(sid2, t);
      }
    }
  }
  const inactiveMs = await getInactiveMs();
  const nowMs = Date.now();
  let active = 0;
  for (const it of sessionsMap.values()) {
    const lastActiveMs = it.last_active ? new Date(it.last_active).getTime() : 0;
    let online = lastActiveMs ? nowMs - lastActiveMs < inactiveMs : false;
    const userForceMs = lastUserForce ? new Date(lastUserForce.created_at).getTime() : 0;
    if (userForceMs && lastActiveMs && userForceMs >= lastActiveMs) {
      online = false;
    }
    const sid = it.sid;
    if (sid && sessionForceMap.has(sid)) {
      const forceMs = sessionForceMap.get(sid);
      if (forceMs && lastActiveMs && forceMs >= lastActiveMs) {
        online = false;
      }
    }
    if (online) {
      active++;
    }
  }
  return active;
}
