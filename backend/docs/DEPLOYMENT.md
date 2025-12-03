# 公墓管理系统 - 部署指南

## 系统要求

### 硬件要求

- **CPU**: 4核及以上（推荐8核）
- **内存**: 8GB及以上（推荐16GB）
- **硬盘**: 100GB及以上 SSD

### 软件要求

- **Node.js**: v18.x 或更高版本
- **npm**: v9.x 或更高版本
- **PM2**: v5.x 或更高版本
- **数据库**: PostgreSQL 14+ 或 MySQL 8.0+（生产环境）
- **操作系统**: Linux（推荐Ubuntu 20.04/22.04）或 Windows Server

---

## 部署步骤

### 1. 环境准备

#### 安装 Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v
npm -v
```

#### 安装 PM2

```bash
npm install pm2 -g

# 验证安装
pm2 -v
```

### 2. 克隆项目

```bash
git clone <repository-url>
cd gongmu/backend
```

### 3. 安装依赖

```bash
npm install --production
```

### 4. 配置环境变量

创建 `.env` 文件：

```bash
# 服务器配置
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cemetery_db
DB_USER=cemetery_user
DB_PASSWORD=your_secure_password

# JWT 配置
JWT_SECRET=your_jwt_secret_key_min_32_characters

# 其他配置
LOG_LEVEL=info
```

### 5. 数据库迁移

#### PostgreSQL

```bash
# 创建数据库
createdb cemetery_db

# 运行迁移
npm run migrate

# 初始化数据（可选）
npm run seed
```

### 6. 启动服务

```bash
# 使用 PM2 启动
npm run pm2:start

# 查看状态
npm run pm2:status

# 查看日志
npm run pm2:logs
```

### 7. 设置开机自启

```bash
# 保存当前进程列表
pm2 save

# 设置开机自启
pm2 startup

# 按照输出的命令执行
```

---

## 生产环境优化

### 1. 数据库优化

#### PostgreSQL 配置

编辑 `/etc/postgresql/14/main/postgresql.conf`:

```conf
# 连接数
max_connections = 200

# 内存
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
work_mem = 16MB

# 日志
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
```

#### 创建索引

索引已在数据库迁移中自动创建，包括：

- cemetery_plots: status, area_id, cemetery_id, plot_number
- customers: phone, id_card
- orders: customer_id, order_date, status, payment_status
- payments: order_id, payment_date
- cemetery_areas: cemetery_id

### 2. 反向代理（Nginx）

安装 Nginx:

```bash
sudo apt-get install nginx
```

配置文件 `/etc/nginx/sites-available/cemetery`:

```nginx
upstream cemetery_backend {
    least_conn;
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 日志
    access_log /var/log/nginx/cemetery_access.log;
    error_log /var/log/nginx/cemetery_error.log;

    # 限制请求大小
    client_max_body_size 10M;

    location / {
        proxy_pass http://cemetery_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/cemetery /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. SSL/TLS 配置

使用 Let's Encrypt:

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 4. 防火墙配置

```bash
# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable
```

---

## 监控与日志

### 1. PM2 监控

```bash
# 实时监控
pm2 monit

# 查看日志
pm2 logs

# 查看特定日志
pm2 logs cemetery-backend --lines 100
```

### 2. 系统监控

推荐使用：
- **PM2 Plus**: https://pm2.io/
- **Prometheus + Grafana**
- **New Relic**
- **DataDog**

### 3. 日志管理

#### 日志轮转

```bash
# 安装 PM2 日志轮转
pm2 install pm2-logrotate

# 配置
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

---

## 备份策略

### 1. 数据库备份

#### 自动备份脚本

创建 `/opt/backup/backup-db.sh`:

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backup/database"
DB_NAME="cemetery_db"

mkdir -p $BACKUP_DIR

# PostgreSQL 备份
pg_dump $DB_NAME | gzip > $BACKUP_DIR/cemetery_db_$DATE.sql.gz

# 保留最近30天的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "数据库备份完成: cemetery_db_$DATE.sql.gz"
```

#### 设置定时任务

```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨2点备份
0 2 * * * /opt/backup/backup-db.sh >> /var/log/backup.log 2>&1
```

### 2. 文件备份

```bash
# 备份上传文件
rsync -avz /path/to/backend/uploads /path/to/backup/

# 备份配置文件
rsync -avz /path/to/backend/.env /path/to/backup/
```

---

## 性能优化

### 1. Node.js 优化

```bash
# 增加 V8 内存限制（在 ecosystem.config.js 中）
node_args: '--max-old-space-size=4096'
```

### 2. 数据库连接池

配置 Sequelize 连接池（已在代码中配置）:

```javascript
pool: {
  max: 20,
  min: 5,
  acquire: 30000,
  idle: 10000
}
```

### 3. 缓存策略

推荐使用 Redis:

```bash
# 安装 Redis
sudo apt-get install redis-server

# 启动 Redis
sudo systemctl start redis
sudo systemctl enable redis
```

---

## 故障排查

### 常见问题

#### 1. 服务无法启动

```bash
# 查看日志
pm2 logs cemetery-backend

# 检查端口占用
netstat -tulpn | grep 3000

# 检查配置文件
cat .env
```

#### 2. 数据库连接失败

```bash
# 检查数据库状态
sudo systemctl status postgresql

# 测试连接
psql -U cemetery_user -d cemetery_db

# 检查防火墙
sudo ufw status
```

#### 3. 内存不足

```bash
# 查看内存使用
free -h

# 增加 swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 安全检查清单

- [ ] 数据库使用强密码
- [ ] JWT_SECRET 使用随机字符串
- [ ] 配置防火墙
- [ ] 启用 HTTPS
- [ ] 定期更新依赖（`npm audit`）
- [ ] 配置日志轮转
- [ ] 设置备份策略
- [ ] 限制文件上传大小
- [ ] 配置 Rate Limiting
- [ ] 启用 CORS 白名单

---

## 更新部署

### 零停机更新

```bash
# 拉取最新代码
git pull origin main

# 安装依赖
npm install --production

# 重载服务（零停机）
pm2 reload ecosystem.config.js

# 查看状态
pm2 status
```

---

## 回滚策略

### 快速回滚

```bash
# 回到上一个版本
git checkout <previous-commit>

# 安装依赖
npm install --production

# 重启服务
pm2 restart ecosystem.config.js
```

---

## 联系支持

遇到问题请查看：
- 项目文档: `/docs`
- GitHub Issues
- 技术支持邮箱

---

**部署完成后，请进行完整的功能测试和压力测试！**
