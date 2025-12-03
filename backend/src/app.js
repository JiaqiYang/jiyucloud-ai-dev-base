const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const sequelize = require('./config/database');

const authRoutes = require('./routes/auth');

// 加载环境变量
dotenv.config();

const app = express();
// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 开发/测试环境开放 Swagger 文档
try {
  if (process.env.NODE_ENV !== 'production') {
    const swaggerUi = require('swagger-ui-express');
    const YAML = require('yamljs');
    const openapi = YAML.load(path.join(__dirname, '../openapi.yaml'));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
  }
} catch {}

// 基础路由
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Cemetery Management System API' });
});

// API 路由
app.use('/api/auth', authRoutes);

// 验证码路由
const captchaRoutes = require('./routes/captcha');
app.use('/api/captcha', captchaRoutes);

// 系统管理路由
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const logRoutes = require('./routes/logs');
const menuController = require('./controllers/menuController');

app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/logs', logRoutes);

// 公开菜单定义接口（免登录，仅此端点）
app.get('/api/public/menus/definitions', menuController.definitions);

// 字典管理路由
const dictTypeRoutes = require('./routes/dicts');
const dictItemRoutes = require('./routes/dict-items');
const uploadRoutes = require('./routes/uploads');
const menuRoutes = require('./routes/menus');
const configRoutes = require('./routes/configs');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
// 部门管理路由
const departmentRoutes = require('./routes/departments');
app.use('/api/dicts', dictTypeRoutes);
app.use('/api/dict-items', dictItemRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/configs', configRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/departments', departmentRoutes);

// 公共站点信息接口与 favicon
app.get('/api/public/site/meta', async (req, res) => {
  try {
    const { getMeta } = require('./services/siteIconService');
    const meta = await getMeta();
    res.json(meta);
  } catch {
    res.json({ name: 'JiyuCloud', icon: null });
  }
});
app.get('/api/public/favicon.ico', async (req, res) => {
  try {
    const pathModule = require('path');
    const fs = require('fs');
    const { SystemConfig } = require('./models');
    const favCfg = await SystemConfig.findOne({ where: { code: 'site_favicon' } });
    if (favCfg) {
      try {
        const d = JSON.parse(favCfg.data || '{}');
        const p = String(d.favicon || '');
        if (p) {
          res.set('Cache-Control', 'no-cache, must-revalidate');
          const uploadRoot = pathModule.join(__dirname, '../uploads');
          const rel = p.replace('/uploads/', '');
          const abs = pathModule.join(uploadRoot, rel);
          if (fs.existsSync(abs)) {
            return res.sendFile(abs);
          }
        }
      } catch {}
    }
    const uploadRoot = pathModule.join(__dirname, '../uploads');
    const siteDir = pathModule.join(uploadRoot, 'site');
    const files = fs
      .readdirSync(siteDir)
      .filter(f => /\.ico$/i.test(f))
      .sort();
    const latest = files[files.length - 1];
    if (latest) {
      res.set('Cache-Control', 'no-cache, must-revalidate');
      return res.sendFile(pathModule.join(siteDir, latest));
    }
  } catch {}
  res.status(404).end();
});

// 统一错误处理中间件（应当置于所有路由之后）
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

const {
  Department,
  SystemLog,
  Menu,
  SystemConfig,
  RoleMenu,
  SystemNotification,
  MessageRecord,
  User,
  Role,
  DictionaryType,
  DictionaryItem,
  UserNotificationRead
} = require('./models');
// 数据库连接测试并启动服务器
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    const dialect = sequelize.getDialect();
    if (dialect === 'sqlite') {
      try {
        await sequelize.query('PRAGMA foreign_keys = OFF');
      } catch {}
    }

    async function safeSync(model) {
      try {
        await model.sync({ alter: true });
      } catch (e) {
        if (dialect === 'sqlite') {
          await model.sync();
        } else {
          throw e;
        }
      }
    }
    await safeSync(Department);
    await safeSync(Menu);
    await safeSync(SystemLog);
    await safeSync(SystemConfig);
    await safeSync(User);
    await safeSync(Role);
    await safeSync(DictionaryType);
    await safeSync(DictionaryItem);
    await safeSync(UserNotificationRead);
    await safeSync(RoleMenu);
    await safeSync(SystemNotification);
    await safeSync(MessageRecord);
    console.log('Database models synchronized successfully.');
    // 初始化通知中心
    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || '0.0.0.0';
    const http = require('http');
    const server = http.createServer(app);
    try {
      const hub = require('./services/notificationHub');
      hub.init(server);
    } catch {}
    // 启动 HTTP 服务器
    server.listen(PORT, HOST, () => {
      const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
      console.log('HTTP server listening', { url: `http://${displayHost}:${PORT}` });
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

startServer();
/**
 * 文件: backend/src/app.js
 * 描述: Express 应用入口，注册中间件与路由，启动 HTTP 服务。
 * 作者: 项目组
 * 创建日期: 2025-11-25
 * 修改日期: 2025-11-25
 * 版本: v1.0.0
 * 版权: Copyright (c) 2025 JiyuCloud
 */
