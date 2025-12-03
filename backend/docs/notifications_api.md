# 系统通知 API

## 模型字段
- `id` 主键
- `title` 标题
- `content` 内容
- `receiver_type` 接收对象: `all|admins|users`
- `priority` 优先级: `low|normal|high`
- `status` 状态: `draft|published|archived`
- `start_time` 生效开始时间
- `end_time` 生效结束时间
- `created_by` 创建人用户ID
- `created_at` 创建时间
- `updated_at` 更新时间

## 接口

### GET `/api/notifications`
- 查询参数: `page`, `pageSize`, `keyword`, `status`, `priority`, `receiver_type`, `valid`(true 仅有效期内)
- 响应: `{ list: SystemNotification[], total, page, pageSize }`
- 权限: `notification:read`

### POST `/api/notifications`
- 请求体: `{ title, content, receiver_type, priority, status, start_time?, end_time? }`
- 响应: 创建后的对象
- 权限: `notification:create`

### GET `/api/notifications/{id}`
- 权限: `notification:read`

### PUT `/api/notifications/{id}`
- 请求体: 与创建相同字段
- 权限: `notification:update`

### DELETE `/api/notifications/{id}`
- 权限: `notification:delete`

### POST `/api/notifications/batch-delete`
- 请求体: `{ ids: number[] }`
- 权限: `notification:delete`

## 说明
- 列表默认按 `created_at` 倒序
- `valid=true` 时根据 `start_time`/`end_time` 判断是否在有效期
