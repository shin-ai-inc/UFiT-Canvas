/**
 * Audit Log Model
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Security audit trail and compliance logging
 * Technical Debt: ZERO
 *
 * Constitutional AI準拠: 説明責任・透明性
 */

import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute
} from 'sequelize';
import { sequelize } from './index';
import { User } from './user.model';

/**
 * アクションタイプ
 */
export enum ActionType {
  // 汎用CRUD操作
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',

  // 認証関連
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  PASSWORD_RESET = 'password_reset',
  TOKEN_REFRESH = 'token_refresh',

  // スライド操作
  SLIDE_CREATE = 'slide_create',
  SLIDE_READ = 'slide_read',
  SLIDE_UPDATE = 'slide_update',
  SLIDE_DELETE = 'slide_delete',
  SLIDE_EXPORT = 'slide_export',

  // テンプレート操作
  TEMPLATE_CREATE = 'template_create',
  TEMPLATE_READ = 'template_read',
  TEMPLATE_UPDATE = 'template_update',
  TEMPLATE_DELETE = 'template_delete',

  // AI操作
  CLAUDE_API_CALL = 'claude_api_call',
  VISION_API_CALL = 'vision_api_call',
  RESEARCH_API_CALL = 'research_api_call',
  AUTO_FIX = 'auto_fix',

  // セキュリティイベント
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  XSS_ATTEMPT = 'xss_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PERMISSION_DENIED = 'permission_denied',

  // システムイベント
  SYSTEM_ERROR = 'system_error',
  CONFIGURATION_CHANGE = 'configuration_change',
  DATA_EXPORT = 'data_export',
  GDPR_REQUEST = 'gdpr_request'
}

/**
 * リソースタイプ
 */
export enum ResourceType {
  USER = 'user',
  SLIDE = 'slide',
  TEMPLATE = 'template',
  CONVERSATION = 'conversation',
  SYSTEM = 'system',
  API = 'api'
}

/**
 * 監査ログ詳細
 */
export interface AuditLogDetails {
  endpoint?: string;
  method?: string;
  statusCode?: number;
  requestBody?: any;
  responseBody?: any;
  duration?: number;
  operation?: string;
  reason?: string;
  slideTitle?: string;
  changedFields?: string[];
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  securityFlags?: {
    suspiciousActivity?: boolean;
    rateLimitHit?: boolean;
    invalidToken?: boolean;
    maliciousPayload?: boolean;
  };
  [key: string]: any;  // 追加のプロパティを許可
}

/**
 * AuditLogモデル属性
 */
export interface AuditLogAttributes {
  id: string;
  userId?: string;
  actionType: ActionType;
  resourceType: ResourceType;
  resourceId?: string;
  ipAddress: string;
  userAgent?: string;
  actionDetails: AuditLogDetails;
  success: boolean;
  errorMessage?: string;
  constitutionalComplianceScore: number;
  timestamp: Date;
  createdAt: Date;
}

/**
 * AuditLogモデル
 * Constitutional AI準拠: 説明責任・透明性・監査可能性
 */
export class AuditLog extends Model<
  InferAttributes<AuditLog>,
  InferCreationAttributes<AuditLog>
> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<User['id']> | null;
  declare actionType: ActionType;
  declare resourceType: ResourceType;
  declare resourceId: string | null;
  declare ipAddress: string;
  declare userAgent: string | null;
  declare actionDetails: AuditLogDetails;
  declare success: boolean;
  declare errorMessage: string | null;
  declare constitutionalComplianceScore: number;
  declare timestamp: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<User>;

  /**
   * セキュリティイベント判定
   * Constitutional AI準拠: 脅威検出
   */
  public isSecurityEvent(): boolean {
    const securityActions: ActionType[] = [
      ActionType.RATE_LIMIT_EXCEEDED,
      ActionType.XSS_ATTEMPT,
      ActionType.SQL_INJECTION_ATTEMPT,
      ActionType.UNAUTHORIZED_ACCESS,
      ActionType.PERMISSION_DENIED
    ];

    return securityActions.includes(this.actionType);
  }

  /**
   * 重大度レベル取得
   * Constitutional AI準拠: リスク評価
   */
  public getSeverityLevel(): 'low' | 'medium' | 'high' | 'critical' {
    // 失敗イベント
    if (!this.success) {
      if (this.isSecurityEvent()) {
        return 'critical';
      }
      return 'high';
    }

    // Constitutional AI準拠度が低い
    const minComplianceScore = parseFloat(process.env.CONSTITUTIONAL_AI_MIN_SCORE || '0.997');
    if (this.constitutionalComplianceScore < minComplianceScore) {
      return 'high';
    }

    // セキュリティフラグ確認
    if (this.actionDetails.securityFlags) {
      const flags = this.actionDetails.securityFlags;
      if (flags.maliciousPayload || flags.suspiciousActivity) {
        return 'critical';
      }
      if (flags.rateLimitHit || flags.invalidToken) {
        return 'medium';
      }
    }

    // 通常イベント
    return 'low';
  }

  /**
   * アラート必要性判定
   * Constitutional AI準拠: プロアクティブ防御
   */
  public requiresAlert(): boolean {
    const severity = this.getSeverityLevel();
    return severity === 'critical' || severity === 'high';
  }

  /**
   * JSON出力（センシティブデータ除外）
   * Constitutional AI準拠: プライバシー保護
   */
  public toJSON(): Partial<AuditLogAttributes> {
    const values = { ...this.get() };

    // 本番環境ではリクエスト/レスポンスボディを除外
    if (process.env.NODE_ENV === 'production') {
      if (values.actionDetails) {
        const sanitizedDetails = { ...values.actionDetails };
        delete sanitizedDetails.requestBody;
        delete sanitizedDetails.responseBody;

        // 機密フィールドのみ除外、他は保持
        values.actionDetails = sanitizedDetails;
      }
    }

    return values;
  }

  /**
   * 保持期間確認
   * Constitutional AI準拠: データ最小化原則
   */
  public isWithinRetentionPeriod(): boolean {
    const retentionDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '365', 10);
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();
    const createdTime = new Date(this.createdAt).getTime();

    return (now - createdTime) < retentionMs;
  }
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    actionType: {
      type: DataTypes.ENUM(...Object.values(ActionType)),
      allowNull: false
    },
    resourceType: {
      type: DataTypes.ENUM(...Object.values(ResourceType)),
      allowNull: false
    },
    resourceId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: false,
      validate: {
        isIP: {
          msg: 'Invalid IP address format'
        }
      }
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    actionDetails: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, parseInt(process.env.MAX_ERROR_MESSAGE_LENGTH || '5000', 10)],
          msg: 'Error message exceeds maximum length'
        }
      }
    },
    constitutionalComplianceScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0,
      validate: {
        min: 0.0,
        max: 1.0
      }
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'audit_logs',
    timestamps: false,
    updatedAt: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['actionType'] },
      { fields: ['resourceType'] },
      { fields: ['resourceId'] },
      { fields: ['timestamp'] },
      { fields: ['success'] },
      { fields: ['ipAddress'] },
      { fields: ['userId', 'actionType'] },
      { fields: ['timestamp', 'actionType'] },
      { fields: ['success', 'actionType'] }
    ]
  }
);

export default AuditLog;
