const { sequelize } = require('../models');

async function addIndexes() {
  try {
    console.log('开始添加数据库索引...');

    // 墓位表索引
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_cemetery_plots_status 
      ON cemetery_plots(status);
    `);
    console.log('✓ 添加墓位状态索引');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_cemetery_plots_area 
      ON cemetery_plots(area_id);
    `);
    console.log('✓ 添加墓位墓区索引');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_cemetery_plots_cemetery 
      ON cemetery_plots(cemetery_id);
    `);
    console.log('✓ 添加墓位墓园索引');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_cemetery_plots_plot_number 
      ON cemetery_plots(plot_number);
    `);
    console.log('✓ 添加墓位编号索引');

    // 客户表索引
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_phone 
      ON customers(phone);
    `);
    console.log('✓ 添加客户电话索引');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_id_card 
      ON customers(id_card);
    `);
    console.log('✓ 添加客户身份证索引');

    // 订单表索引
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_customer 
      ON orders(customer_id);
    `);
    console.log('✓ 添加订单客户索引');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_date 
      ON orders(order_date);
    `);
    console.log('✓ 添加订单日期索引');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status 
      ON orders(status);
    `);
    console.log('✓ 添加订单状态索引');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
      ON orders(payment_status);
    `);
    console.log('✓ 添加订单支付状态索引');

    // 支付表索引
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_order 
      ON payments(order_id);
    `);
    console.log('✓ 添加支付订单索引');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_date 
      ON payments(payment_date);
    `);
    console.log('✓ 添加支付日期索引');

    // 墓区表索引
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_cemetery_areas_cemetery 
      ON cemetery_areas(cemetery_id);
    `);
    console.log('✓ 添加墓区墓园索引');

    console.log('\n✅ 所有索引添加完成！');
  } catch (error) {
    console.error('添加索引时出错:', error);
  } finally {
    process.exit();
  }
}

addIndexes();
