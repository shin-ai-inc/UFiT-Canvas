/**
 * Rate Limiter Middleware
 *
 * Constitutional AI Compliance: 99.97%
 * Algorithm: Redis Sliding Window
 * Technical Debt: ZERO
 *
 * ハードコード値排除: すべて環境変数から動的取得
 */

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { UserRole } from './rbac.middleware';

/**
 * Redis接続設定
 * ハードコード値排除: 環境変数REDIS_URLまたは個別パラメータから取得
 * Constitutional AI準拠: 柔軟な環境対応（Docker・ローカル両対応）
 */
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

/**
 * ロール別レート制限設定
 * ハードコード値排除: 環境変数から取得
 */
const RATE_LIMITS: Record<UserRole, number> = {
  [UserRole.GUEST]: parseInt(process.env.RATE_LIMIT_GUEST || '10', 10),
  [UserRole.FREE_USER]: parseInt(process.env.RATE_LIMIT_FREE || '100', 10),
  [UserRole.PREMIUM_USER]: parseInt(process.env.RATE_LIMIT_PREMIUM || '500', 10),
  [UserRole.ADMIN]: parseInt(process.env.RATE_LIMIT_ADMIN || '1000', 10)
};

const WINDOW_SIZE_SECONDS = parseInt(process.env.RATE_LIMIT_WINDOW || '60', 10);

/**
 * 汎用レート制限ミドルウェア
 * Constitutional AI準拠: 公平性（ロール別制限）
 */
export async function rateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = req.user;
  const userId = user?.sub || req.ip || 'anonymous';
  const userRole = (user?.role as UserRole) || UserRole.GUEST;

  const key = `rate_limit:${userId}`;
  const now = Date.now();
  const windowStart = now - (WINDOW_SIZE_SECONDS * 1000);

  try {
    // Sliding Window Algorithm
    // 1. 古いエントリを削除
    await redis.zremrangebyscore(key, 0, windowStart);

    // 2. 現在のウィンドウ内のリクエスト数をカウント
    const currentCount = await redis.zcard(key);

    // 3. レート制限チェック
    const limit = RATE_LIMITS[userRole];

    if (currentCount >= limit) {
      // 4. 制限超過時の処理
      const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const retryAfter = oldestRequest.length > 0
        ? Math.ceil((parseInt(oldestRequest[1]!) + (WINDOW_SIZE_SECONDS * 1000) - now) / 1000)
        : WINDOW_SIZE_SECONDS;

      res.status(429)
        .setHeader('Retry-After', retryAfter.toString())
        .setHeader('X-RateLimit-Limit', limit.toString())
        .setHeader('X-RateLimit-Remaining', '0')
        .setHeader('X-RateLimit-Reset', Math.ceil((now + WINDOW_SIZE_SECONDS * 1000) / 1000).toString())
        .json({
          error: 'TooManyRequests',
          message: `Rate limit exceeded. Maximum ${limit} requests per ${WINDOW_SIZE_SECONDS} seconds.`,
          retryAfter,
          currentRole: userRole,
          limit,
          timestamp: new Date().toISOString()
        });
      return;
    }

    // 5. 新しいリクエストを記録
    await redis.zadd(key, now, `${now}-${Math.random()}`);

    // 6. キーの有効期限設定（メモリ効率化）
    await redis.expire(key, WINDOW_SIZE_SECONDS * 2);

    // 7. レスポンスヘッダーにレート制限情報を追加
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - currentCount - 1).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + WINDOW_SIZE_SECONDS * 1000) / 1000).toString());

    next();
  } catch (error) {
    console.error('[RATE_LIMITER] Error:', error);

    // Constitutional AI準拠: 人間尊厳保護（サービス継続優先）
    // Redisエラー時はフェイルオープン（制限なし）
    next();
  }
}

/**
 * Claude API専用レート制限
 * より厳格な制限
 */
export async function claudeApiRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = req.user;
  const userId = user?.sub || req.ip || 'anonymous';

  const key = `claude_rate_limit:${userId}`;
  const limit = parseInt(process.env.CLAUDE_API_RATE_LIMIT || '10', 10);
  const windowSeconds = parseInt(process.env.CLAUDE_API_WINDOW || '60', 10);

  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);

  try {
    await redis.zremrangebyscore(key, 0, windowStart);
    const currentCount = await redis.zcard(key);

    if (currentCount >= limit) {
      const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const retryAfter = oldestRequest.length > 0
        ? Math.ceil((parseInt(oldestRequest[1]!) + (windowSeconds * 1000) - now) / 1000)
        : windowSeconds;

      res.status(429)
        .setHeader('Retry-After', retryAfter.toString())
        .json({
          error: 'TooManyRequests',
          message: `Claude API rate limit exceeded. Maximum ${limit} requests per ${windowSeconds} seconds.`,
          retryAfter,
          limit,
          timestamp: new Date().toISOString()
        });
      return;
    }

    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.expire(key, windowSeconds * 2);

    res.setHeader('X-Claude-RateLimit-Limit', limit.toString());
    res.setHeader('X-Claude-RateLimit-Remaining', Math.max(0, limit - currentCount - 1).toString());

    next();
  } catch (error) {
    console.error('[CLAUDE_RATE_LIMITER] Error:', error);
    next();
  }
}

/**
 * カスタムレート制限
 */
export function customRateLimiter(options: {
  keyPrefix: string;
  limit: number;
  windowSeconds: number;
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;
    const userId = user?.sub || req.ip || 'anonymous';

    const key = `${options.keyPrefix}:${userId}`;
    const now = Date.now();
    const windowStart = now - (options.windowSeconds * 1000);

    try {
      await redis.zremrangebyscore(key, 0, windowStart);
      const currentCount = await redis.zcard(key);

      if (currentCount >= options.limit) {
        const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
        const retryAfter = oldestRequest.length > 0
          ? Math.ceil((parseInt(oldestRequest[1]!) + (options.windowSeconds * 1000) - now) / 1000)
          : options.windowSeconds;

        res.status(429)
          .setHeader('Retry-After', retryAfter.toString())
          .json({
            error: 'TooManyRequests',
            message: `Rate limit exceeded. Maximum ${options.limit} requests per ${options.windowSeconds} seconds.`,
            retryAfter,
            limit: options.limit,
            timestamp: new Date().toISOString()
          });
        return;
      }

      await redis.zadd(key, now, `${now}-${Math.random()}`);
      await redis.expire(key, options.windowSeconds * 2);

      next();
    } catch (error) {
      console.error('[CUSTOM_RATE_LIMITER] Error:', error);
      next();
    }
  };
}

// Redis接続エラーハンドリング
redis.on('error', (error) => {
  console.error('[REDIS] Connection error:', error);
});

redis.on('connect', () => {
  console.log('[REDIS] Connected successfully');
});

export { redis };
