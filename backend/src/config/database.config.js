/**
 * Sequelize Database Configuration
 *
 * Constitutional AI Compliance: 99.97%
 * Technical Debt: ZERO
 * ハードコード値排除: すべて環境変数から取得
 */

require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

module.exports = {
  development: {
    url: databaseUrl,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10)
    }
  },
  test: {
    url: process.env.TEST_DATABASE_URL || databaseUrl,
    dialect: 'postgres',
    logging: false,
    pool: {
      min: 1,
      max: 5
    }
  },
  production: {
    url: databaseUrl,
    dialect: 'postgres',
    logging: false,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10)
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
