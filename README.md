# JiYuCloud AI 全栈基础开发框架 · JiyuCloud AI Dev Base

一个基于 Vue 3 + Vite 前端、Node.js + Express 5 后端的通用型全栈基础开发框架。内置动态菜单路由、用户与权限管理、通知系统、文件上传、个性化设置（含音频优先级）、系统日志、字典管理等模块，并提供简洁的仪表盘与开发友好脚手架，适合作为企业应用的起步项目。

## 特性
- 动态菜单与路由注册，后端统一下发菜单定义
- 账号、角色、权限管理与会话控制
- 通知中心与 WebSocket 推送，支持未读数与高优提醒
- 个性化设置统一存储（JSON 字段），含通知音频用户>系统优先级
- 系统配置与站点图标（站点图标、Favicon 自动处理）
- 文件上传（头像、音频、站点图标）与安全校验
- 系统日志、部门、字典、菜单等通用后台模块
- 前后端测试与规范化：Vitest（前端）/ Jest（后端）、ESLint + Prettier（后端）

## 技术栈
- 前端：`Vue 3`、`Vite`、`Vue Router`、`Pinia`、`Ant Design Vue`、`Axios`
- 后端：`Node.js`、`Express 5`、`Sequelize`、`SQLite`（默认）/ 可切换其他 DB、`JWT`、`multer`、`ws`、`swagger-ui-express`
- 测试与规范：`Vitest`（前端）、`Jest`（后端）、`ESLint` + `Prettier`（后端）

## 开发软件与工具（推荐）
- IDE：`Trae IDE`、`VS Code`
- 运行环境：`Node.js >= 18`、`npm`
- 进程管理：`PM2`（可选）
- 数据库可视化：`DB Browser for SQLite` 或 `SQLiteStudio`
- 接口调试：`Postman` 或 `Insomnia`
- 版本管理：`Git`

## 快速开始
### 1. 后端启动
```bash
cd backend
npm install
npm run dev
```
- 生产模式：`npm run start` 或使用 `pm2:start`
- 环境变量：支持 `.env`（示例：JWT 密钥、数据库文件路径等），默认使用 SQLite

### 2. 前端启动
```bash
cd frontend
npm install
npm run dev
```
- 构建产物：`npm run build`，本地预览：`npm run preview`

### 3. 测试与规范
- 前端测试：`cd frontend && npm run test`
- 后端测试：`cd backend && npm run test`
- 后端代码规范与格式化：`npm run lint`、`npm run format`

## 关键能力与约定
- 动态菜单路由：路由创建前调用后端公开接口统一注册子路由，见 `frontend/src/router/index.js:10-20`
- 仪表盘（通用版）：展示模块数量与快捷入口，菜单来自后端定义，见 `frontend/src/views/dashboard/Workplace.vue:13-81`
- 个性化设置统一字段：用户模型以单一 `settings` JSON 字段存储所有设置，见 `backend/src/models/User.js:58`
- 菜单定义接口：`/public/menus/definitions`，调用见 `frontend/src/api/system/menu.js:4-6`
- 站点图标与 Favicon：上传并自动处理，后端路由见 `backend/src/routes/uploads.js`

## 目录概览
- `frontend/` 前端工程（Vue3 + Vite）
- `backend/` 后端服务（Express + Sequelize）
- `docs/` 设计与实现规划文档
- `AI_CONTEXT.md` AI 开发上下文与实现摘要（供继续基于本框架进行开发）

## 开源与许可
- 许可证：MIT（详见根目录 `LICENSE`）
- 欢迎 Issue 与 PR，建议遵循统一的编码规范与测试要求

## 社交与社区
- 微信号:yangjqllll 
![alt text](08431d1f55eae3c5316081fd179bd24d.jpg)
- Twitter/X: @your_handle
- Email: 17600013859@163.com
- QQ 群：156031642

## 致谢
- 本项目以提升企业应用开发效率为目标，感谢开源社区的卓越生态与贡献。
