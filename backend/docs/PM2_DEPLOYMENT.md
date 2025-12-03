# PM2 Cluster 模式部署指南

## 概述

本项目已配置 PM2 Cluster 模式，可以充分利用多核 CPU，提升系统并发处理能力。

---

## 安装 PM2

### 全局安装（推荐）

```bash
npm install pm2 -g
```

### 项目本地安装

```bash
npm install pm2 --save-dev
```

---

## 配置说明

### ecosystem.config.js

PM2 配置文件位于项目根目录：`backend/ecosystem.config.js`

**关键配置**:

| 配置项 | 值 | 说明 |
|-------|---|------|
| `instances` | `'max'` | 根据 CPU 核心数自动创建实例 |
| `exec_mode` | `'cluster'` | 集群模式 |
| `max_memory_restart` | `'1G'` | 内存超过 1GB 自动重启 |
| `autorestart` | `true` | 异常退出自动重启 |
| `watch` | `false` | 生产环境禁用文件监控 |

---

## 使用方法

### 启动服务

```bash
# 开发环境
npm run pm2:start

# 或直接使用 PM2
pm2 start ecosystem.config.js
```

### 重启服务

```bash
npm run pm2:restart
```

### 停止服务

```bash
npm run pm2:stop
```

### 删除进程

```bash
npm run pm2:delete
```

### 查看日志

```bash
# 实时查看日志
npm run pm2:logs

# 或使用 PM2 命令
pm2 logs cemetery-backend
```

### 监控状态

```bash
# 查看进程状态
npm run pm2:status

# 实时监控（CPU、内存等）
npm run pm2:monit
```

---

## PM2 Cluster 模式优势

### 1. 多核 CPU 利用

- **单进程模式**: 只能使用 1 个 CPU 核心
- **Cluster 模式**: 自动创建多个进程，充分利用所有 CPU 核心

**示例**:
- 4核 CPU → 4个进程
- 8核 CPU → 8个进程

### 2. 高可用性

- 单个进程崩溃不影响其他进程
- 自动重启故障进程
- 零停机重启（`pm2 reload`）

### 3. 负载均衡

PM2 自动在多个进程间分配请求，提升并发处理能力

### 4. 进程管理

- 自动重启
- 内存监控
- 日志管理
- 性能监控

---

## 常用命令

### 进程管理

```bash
# 启动
pm2 start ecosystem.config.js

# 重启（有停机时间）
pm2 restart cemetery-backend

# 重载（零停机）
pm2 reload cemetery-backend

# 停止
pm2 stop cemetery-backend

# 删除
pm2 delete cemetery-backend

# 停止所有
pm2 stop all

# 删除所有
pm2 delete all
```

### 监控与日志

```bash
# 查看所有进程状态
pm2 status
pm2 list

# 实时监控
pm2 monit

# 查看日志
pm2 logs cemetery-backend

# 清空日志
pm2 flush

# 查看特定进程信息
pm2 show cemetery-backend
```

### 持久化

```bash
# 保存当前进程列表
pm2 save

# 设置开机自启
pm2 startup

# 取消开机自启
pm2 unstartup
```

---

## 性能对比

### 单进程 vs Cluster 模式

| 指标 | 单进程 | Cluster (4核) | 提升 |
|------|--------|--------------|-----|
| CPU 利用率 | 25% | 100% | 4× |
| 并发请求 | 100 QPS | 400 QPS | 4× |
| 故障恢复 | 手动 | 自动 | ✅ |
| 零停机部署 | ❌ | ✅ | ✅ |

---

## 环境变量

### 开发环境

```bash
pm2 start ecosystem.config.js --env development
```

### 生产环境

```bash
pm2 start ecosystem.config.js --env production
```

---

## 日志管理

### 日志位置

- 错误日志: `backend/logs/err.log`
- 输出日志: `backend/logs/out.log`

### 日志轮转

**安装 PM2 日志轮转模块**:

```bash
pm2 install pm2-logrotate
```

**配置**:

```bash
# 设置最大日志大小（默认 10M）
pm2 set pm2-logrotate:max_size 10M

# 设置保留的日志文件数量（默认 10）
pm2 set pm2-logrotate:retain 30

# 设置日志压缩
pm2 set pm2-logrotate:compress true

# 设置轮转时间间隔
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```

---

## 监控与告警

### PM2 Plus（可选）

PM2 Plus 提供高级监控功能：

1. 实时性能监控
2. 异常告警
3. 自定义指标
4. 历史数据

**注册**: https://pm2.io/

**连接**:

```bash
pm2 link <secret_key> <public_key>
```

---

## 生产环境建议

### 1. 系统配置

```bash
# 增加文件描述符限制
ulimit -n 65536

# 永久设置（编辑 /etc/security/limits.conf）
* soft nofile 65536
* hard nofile 65536
```

### 2. 进程数量

```javascript
// ecosystem.config.js
instances: process.env.NODE_ENV === 'production' ? 'max' : 2
```

**建议**:
- 开发环境: 1-2 个实例
- 生产环境: `'max'`（CPU 核心数）

### 3. 内存管理

```javascript
max_memory_restart: '1G'
```

根据实际情况调整内存限制。

### 4. 优雅关闭

确保应用支持优雅关闭：

```javascript
// src/app.js
process.on('SIGINT', async () => {
  console.log('收到 SIGINT 信号，准备关闭...');
  await sequelize.close();
  process.exit(0);
});
```

---

## 故障排查

### 进程不断重启

**原因**: 应用启动失败或内存超限

**解决**:
```bash
# 查看日志
pm2 logs cemetery-backend --lines 100

# 检查内存使用
pm2 monit

# 增加内存限制
# 修改 ecosystem.config.js 中的 max_memory_restart
```

### 日志文件过大

**解决**:
```bash
# 安装日志轮转
pm2 install pm2-logrotate

# 清空日志
pm2 flush
```

### 端口被占用

**解决**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

---

## 测试 Cluster 模式

### 1. 启动服务

```bash
npm run pm2:start
```

### 2. 查看进程

```bash
pm2 status
```

应该看到多个进程在运行（根据 CPU 核心数）。

### 3. 压力测试

```bash
# 运行之前的压力测试
npx artillery run load-test.yml
```

### 4. 监控性能

```bash
# 实时监控
pm2 monit
```

观察：
- CPU 使用率应该分布在多个核心
- 内存使用稳定
- 请求分布均匀

---

## 部署检查清单

- [ ] PM2 已全局安装
- [ ] ecosystem.config.js 配置正确
- [ ] 日志目录已创建
- [ ] 环境变量已设置
- [ ] 数据库连接正常
- [ ] 进程成功启动（`pm2 status`）
- [ ] 日志无错误（`pm2 logs`）
- [ ] 压力测试通过
- [ ] 监控正常（`pm2 monit`）
- [ ] 已保存进程列表（`pm2 save`）
- [ ] 已设置开机自启（可选，`pm2 startup`）

---

## 总结

PM2 Cluster 模式为应用提供了：

✅ **高性能**: 充分利用多核 CPU  
✅ **高可用**: 自动重启，零停机部署  
✅ **易管理**: 统一的进程管理  
✅ **可监控**: 实时性能监控  

建议在生产环境使用 PM2 Cluster 模式部署！
