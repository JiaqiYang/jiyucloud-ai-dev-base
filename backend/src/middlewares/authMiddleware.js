/**
 * 鉴权中间件
 * - 从请求头读取 Bearer Token
 * - 验证并解析 JWT（包含用户 id 与角色）
 * - 读取数据库用户信息与角色权限，挂载到 req 上下文
 * - 对过期、无效令牌与禁用账号进行拦截
 * @param {import('express').Request} req 请求对象
 * @param {import('express').Response} res 响应对象
 * @param {Function} next 下一步回调
 */
const jwt = require('jsonwebtoken');
const { User, Role, SystemLog } = require('../models');
const SystemConfig = require('../models/SystemConfig');

const authMiddleware = async (req, res, next) => {
  try {
    // 1. 获取 Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.split(' ')[1];

    // 2. 验证 Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // 3. 获取用户信息 (包含角色)
    const user = await User.findByPk(decoded.id, {
      include: [
        {
          model: Role
        }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: '用户不存在或已失效' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: '账号已被禁用' });
    }

    const lastForce = await SystemLog.findOne({
      where: { user_id: user.id, action: 'force_logout' },
      order: [['created_at', 'DESC']]
    });
    if (lastForce) {
      const tokenIatMs = (decoded.iat || 0) * 1000;
      const forceAtMs = new Date(lastForce.created_at).getTime();
      if (tokenIatMs < forceAtMs) {
        return res.status(401).json({ error: '用户已被强制下线' });
      }
    }

    if (decoded.jti) {
      const kickedSession = await SystemLog.findOne({
        where: {
          user_id: user.id,
          action: 'force_logout_session',
          description: `session:${decoded.jti}`
        },
        order: [['created_at', 'DESC']]
      });
      if (kickedSession) {
        return res.status(401).json({ error: '当前设备会话已被强制下线' });
      }
    }

    const lastLogout = await SystemLog.findOne({
      where: { user_id: user.id, action: 'logout' },
      order: [['created_at', 'DESC']]
    });
    if (lastLogout) {
      const tokenIatMs = (decoded.iat || 0) * 1000;
      const logoutAtMs = new Date(lastLogout.created_at).getTime();
      if (tokenIatMs < logoutAtMs) {
        return res.status(401).json({ error: '令牌已失效，请重新登录' });
      }
    }

    let inactiveMs = 300000;
    try {
      const cfg = await SystemConfig.findOne({ where: { code: 'auto_logout' } });
      if (cfg) {
        const data = JSON.parse(cfg.data || '{}');
        const ms = Number(data.inactive_ms);
        if (ms && ms > 0) {
          inactiveMs = ms;
        }
      }
    } catch {}
    const lastActive = await SystemLog.findOne({
      where: { user_id: user.id, action: ['heartbeat', 'login'] },
      order: [['created_at', 'DESC']]
    });
    const lastActiveMs = lastActive
      ? new Date(lastActive.created_at).getTime()
      : user.last_login
        ? new Date(user.last_login).getTime()
        : (decoded.iat || 0) * 1000;
    if (lastActiveMs && Date.now() - lastActiveMs >= inactiveMs) {
      return res.status(401).json({ error: '长时间未操作，请重新登录' });
    }

    // 4. 将用户信息挂载到 req 对象
    req.user = user;
    req.tokenPayload = decoded;
    req.userPermissions = [];

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '令牌已过期' });
    }
    return res.status(401).json({ error: '无效的令牌' });
  }
};

module.exports = authMiddleware;
/**
 * 文件: backend/src/middlewares/authMiddleware.js
 * 描述: 认证鉴权中间件，校验 JWT 并挂载用户与角色权限到请求上下文。
 * 作者: 项目组
 * 创建日期: 2025-11-25
 * 修改日期: 2025-11-25
 * 版本: v1.0.0
 * 版权: Copyright (c) 2025 JiyuCloud
 */
