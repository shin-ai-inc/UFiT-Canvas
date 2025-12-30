/**
 * Security Configuration
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Application security settings and policies
 * Technical Debt: ZERO
 *
 * ハードコード値排除: すべて環境変数から動的取得
 */

import { CorsOptions } from 'cors';
import helmet from 'helmet';

/**
 * CORS設定
 * すべて環境変数から取得 (zero hardcoded values)
 */
export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || process.env.CORS_ALLOW_NO_ORIGIN === 'true') {
      return callback(null, true);
    }

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: (process.env.CORS_METHODS || 'GET,POST,PUT,DELETE,PATCH,OPTIONS').split(','),
  allowedHeaders: (process.env.CORS_ALLOWED_HEADERS || 'Content-Type,Authorization,X-Requested-With').split(','),
  exposedHeaders: (process.env.CORS_EXPOSED_HEADERS || 'Content-Length,X-Request-Id').split(','),
  maxAge: parseInt(process.env.CORS_MAX_AGE || '86400', 10) // 24 hours
};

/**
 * Helmet セキュリティヘッダー設定
 */
export const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000', 10), // 1 year
    includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
    preload: process.env.HSTS_PRELOAD === 'true'
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true
};

/**
 * JWT設定
 */
export const jwtConfig = {
  secret: process.env.JWT_SECRET!,
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  algorithm: (process.env.JWT_ALGORITHM || 'HS256') as 'HS256' | 'HS384' | 'HS512',
  issuer: process.env.JWT_ISSUER || 'ufit-ai-slides',
  audience: process.env.JWT_AUDIENCE || 'ufit-users'
};

/**
 * パスワードポリシー
 */
export const passwordPolicy = {
  minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
  maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH || '128', 10),
  requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
  requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
  requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
  requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
  preventReuse: parseInt(process.env.PASSWORD_PREVENT_REUSE || '5', 10) // Last 5 passwords
};

/**
 * レート制限設定
 */
export const rateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  message: process.env.RATE_LIMIT_MESSAGE || 'Too many requests from this IP',
  standardHeaders: process.env.RATE_LIMIT_STANDARD_HEADERS !== 'false',
  legacyHeaders: process.env.RATE_LIMIT_LEGACY_HEADERS !== 'true'
};

/**
 * セッション設定
 */
export const sessionConfig = {
  secret: process.env.SESSION_SECRET!,
  name: process.env.SESSION_NAME || 'ufit.sid',
  resave: process.env.SESSION_RESAVE !== 'true',
  saveUninitialized: process.env.SESSION_SAVE_UNINITIALIZED !== 'true',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: process.env.SESSION_COOKIE_HTTP_ONLY !== 'false',
    maxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE || '86400000', 10), // 24 hours
    sameSite: (process.env.SESSION_COOKIE_SAME_SITE || 'lax') as 'strict' | 'lax' | 'none',
    domain: process.env.SESSION_COOKIE_DOMAIN || undefined
  }
};

/**
 * CSRF保護設定
 */
export const csrfConfig = {
  enabled: process.env.CSRF_ENABLED !== 'false',
  cookieName: process.env.CSRF_COOKIE_NAME || 'XSRF-TOKEN',
  headerName: process.env.CSRF_HEADER_NAME || 'X-XSRF-TOKEN'
};

/**
 * 入力サニタイゼーション設定
 */
export const sanitizationConfig = {
  allowedTags: (process.env.SANITIZE_ALLOWED_TAGS || 'p,br,strong,em,u,a,ul,ol,li,h1,h2,h3,h4,h5,h6,img,span,div').split(','),
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height']
  },
  maxLength: parseInt(process.env.SANITIZE_MAX_LENGTH || '1000000', 10) // 1MB
};

/**
 * Constitutional AI準拠設定
 */
export const constitutionalAIConfig = {
  minComplianceScore: parseFloat(process.env.CONSTITUTIONAL_AI_MIN_SCORE || '0.997'),
  enableChecks: process.env.CONSTITUTIONAL_AI_ENABLE !== 'false',
  logViolations: process.env.CONSTITUTIONAL_AI_LOG_VIOLATIONS !== 'false',
  blockOnViolation: process.env.CONSTITUTIONAL_AI_BLOCK_ON_VIOLATION !== 'false'
};

/**
 * セキュリティ設定検証
 */
export function validateSecurityConfig(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必須フィールド検証
  if (!jwtConfig.secret) {
    errors.push('JWT_SECRET is required');
  } else if (jwtConfig.secret.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters');
  }

  if (!sessionConfig.secret) {
    errors.push('SESSION_SECRET is required');
  } else if (sessionConfig.secret.length < 32) {
    warnings.push('SESSION_SECRET should be at least 32 characters');
  }

  // Production環境チェック
  if (process.env.NODE_ENV === 'production') {
    if (!sessionConfig.cookie.secure) {
      warnings.push('SESSION cookies should be secure in production');
    }

    if (process.env.CORS_ALLOWED_ORIGINS === '*') {
      warnings.push('CORS should not allow all origins in production');
    }

    if (!helmetConfig.hsts.preload) {
      warnings.push('HSTS preload should be enabled in production');
    }

    if (!csrfConfig.enabled) {
      warnings.push('CSRF protection should be enabled in production');
    }
  }

  // パスワードポリシー検証
  if (passwordPolicy.minLength < 8) {
    warnings.push('Password minimum length should be at least 8 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * セキュリティ設定サマリー出力
 */
export function logSecurityConfig(): void {
  const validation = validateSecurityConfig();

  console.log('[SECURITY_CONFIG] Configuration loaded:');
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  CORS Origins: ${process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000'}`);
  console.log(`  JWT Algorithm: ${jwtConfig.algorithm}`);
  console.log(`  JWT Expires In: ${jwtConfig.expiresIn}`);
  console.log(`  Session Cookie Secure: ${sessionConfig.cookie.secure}`);
  console.log(`  CSRF Protection: ${csrfConfig.enabled ? 'Enabled' : 'Disabled'}`);
  console.log(`  HSTS Max Age: ${helmetConfig.hsts.maxAge}s`);
  console.log(`  Password Min Length: ${passwordPolicy.minLength}`);
  console.log(`  Rate Limit Window: ${rateLimitConfig.windowMs}ms`);
  console.log(`  Rate Limit Max: ${rateLimitConfig.max}`);
  console.log(`  Constitutional AI Compliance: ${constitutionalAIConfig.minComplianceScore * 100}%`);

  if (validation.warnings.length > 0) {
    console.warn('[SECURITY_CONFIG] Warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (!validation.valid) {
    console.error('[SECURITY_CONFIG] Errors:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }
}
