'use strict';

const config = require('./index');

/**
 * Knex connection configuration derived from the central config.
 */
const databaseConfig = {
  client: config.db.client,

  connection: {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
  },

  pool: {
    min: config.db.pool.min,
    max: config.db.pool.max,
  },

  migrations: {
    tableName: 'knex_migrations',
    directory: './src/database/migrations',
  },

  seeds: {
    directory: './src/database/seeds',
  },

  debug: config.env === 'development',
};

module.exports = databaseConfig;
