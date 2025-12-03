const sequelize = require('../config/database');

async function run() {
  await sequelize.authenticate();
  const dialect = sequelize.getDialect();
  const tables = [
    'approval_records',
    'approval_workflows',
    'cemeteries',
    'cemetery_areas',
    'cemetery_plots',
    'construction_records',
    'construction_workers',
    'contact_records',
    'contracts',
    'customers',
    'deceased',
    'family_tombs',
    'inventories',
    'inventory_transactions',
    'maintenance_records',
    'memorial_appointments',
    'migration_requests',
    'notifications',
    'online_payments',
    'orders',
    'payments',
    'print_records',
    'print_templates',
    'refund_requests',
    'service_packages',
    'template_fields',
    'inventory',
    'roles_backup'
  ];
  if (dialect === 'sqlite') {
    try {
      await sequelize.query('PRAGMA foreign_keys = OFF');
    } catch {}
    try {
      for (const name of tables) {
        console.log('Dropping', name);
        await sequelize.query(`DROP TABLE IF EXISTS ${name};`, { logging: false });
      }
      console.log('Done');
    } catch (e) {
      console.error('Error', e && e.message ? e.message : e);
    }
    try {
      await sequelize.query('PRAGMA foreign_keys = ON');
    } catch {}
  } else if (dialect === 'postgres') {
    const t = await sequelize.transaction();
    try {
      const joined = tables.map(name => `"${name}"`).join(', ');
      await sequelize.query(`DROP TABLE IF EXISTS ${joined} CASCADE;`, {
        transaction: t,
        logging: false
      });
      await t.commit();
    } catch {
      try {
        await t.rollback();
      } catch {}
    }
  } else {
    const t = await sequelize.transaction();
    try {
      const joined = tables.map(name => `\`${name}\``).join(', ');
      await sequelize.query(`DROP TABLE IF EXISTS ${joined};`, { transaction: t, logging: false });
      await t.commit();
    } catch {
      try {
        await t.rollback();
      } catch {}
    }
  }
  await sequelize.close();
}

run();
