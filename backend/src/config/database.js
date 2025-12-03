const { Sequelize } = require('sequelize');
const path = require('path');

// 确保数据库目录存在
const dbPath = path.join(__dirname, '../database/cemetery.db');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false, // 关闭SQL日志，生产环境可开启
  define: {
    timestamps: true, // 自动添加 created_at 和 updated_at
    underscored: true // 使用下划线命名字段
  }
});

module.exports = sequelize;
