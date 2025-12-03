const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

async function run() {
  try {
    await sequelize.authenticate();
    const dialect = sequelize.getDialect();
    if (dialect !== 'sqlite') {
      console.log('skip: not sqlite');
      return;
    }
    await sequelize.query('PRAGMA foreign_keys = OFF');
    const tables = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_backup';",
      { type: QueryTypes.SELECT }
    );
    if (tables.length) {
      for (const t of tables) {
        const name = t.name || t.TABLE_NAME || t.table_name;
        if (name) {
          console.log('dropping backup table:', name);
          await sequelize.query(`DROP TABLE IF EXISTS \`${name}\`;`);
        }
      }
    } else {
      console.log('no backup tables found');
    }
    // check duplicate primary keys in common tables
    const tablesToCheck = ['departments', 'users', 'roles', 'menus'];
    for (const tbl of tablesToCheck) {
      try {
        const dups = await sequelize.query(
          `SELECT id, COUNT(*) AS c FROM ${tbl} GROUP BY id HAVING c > 1;`,
          { type: QueryTypes.SELECT }
        );
        if (dups.length) {
          console.log(`duplicate ids detected in ${tbl}:`, dups);
        } else {
          console.log(`no duplicate ids in ${tbl}`);
        }
      } catch (e) {
        console.log(`${tbl} table check skipped:`, e.message);
      }
    }
  } catch (e) {
    console.error('error', e && e.message ? e.message : e);
    process.exitCode = 1;
  } finally {
    try {
      await sequelize.close();
    } catch {}
  }
}

run();
