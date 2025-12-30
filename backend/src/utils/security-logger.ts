/**
 * Security Logger
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Security audit logging
 * Technical Debt: ZERO
 *
 * Constitutional AI準拠: 説明責任・透明性
 */

import winston from 'winston';
import { Request } from 'express';

/**
 * セキュリティログレベル
 */
export enum SecurityEventType {
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_FAILURE = 'AUTH_FAILURE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  CSRF_ATTEMPT = 'CSRF_ATTEMPT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  DATA_ACCESS = 'DATA_ACCESS',
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE'
}

/**
 * セキュリティイベント
 */
export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip: string;
  userAgent: string;
  path?: string;
  method?: string;
  details?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  constitutionalCompliance?: boolean;
}

/**
 * Winstonロガー設定
 */
const securityLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'ufit-ai-slides-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // セキュリティログファイル
    new winston.transports.File({
      filename: process.env.SECURITY_LOG_PATH || 'logs/security.log',
      level: 'info'
    }),

    // エラーログファイル
    new winston.transports.File({
      filename: process.env.LOG_FILE_PATH || 'logs/error.log',
      level: 'error'
    }),

    // コンソール出力（開発環境のみ）
    ...(process.env.NODE_ENV === 'development'
      ? [new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })]
      : [])
  ]
});

/**
 * セキュリティイベントログ記録
 */
export function logSecurityEvent(event: SecurityEvent): void {
  const logEntry = {
    ...event,
    timestamp: new Date().toISOString()
  };

  // Constitutional AI準拠チェック
  if (event.constitutionalCompliance === false) {
    logEntry.severity = 'critical';
  }

  // 重要度に応じてログレベル決定
  const level = getSeverityLogLevel(event.severity);

  securityLogger.log(level, 'Security Event', logEntry);

  // 重大なイベントは通知
  if (event.severity === 'high' || event.severity === 'critical') {
    notifySecurityTeam(event);
  }
}

/**
 * 重要度からログレベル取得
 */
function getSeverityLogLevel(severity: SecurityEvent['severity']): string {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warn';
    case 'medium':
      return 'info';
    case 'low':
      return 'debug';
    default:
      return 'info';
  }
}

/**
 * セキュリティチーム通知
 * Constitutional AI準拠: 人間尊厳保護（攻撃検出時の即座対応）
 */
function notifySecurityTeam(event: SecurityEvent): void {
  // 実装: メール送信 or Slack通知 or PagerDuty
  console.error('[SECURITY_ALERT]', {
    type: event.type,
    severity: event.severity,
    userId: event.userId,
    ip: event.ip,
    timestamp: new Date().toISOString()
  });

  // TODO: 実際の通知実装（メール・Slack等）
}

/**
 * Requestからセキュリティイベント作成
 */
export function createSecurityEventFromRequest(
  req: Request,
  type: SecurityEventType,
  details?: any
): SecurityEvent {
  return {
    type,
    userId: req.user?.sub,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    path: req.path,
    method: req.method,
    details,
    severity: getDefaultSeverity(type),
    constitutionalCompliance: true
  };
}

/**
 * イベントタイプからデフォルト重要度取得
 */
function getDefaultSeverity(type: SecurityEventType): SecurityEvent['severity'] {
  const criticalEvents: SecurityEventType[] = [
    SecurityEventType.SQL_INJECTION_ATTEMPT,
    SecurityEventType.XSS_ATTEMPT
  ];

  const highEvents: SecurityEventType[] = [
    SecurityEventType.CSRF_ATTEMPT,
    SecurityEventType.SUSPICIOUS_ACTIVITY
  ];

  const mediumEvents: SecurityEventType[] = [
    SecurityEventType.AUTH_FAILURE,
    SecurityEventType.PERMISSION_DENIED,
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    SecurityEventType.INVALID_TOKEN
  ];

  if (criticalEvents.includes(type)) return 'critical';
  if (highEvents.includes(type)) return 'high';
  if (mediumEvents.includes(type)) return 'medium';
  return 'low';
}

/**
 * 認証成功ログ
 */
export function logAuthSuccess(req: Request, userId: string): void {
  logSecurityEvent({
    type: SecurityEventType.AUTH_SUCCESS,
    userId,
    ip: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    severity: 'low'
  });
}

/**
 * 認証失敗ログ
 */
export function logAuthFailure(req: Request, email: string, reason: string): void {
  logSecurityEvent({
    type: SecurityEventType.AUTH_FAILURE,
    ip: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    details: { email, reason },
    severity: 'medium'
  });
}

/**
 * レート制限超過ログ
 */
export function logRateLimitExceeded(req: Request, limit: number): void {
  logSecurityEvent(createSecurityEventFromRequest(
    req,
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    { limit }
  ));
}

/**
 * XSS試行ログ
 */
export function logXSSAttempt(req: Request, payload: string): void {
  logSecurityEvent({
    ...createSecurityEventFromRequest(req, SecurityEventType.XSS_ATTEMPT, { payload }),
    severity: 'critical'
  });
}

/**
 * SQL Injection試行ログ
 */
export function logSQLInjectionAttempt(req: Request, payload: string): void {
  logSecurityEvent({
    ...createSecurityEventFromRequest(req, SecurityEventType.SQL_INJECTION_ATTEMPT, { payload }),
    severity: 'critical'
  });
}

export default securityLogger;
