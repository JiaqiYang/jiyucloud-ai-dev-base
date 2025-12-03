# 系统通知 API 文档

## GET `/api/notifications/unread-count`

- 说明：返回当前登录用户的未读系统通知数量。
- 未读定义：
  - 通知 `status` 为 `published`；
  - 当前时间在通知的有效期内（`start_time` 为空或不晚于当前时间，且 `end_time` 为空或不早于当前时间）；
  - 若通知配置了 `department_ids`，仅目标部门用户可见；未配置或为空数组视为全员可见；
  - 用户未在 `user_notification_reads` 中存在对应的 `notification_id` 记录。
- 请求头：`Authorization: Bearer <token>`（必需）
- 响应：
  - 成功：`{ "count": number }`
  - 失败：`{ "error": string }`，可能的错误码：
    - 401 未登录或令牌无效
    - 500 服务器内部错误

### 查询逻辑与性能

- 数据来源：`system_notifications` 与 `user_notification_reads`。
- 过滤顺序：
  1. 数据库初步筛选：`status='published'` 且时间窗口有效；
  2. 如用户有 `department_id`，在数据库侧使用 `LIKE` 模式对 `department_ids` 进行粗过滤（包含 `null`、`'[]'` 与包含目标部门ID的字符串），减少数据量；
  3. 代码层精确过滤：解析 `department_ids` JSON 字符串，确认是否包含用户部门；
  4. 查询用户已读集合并排除已读。
- 性能目标：典型数据量（≤1万条）场景下，接口响应时间 ≤ 100ms（在开启索引与合理连接池配置的前提下）。

### 日志

- 服务端日志包含：查询用户信息（ID/部门）、候选数量、最终未读数量。
  - 示例：
    - `[UnreadCount] user: { id: 12, dept: 3 }`
    - `[UnreadCount] rawCandidates: 45`
    - `[UnreadCount] finalCount: 12`

### 示例

```
GET /api/notifications/unread-count
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

200 OK
{ "count": 3 }
```

