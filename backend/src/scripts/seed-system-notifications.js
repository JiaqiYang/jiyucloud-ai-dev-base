const { SystemNotification, sequelize } = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    await SystemNotification.sync({ alter: true });
    const now = Date.now();
    const priorities = ['low', 'normal', 'high'];
    const statuses = ['draft', 'published', 'archived'];
    const receivers = ['all', 'admins', 'users'];
    const rows = [];
    for (let i = 1; i <= 20; i++) {
      rows.push({
        title: `通知标题 ${i}`,
        content: `这是第 ${i} 条系统通知的内容，包含说明与指引。`,
        receiver_type: receivers[i % receivers.length],
        priority: priorities[i % priorities.length],
        status: statuses[i % statuses.length],
        start_time: new Date(now - i * 3600 * 1000),
        end_time: new Date(now + i * 3600 * 1000),
        created_by: 1
      });
    }
    await SystemNotification.bulkCreate(rows);
    console.log('✓ 系统通知测试数据已生成: 20 条');
    process.exit(0);
  } catch (e) {
    console.error('种子数据生成失败', e);
    process.exit(1);
  }
}

seed();
