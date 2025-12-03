const sequelize = require('../config/database');
(async () => {
  await sequelize.authenticate();
  const dialect = sequelize.getDialect();
  let sql;
  if (dialect === 'sqlite') {
    sql = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name";
  } else if (dialect === 'postgres') {
    sql =
      "SELECT tablename AS name FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY name";
  } else {
    sql =
      "SELECT table_name AS name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema','mysql','performance_schema','sys') ORDER BY name";
  }
  const [rows] = await sequelize.query(sql);
  console.log(rows.map(r => r.name).join(', '));
  await sequelize.close();
})();
