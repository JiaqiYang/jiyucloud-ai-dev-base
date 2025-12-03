# AI 开发上下文与实现摘要

本文档汇总此前的 AI 辅助开发上下文与关键实现，便于后续在该 AI 开发框架上继续演进功能。

## 时间线与改动摘要
- 个性化通知音：新增用户通知音设置与优先级（用户 > 系统）
  - 用户模型扩展了 4 个音频字段与播放优先逻辑
- 字段整合：将用户模型的 4 个音频字段合并为单一 JSON `settings` 字段
  - 后端统一存储 JSON 字符串，前端序列化/反序列化
  - 保存/读取逻辑更新，所有用户设置统一入 `settings`
- 菜单与预览：将“个性化设置”菜单移到“修改密码”下方
  - 未设置时，支持预览系统默认声音文件（回显）
- 仪表盘重置：恢复为通用基础开发框架的仪表盘
  - 显示模块数量、快捷入口、项目模块列表，去除特定业务统计
- 动态路由：前端在创建路由前统一加载后端菜单定义并注册

## 关键文件与代码位置
- 用户模型设置字段：`backend/src/models/User.js:58`（`settings` JSON）
- 动态菜单 API：`frontend/src/api/system/menu.js:4-6`
- 路由动态注册：`frontend/src/router/index.js:10-20`
- 仪表盘（通用版）：`frontend/src/views/dashboard/Workplace.vue:13-95`
- 基础布局与通知逻辑：`frontend/src/layouts/BasicLayout.vue:35-1345`

## 重要实现说明
- 用户设置统一字段
  - 模型：`settings: TEXT` 存储 JSON 字符串
  - 前端：读取/写入时进行 JSON 序列化/反序列化
- 声音播放优先级（用户 > 系统）
  - 表单预览与实际播放优先检查用户设置；未设置时回退系统配置并可试听
- 动态菜单与路由
  - 启动时获取 `/public/menus/definitions`
  - 根据 `component` 动态映射 `viewModules` 并注册为根布局子路由
- 仪表盘重置
  - 概览区：模块数、在线用户、未读通知、错误日志（后两者为占位，待接入）
  - 快捷入口：取菜单前若干项，点击跳转路由
  - 模块列表：展示菜单定义的 `title/key/path/component`

## 后续接入建议
- 在线用户统计：后端增加会话或在线状态统计接口，前端赋值 `overview.onlineUsers`
- 未读通知计数：复用/新增接口（如 `/api/notifications/unread-count`）更新 `overview.unreadNotifications`
- 错误日志计数：从日志模块按条件统计并赋值 `overview.errorLogs`
- 菜单标题规范：后端菜单定义统一提供 `title` 字段，避免前端降级为 `key/path`

## 开发命令与校验
- 前端：`npm run dev`、`npm run build`、`npm run test`
- 后端：`npm run dev`、`npm run start`、`npm run test`、`npm run lint`、`npm run format`
- 产物构建验证：`frontend` 已通过 `npm run build` 构建产物生成

## 使用说明（面向继续开发）
- 新增页面：后端新增菜单定义并指定 `component`（相对 `src/views`），前端无需改路由，自动注册
- 新增设置项：统一加入 `User.settings` JSON 并在前端读写同一字段
- 新增通知类型：复用通知中心与 WebSocket 推送机制，前端维护类型映射与颜色
- 新增系统配置：使用 `SystemConfig` 模型与 `configController` 读取配置

---

以上内容为继续在该 AI 开发框架上进行功能扩展的核心上下文与约定。若需补充，请在 `docs/` 中追加专题文档并在此处关联链接即可。
