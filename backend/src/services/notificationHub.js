let wss;
const clientsByUser = new Map();
const { SystemNotification, User } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

async function computeUnreadCount() {
  const now = new Date();
  return await SystemNotification.count({
    where: {
      status: 'published',
      [Op.and]: [
        { [Op.or]: [{ start_time: null }, { start_time: { [Op.lte]: now } }] },
        { [Op.or]: [{ end_time: null }, { end_time: { [Op.gte]: now } }] }
      ]
    }
  });
}

function init(server) {
  const { Server } = require('ws');
  wss = new Server({ server, path: '/ws/notifications' });
  wss.on('connection', async (ws, req) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      let userId = null;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          userId = decoded?.id || null;
        } catch {}
      }
      if (userId) {
        ws.userId = userId;
        const set = clientsByUser.get(userId) || new Set();
        set.add(ws);
        clientsByUser.set(userId, set);
        ws.on('close', () => {
          try {
            const s = clientsByUser.get(userId);
            if (s) {
              s.delete(ws);
              if (s.size === 0) clientsByUser.delete(userId);
            }
          } catch {}
        });
      }
      const count = await computeUnreadCount();
      ws.send(JSON.stringify({ type: 'count', count }));
    } catch {}
  });
}

async function broadcastCount() {
  if (!wss) return;
  const count = await computeUnreadCount();
  const msg = JSON.stringify({ type: 'count', count });
  wss.clients.forEach((client) => {
    try { client.send(msg); } catch {}
  });
}

function broadcastRefresh() {
  if (!wss) return;
  const msg = JSON.stringify({ type: 'refresh' });
  wss.clients.forEach((client) => {
    try { client.send(msg); } catch {}
  });
}

function sendMessageToUser(userId, payload) {
  if (!wss || !userId) return;
  const set = clientsByUser.get(Number(userId));
  if (!set || set.size === 0) return;
  const msg = JSON.stringify(payload);
  set.forEach(ws => { try { ws.send(msg); } catch {} });
}

module.exports = { init, broadcastCount, broadcastRefresh, sendMessageToUser };
