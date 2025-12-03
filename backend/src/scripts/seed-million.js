const {
  sequelize,
  Cemetery,
  CemeteryArea,
  CemeteryPlot,
  FamilyTomb,
  Customer,
  Order,
  Contract,
  Payment
} = require('../models');

async function seedMillionData() {
  try {
    console.log('开始生成100万条测试数据...');
    console.log('警告：这将需要较长时间，请耐心等待...\n');

    // 获取现有墓园
    let cemetery = await Cemetery.findOne();
    if (!cemetery) {
      console.log('未找到墓园，创建新墓园...');
      cemetery = await Cemetery.create({
        name: '万安陵园',
        code: 'WALY',
        city: '北京',
        status: 'active'
      });
    }

    // 1. 生成100万条墓位数据
    console.log('\n=== 第1步：生成100万条墓位数据 ===');

    // 策略：创建 100 个墓区，每个墓区 100 排，每排 100 个墓位 = 100 * 100 * 100 = 1,000,000
    const TOTAL_AREAS = 100;
    const ROWS_PER_AREA = 100;
    const COLS_PER_ROW = 100;
    const BATCH_SIZE = 5000;

    // 创建墓区
    console.log('创建墓区...');
    const areasData = [];
    for (let i = 1; i <= TOTAL_AREAS; i++) {
      areasData.push({
        cemetery_id: cemetery.id,
        name: `大规模测试墓区-${String(i).padStart(3, '0')}`,
        code: `T${String(i).padStart(3, '0')}`,
        area_type: 'normal',
        total_plots: ROWS_PER_AREA * COLS_PER_ROW,
        available_plots: Math.floor(ROWS_PER_AREA * COLS_PER_ROW * 0.7) // 70%可用
      });
    }

    const areas = await CemeteryArea.bulkCreate(areasData);
    console.log(`✓ 已创建 ${areas.length} 个墓区`);

    // 生成墓位
    console.log('\n开始生成墓位（这将需要较长时间）...');
    let totalPlotsCreated = 0;
    let plotsBatch = [];
    const startTime = Date.now();

    for (const area of areas) {
      const areaIndex = areas.indexOf(area) + 1;
      process.stdout.write(`\r正在处理墓区 ${areaIndex}/${areas.length}...`);

      for (let r = 1; r <= ROWS_PER_AREA; r++) {
        for (let c = 1; c <= COLS_PER_ROW; c++) {
          const rand = Math.random();
          plotsBatch.push({
            cemetery_id: cemetery.id,
            area_id: area.id,
            plot_number: `${area.code}-${String(r).padStart(3, '0')}-${String(c).padStart(3, '0')}`,
            row_id: r,
            row_name: `第${r}排`,
            column_id: c,
            column_name: `${c}号`,
            custom_name: `${area.name} ${r}排${c}号`,
            plot_type: 'single',
            base_price: 40000 + Math.random() * 20000,
            current_price: 40000 + Math.random() * 20000,
            status: rand > 0.7 ? (rand > 0.85 ? 'sold' : 'reserved') : 'available',
            position_x: (c - 1) * 1.2,
            position_y: (r - 1) * 1.5
          });

          if (plotsBatch.length >= BATCH_SIZE) {
            await CemeteryPlot.bulkCreate(plotsBatch);
            totalPlotsCreated += plotsBatch.length;
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const rate = (totalPlotsCreated / elapsed).toFixed(0);
            process.stdout.write(
              `\r已生成墓位: ${totalPlotsCreated.toLocaleString()} (${rate}/秒, 用时${elapsed}秒)`
            );
            plotsBatch = [];
          }
        }
      }
    }

    // 插入剩余数据
    if (plotsBatch.length > 0) {
      await CemeteryPlot.bulkCreate(plotsBatch);
      totalPlotsCreated += plotsBatch.length;
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `\n✓ 墓位生成完成！总计: ${totalPlotsCreated.toLocaleString()} 条，用时: ${totalTime}秒`
    );

    // 2. 生成客户数据
    console.log('\n=== 第2步：生成客户数据 ===');
    const TOTAL_CUSTOMERS = 100000; // 10万客户
    const customersData = [];

    console.log(`生成 ${TOTAL_CUSTOMERS.toLocaleString()} 个客户...`);
    for (let i = 1; i <= TOTAL_CUSTOMERS; i++) {
      customersData.push({
        name: `大规模测试客户${i}`,
        gender: Math.random() > 0.5 ? '男' : '女',
        phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        id_card: `110101${Math.floor(1950 + Math.random() * 50)}0101${String(i + 100000).padStart(4, '0')}`,
        source: ['walk_in', 'referral', 'online'][Math.floor(Math.random() * 3)],
        customer_level: ['normal', 'vip'][Math.floor(Math.random() * 2)]
      });

      if (i % 10000 === 0) {
        process.stdout.write(
          `\r准备客户数据: ${i.toLocaleString()}/${TOTAL_CUSTOMERS.toLocaleString()}`
        );
      }
    }

    console.log('\n开始插入客户数据...');
    const customers = [];
    for (let i = 0; i < customersData.length; i += BATCH_SIZE) {
      const batch = customersData.slice(i, i + BATCH_SIZE);
      const created = await Customer.bulkCreate(batch);
      customers.push(...created);
      process.stdout.write(
        `\r已插入客户: ${customers.length.toLocaleString()}/${TOTAL_CUSTOMERS.toLocaleString()}`
      );
    }
    console.log(`\n✓ 客户生成完成！总计: ${customers.length.toLocaleString()} 条`);

    // 3. 生成订单数据
    console.log('\n=== 第3步：生成订单数据 ===');

    // 获取已售墓位
    const soldPlots = await CemeteryPlot.findAll({
      where: { status: 'sold' },
      limit: 150000, // 15万订单
      attributes: ['id', 'current_price']
    });

    console.log(`找到 ${soldPlots.length.toLocaleString()} 个已售墓位，生成订单...`);

    const ordersData = [];
    for (let i = 0; i < soldPlots.length; i++) {
      const plot = soldPlots[i];
      const customer = customers[Math.floor(Math.random() * customers.length)];

      ordersData.push({
        order_number: `ORD-${Date.now()}-${i}`,
        customer_id: customer.id,
        order_type: 'plot_sales',
        total_amount: plot.current_price,
        actual_amount: plot.current_price * (0.9 + Math.random() * 0.1),
        discount_amount: plot.current_price * Math.random() * 0.1,
        status: ['paid', 'completed'][Math.floor(Math.random() * 2)],
        payment_status: 'paid',
        order_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        items: JSON.stringify([{ plot_id: plot.id, price: plot.current_price }])
      });

      if ((i + 1) % 10000 === 0) {
        process.stdout.write(
          `\r准备订单数据: ${(i + 1).toLocaleString()}/${soldPlots.length.toLocaleString()}`
        );
      }
    }

    console.log('\n开始插入订单数据...');
    const orders = [];
    for (let i = 0; i < ordersData.length; i += BATCH_SIZE) {
      const batch = ordersData.slice(i, i + BATCH_SIZE);
      const created = await Order.bulkCreate(batch);
      orders.push(...created);
      process.stdout.write(
        `\r已插入订单: ${orders.length.toLocaleString()}/${ordersData.length.toLocaleString()}`
      );
    }
    console.log(`\n✓ 订单生成完成！总计: ${orders.length.toLocaleString()} 条`);

    // 4. 生成支付记录
    console.log('\n=== 第4步：生成支付记录 ===');
    const paymentsData = [];

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      paymentsData.push({
        payment_number: `PAY-${Date.now()}-${i}`,
        order_id: order.id,
        amount: order.actual_amount,
        payment_method: ['cash', 'card', 'transfer', 'alipay', 'wechat'][
          Math.floor(Math.random() * 5)
        ],
        payment_date: new Date(order.order_date.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
      });

      if ((i + 1) % 10000 === 0) {
        process.stdout.write(
          `\r准备支付数据: ${(i + 1).toLocaleString()}/${orders.length.toLocaleString()}`
        );
      }
    }

    console.log('\n开始插入支付数据...');
    let paymentsCreated = 0;
    for (let i = 0; i < paymentsData.length; i += BATCH_SIZE) {
      const batch = paymentsData.slice(i, i + BATCH_SIZE);
      await Payment.bulkCreate(batch);
      paymentsCreated += batch.length;
      process.stdout.write(
        `\r已插入支付: ${paymentsCreated.toLocaleString()}/${paymentsData.length.toLocaleString()}`
      );
    }
    console.log(`\n✓ 支付记录生成完成！总计: ${paymentsCreated.toLocaleString()} 条`);

    // 5. 统计信息
    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ 100万条测试数据生成完成！');
    console.log('='.repeat(60));
    console.log(`墓位数量: ${totalPlotsCreated.toLocaleString()} 条`);
    console.log(`客户数量: ${customers.length.toLocaleString()} 条`);
    console.log(`订单数量: ${orders.length.toLocaleString()} 条`);
    console.log(`支付记录: ${paymentsCreated.toLocaleString()} 条`);
    console.log('='.repeat(60));

    // 查询最新统计
    const stats = {
      totalPlots: await CemeteryPlot.count(),
      totalCustomers: await Customer.count(),
      totalOrders: await Order.count(),
      totalPayments: await Payment.count(),
      totalAreas: await CemeteryArea.count()
    };

    console.log('\n数据库总计数据:');
    console.log(`墓区总数: ${stats.totalAreas.toLocaleString()}`);
    console.log(`墓位总数: ${stats.totalPlots.toLocaleString()}`);
    console.log(`客户总数: ${stats.totalCustomers.toLocaleString()}`);
    console.log(`订单总数: ${stats.totalOrders.toLocaleString()}`);
    console.log(`支付总数: ${stats.totalPayments.toLocaleString()}`);
  } catch (error) {
    console.error('\n❌ 生成数据时出错:', error);
    throw error;
  } finally {
    process.exit();
  }
}

// 运行
seedMillionData();
