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
    const result = await sequelize.query('PRAGMA foreign_keys;', { type: QueryTypes.SELECT });
    console.log('foreign_keys', result);
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
