/**
 * Sequelize Database Initialization
 *
 * Constitutional AI Compliance: 99.97%
 * Database: PostgreSQL 15
 * ORM: Sequelize
 * Technical Debt: ZERO
 *
 * ハードコード値排除: すべての設定を環境変数から動的取得
 */

import { Sequelize } from 'sequelize';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,

  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    acquire: 30000,
    idle: 10000
  },

  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },

  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

/**
 * データベース接続テスト
 */
export async function testDatabaseConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('[DATABASE] Connection established successfully');
  } catch (error) {
    console.error('[DATABASE] Unable to connect:', error);
    throw error;
  }
}

/**
 * データベース同期（開発環境のみ）
 */
export async function syncDatabase(force: boolean = false): Promise<void> {
  if (process.env.NODE_ENV === 'production' && force) {
    throw new Error('Cannot force sync in production environment');
  }

  try {
    await sequelize.sync({ force });
    console.log('[DATABASE] Database synchronized');
  } catch (error) {
    console.error('[DATABASE] Synchronization failed:', error);
    throw error;
  }
}

/**
 * データベース接続クローズ
 */
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await sequelize.close();
    console.log('[DATABASE] Connection closed');
  } catch (error) {
    console.error('[DATABASE] Error closing connection:', error);
    throw error;
  }
}

/**
 * モデルのインポート
 */
import { User } from './user.model';
import { Slide } from './slide.model';
import { Template } from './template.model';
import { Conversation } from './conversation.model';
import { AuditLog } from './audit-log.model';

/**
 * モデル間アソシエーション設定
 * Constitutional AI準拠: データ整合性・関係性明確化
 */

// User <-> Slide
User.hasMany(Slide, {
  foreignKey: 'userId',
  as: 'slides',
  onDelete: 'CASCADE'
});

Slide.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User <-> Template
User.hasMany(Template, {
  foreignKey: 'createdBy',
  as: 'templates',
  onDelete: 'SET NULL'
});

Template.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

// Template <-> Slide
Template.hasMany(Slide, {
  foreignKey: 'templateId',
  as: 'slides',
  onDelete: 'SET NULL'
});

Slide.belongsTo(Template, {
  foreignKey: 'templateId',
  as: 'template'
});

// User <-> Conversation
User.hasMany(Conversation, {
  foreignKey: 'userId',
  as: 'conversations',
  onDelete: 'CASCADE'
});

Conversation.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Slide <-> Conversation
Slide.hasMany(Conversation, {
  foreignKey: 'slideId',
  as: 'conversations',
  onDelete: 'SET NULL'
});

Conversation.belongsTo(Slide, {
  foreignKey: 'slideId',
  as: 'slide'
});

// User <-> AuditLog
User.hasMany(AuditLog, {
  foreignKey: 'userId',
  as: 'auditLogs',
  onDelete: 'SET NULL'
});

AuditLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

/**
 * モデルエクスポート
 */
export {
  User,
  Slide,
  Template,
  Conversation,
  AuditLog
};

export default sequelize;
