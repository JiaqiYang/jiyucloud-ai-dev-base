const bcrypt = require('bcryptjs');

const {
  sequelize,
  Cemetery,
  CemeteryArea,
  CemeteryPlot,
  FamilyTomb,
  User,
  Role,
  Permission,
  Customer,
  Order,
  Contract,
  Payment,
  ApprovalWorkflow,
  ApprovalRecord,
  ConstructionRecord
} = require('../models');

async function seed() {
  try {
    console.log('开始初始化数据库...');

    // 强制同步数据库 (会删除现有表)
    await sequelize.sync({ force: true });
    console.log('数据库表已重建');

    // 1. 创建基础角色
    const adminRole = await Role.create({
      role_name: '超级管理员',
      role_code: 'admin',
      description: '系统最高权限'
    });

    const managerRole = await Role.create({
      role_name: '墓园经理',
      role_code: 'manager',
      description: '管理墓园日常事务'
    });

    // 2. 创建管理员用户
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    await User.create({
      username: 'admin',
      password: hashedPassword,
      real_name: '系统管理员',
      role_id: adminRole.id,
      status: 'active'
    });
    console.log('管理员用户创建成功: admin / admin123');

    // 3. 创建墓园
    const cemetery = await Cemetery.create({
      name: '万安陵园',
      code: 'WALY',
      city: '北京',
      status: 'active'
    });
    console.log('墓园创建成功');

    // 4. 批量生成墓区和墓位 (目标: 50万条墓位)
    console.log('开始生成海量墓位数据 (目标: 500,000)...');

    // 策略: 创建 50 个墓区，每个墓区 100 排，每排 100 个墓位 = 50 * 100 * 100 = 500,000
    const TOTAL_AREAS = 50;
    const ROWS_PER_AREA = 100;
    const COLS_PER_ROW = 100;

    const areasData = [];
    for (let i = 1; i <= TOTAL_AREAS; i++) {
      areasData.push({
        cemetery_id: cemetery.id,
        name: `墓区-${String(i).padStart(3, '0')}`,
        code: `A${String(i).padStart(3, '0')}`,
        area_type: 'normal',
        total_plots: ROWS_PER_AREA * COLS_PER_ROW,
        available_plots: ROWS_PER_AREA * COLS_PER_ROW
      });
    }

    const areas = await CemeteryArea.bulkCreate(areasData);
    console.log(`已创建 ${areas.length} 个墓区`);

    // 分批插入墓位，避免内存溢出
    const BATCH_SIZE = 5000;
    let totalPlotsCreated = 0;
    let plotsBatch = [];

    for (const area of areas) {
      console.log(`正在为墓区 ${area.name} 生成墓位...`);

      for (let r = 1; r <= ROWS_PER_AREA; r++) {
        for (let c = 1; c <= COLS_PER_ROW; c++) {
          plotsBatch.push({
            cemetery_id: cemetery.id,
            area_id: area.id,
            plot_number: `${area.code}-${String(r).padStart(3, '0')}-${String(c).padStart(3, '0')}`,
            row_id: r,
            row_name: `第${r}排`,
            column_id: c,
            column_name: `${c}号`,
            custom_name: `${area.name} 第${r}排 ${c}号`,
            plot_type: 'single',
            base_price: 50000 + Math.random() * 10000,
            current_price: 50000 + Math.random() * 10000,
            status: Math.random() > 0.8 ? 'sold' : 'available', // 20% 已售
            position_x: (c - 1) * 1.2,
            position_y: (r - 1) * 1.5
          });

          if (plotsBatch.length >= BATCH_SIZE) {
            await CemeteryPlot.bulkCreate(plotsBatch);
            totalPlotsCreated += plotsBatch.length;
            process.stdout.write(`\r已生成墓位: ${totalPlotsCreated}`);
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

    // 5. 批量生成家族墓 (目标: 10万条)
    console.log('\n开始生成家族墓数据 (目标: 100,000)...');

    // 策略: 创建 10 个家族墓区，每个墓区 100 排，每排 100 个家族墓 = 10 * 100 * 100 = 100,000
    const TOTAL_FAMILY_AREAS = 10;
    const FAMILY_ROWS = 100;
    const FAMILY_COLS = 100;

    const familyAreasData = [];
    for (let i = 1; i <= TOTAL_FAMILY_AREAS; i++) {
      familyAreasData.push({
        cemetery_id: cemetery.id,
        name: `家族墓区-${String(i).padStart(3, '0')}`,
        code: `F${String(i).padStart(3, '0')}`,
        area_type: 'family',
        total_plots: FAMILY_ROWS * FAMILY_COLS, // 这里指家族墓数量，非内部墓位
        available_plots: FAMILY_ROWS * FAMILY_COLS
      });
    }

    const familyAreas = await CemeteryArea.bulkCreate(familyAreasData);
    console.log(`已创建 ${familyAreas.length} 个家族墓区`);

    let totalFamilyTombsCreated = 0;
    let familyTombsBatch = [];

    for (const area of familyAreas) {
      console.log(`正在为墓区 ${area.name} 生成家族墓...`);

      for (let r = 1; r <= FAMILY_ROWS; r++) {
        for (let c = 1; c <= FAMILY_COLS; c++) {
          familyTombsBatch.push({
            cemetery_id: cemetery.id,
            area_id: area.id,
            tomb_name: `${area.name} ${r}排${c}号家族墓`,
            tomb_number: `${area.code}-${String(r).padStart(3, '0')}-${String(c).padStart(3, '0')}`,
            total_plots: 4, // 默认每个家族墓包含4个墓位
            total_price: 200000 + Math.random() * 50000,
            management_fee_yearly: 2000,
            status: Math.random() > 0.9 ? 'sold' : 'available',
            row_start: r,
            row_end: r,
            column_start: c,
            column_end: c
          });

          if (familyTombsBatch.length >= BATCH_SIZE) {
            await FamilyTomb.bulkCreate(familyTombsBatch);
            totalFamilyTombsCreated += familyTombsBatch.length;
            process.stdout.write(`\r已生成家族墓: ${totalFamilyTombsCreated}`);
            familyTombsBatch = [];
          }
        }
      }
    }

    if (familyTombsBatch.length > 0) {
      await FamilyTomb.bulkCreate(familyTombsBatch);
      totalFamilyTombsCreated += familyTombsBatch.length;
    }

    console.log(`\n\n✅ 数据库初始化完成!`);
    console.log(`总计生成普通墓位: ${totalPlotsCreated}`);
    console.log(`总计生成家族墓: ${totalFamilyTombsCreated}`);

    // 6. 生成业务流程数据 (目标: 10万条订单及相关数据)
    console.log('\n开始生成业务流程数据 (目标: 100,000 订单)...');

    // 6.1 批量生成客户 (5万个客户，平均每人2个订单)
    console.log('正在生成客户数据...');
    const TOTAL_CUSTOMERS = 50000;
    const customersData = [];
    for (let i = 1; i <= TOTAL_CUSTOMERS; i++) {
      customersData.push({
        name: `客户${i}`,
        gender: Math.random() > 0.5 ? '男' : '女',
        phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        id_card: `11010119${Math.floor(1950 + Math.random() * 50)}0101${String(i).padStart(4, '0')}`,
        source: ['walk_in', 'referral', 'online'][Math.floor(Math.random() * 3)],
        customer_level: ['normal', 'vip'][Math.floor(Math.random() * 2)]
      });
    }
    // 分批插入客户
    const customers = [];
    for (let i = 0; i < customersData.length; i += BATCH_SIZE) {
      const batch = customersData.slice(i, i + BATCH_SIZE);
      const created = await Customer.bulkCreate(batch);
      customers.push(...created);
      process.stdout.write(`\r已生成客户: ${customers.length}`);
    }
    console.log(`\n已创建 ${customers.length} 个客户`);

    // 6.2 生成订单及关联数据
    console.log('正在生成订单及关联数据...');

    // 获取已售墓位用于生成订单
    const soldPlots = await CemeteryPlot.findAll({
      where: { status: 'sold' },
      limit: 100000, // 限制10万条
      attributes: ['id', 'current_price']
    });

    let totalOrdersCreated = 0;
    const ordersBatch = [];
    const contractsBatch = [];
    const paymentsBatch = [];
    const approvalRecordsBatch = [];
    const constructionRecordsBatch = [];

    for (let i = 0; i < soldPlots.length; i++) {
      const plot = soldPlots[i];
      const customer = customers[i % customers.length];
      const orderStatus = ['completed', 'paid', 'pending'][Math.floor(Math.random() * 3)];

      // 订单数据
      const orderData = {
        order_number: `ORD-${Date.now()}-${i}`,
        customer_id: customer.id,
        salesperson_id: 1, // admin
        order_type: 'plot_sales',
        total_amount: plot.current_price,
        actual_amount: plot.current_price,
        status: orderStatus,
        payment_status: orderStatus === 'pending' ? 'unpaid' : 'paid',
        order_date: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)),
        items: JSON.stringify([{ plot_id: plot.id, price: plot.current_price }])
      };
      ordersBatch.push(orderData);

      // 批量插入订单以获取ID (需要分批处理以避免内存过大，但为了关联需要ID，这里简化处理：先插入订单，再插入关联)
      // 由于bulkCreate返回的实例包含ID，我们可以分批进行

      if (ordersBatch.length >= BATCH_SIZE || i === soldPlots.length - 1) {
        const createdOrders = await Order.bulkCreate(ordersBatch);
        totalOrdersCreated += createdOrders.length;

        // 为这批订单生成关联数据
        for (const order of createdOrders) {
          // 合同 (80%概率有合同)
          if (Math.random() > 0.2) {
            contractsBatch.push({
              order_id: order.id,
              contract_number: `CON-${order.order_number}`,
              contract_type: 'sales',
              signed_date: order.order_date,
              status: 'active'
            });
          }

          // 支付记录 (已支付订单)
          if (order.payment_status === 'paid') {
            paymentsBatch.push({
              order_id: order.id,
              payment_number: `PAY-${order.order_number}`,
              amount: order.actual_amount,
              payment_method: ['cash', 'card', 'transfer'][Math.floor(Math.random() * 3)],
              payment_date: order.order_date
            });
          }

          // 审批记录 (50%概率有审批)
          if (Math.random() > 0.5) {
            approvalRecordsBatch.push({
              request_id: order.id,
              request_type: 'order',
              step: 1,
              approver_id: 1,
              approval_status: 'approved',
              approval_date: order.order_date,
              comments: '同意'
            });
          }

          // 施工记录 (30%概率有施工)
          if (Math.random() > 0.7) {
            const plotItem = JSON.parse(order.items)[0];
            constructionRecordsBatch.push({
              plot_id: plotItem.plot_id,
              order_id: order.id,
              record_type: 'order_construction',
              content: '墓碑刻字及安装',
              status: ['pending', 'in_progress', 'completed'][Math.floor(Math.random() * 3)],
              amount: 2000
            });
          }
        }

        // 批量插入关联数据
        if (contractsBatch.length > 0) {
          await Contract.bulkCreate(contractsBatch);
        }
        if (paymentsBatch.length > 0) {
          await Payment.bulkCreate(paymentsBatch);
        }
        if (approvalRecordsBatch.length > 0) {
          await ApprovalRecord.bulkCreate(approvalRecordsBatch);
        }
        if (constructionRecordsBatch.length > 0) {
          await ConstructionRecord.bulkCreate(constructionRecordsBatch);
        }

        // 清空批次
        ordersBatch.length = 0;
        contractsBatch.length = 0;
        paymentsBatch.length = 0;
        approvalRecordsBatch.length = 0;
        constructionRecordsBatch.length = 0;

        process.stdout.write(`\r已生成订单: ${totalOrdersCreated}`);
      }
    }

    console.log(`\n\n✅ 数据库初始化完成!`);
    console.log(`总计生成普通墓位: ${totalPlotsCreated}`);
    console.log(`总计生成家族墓: ${totalFamilyTombsCreated}`);
    console.log(`总计生成订单: ${totalOrdersCreated}`);
  } catch (error) {
    console.error('种子数据生成失败:', error);
  } finally {
    process.exit();
  }
}

seed();
