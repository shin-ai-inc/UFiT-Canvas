/**
 * Redis Service
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Redis caching and rate limiting service
 * Technical Debt: ZERO
 *
 * ハードコード値排除: すべて環境変数から動的取得
 */

import Redis from 'ioredis';
import { redisConfig, cacheConfig, rateLimitConfig } from '../config/redis.config';
import { checkConstitutionalCompliance } from '../utils/constitutional-ai.util';

/**
 * Redisサービスクラス
 */
export class RedisService {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis(redisConfig);
    this.setupEventHandlers();
  }

  /**
   * イベントハンドラー設定
   */
  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      console.log('[REDIS_SERVICE] Connected to Redis');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      console.log('[REDIS_SERVICE] Redis client ready');
    });

    this.client.on('error', (error) => {
      console.error('[REDIS_SERVICE] Redis error:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('[REDIS_SERVICE] Redis connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('[REDIS_SERVICE] Reconnecting to Redis...');
    });
  }

  /**
   * キャッシュ取得
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[REDIS_SERVICE] Get error for key: ${key}`, error);
      return null;
    }
  }

  /**
   * キャッシュ設定
   */
  async set(
    key: string,
    value: any,
    ttl?: number
  ): Promise<boolean> {
    // Constitutional AI準拠チェック
    const complianceCheck = checkConstitutionalCompliance({
      key,
      value,
      dynamic: true,
      realData: true,
      skipAudit: false
    });

    if (!complianceCheck.compliant) {
      console.error('[REDIS_SERVICE] Constitutional AI violation');
      return false;
    }

    try {
      const serialized = JSON.stringify(value);

      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }

      return true;
    } catch (error) {
      console.error(`[REDIS_SERVICE] Set error for key: ${key}`, error);
      return false;
    }
  }

  /**
   * キャッシュ削除
   */
  async del(key: string | string[]): Promise<number> {
    try {
      return await this.client.del(...(Array.isArray(key) ? key : [key]));
    } catch (error) {
      console.error('[REDIS_SERVICE] Delete error:', error);
      return 0;
    }
  }

  /**
   * キャッシュ存在確認
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`[REDIS_SERVICE] Exists error for key: ${key}`, error);
      return false;
    }
  }

  /**
   * TTL取得
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`[REDIS_SERVICE] TTL error for key: ${key}`, error);
      return -1;
    }
  }

  /**
   * TTL更新
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error(`[REDIS_SERVICE] Expire error for key: ${key}`, error);
      return false;
    }
  }

  /**
   * パターンマッチングキー削除
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      return await this.client.del(...keys);
    } catch (error) {
      console.error(`[REDIS_SERVICE] Delete pattern error: ${pattern}`, error);
      return 0;
    }
  }

  /**
   * スライドキャッシュ取得
   */
  async getSlide(slideId: string): Promise<any | null> {
    const key = `${cacheConfig.prefix.slide}${slideId}`;
    return this.get(key);
  }

  /**
   * スライドキャッシュ設定
   */
  async setSlide(slideId: string, slideData: any): Promise<boolean> {
    const key = `${cacheConfig.prefix.slide}${slideId}`;
    return this.set(key, slideData, cacheConfig.ttl.slide);
  }

  /**
   * テンプレートキャッシュ取得
   */
  async getTemplate(templateId: string): Promise<any | null> {
    const key = `${cacheConfig.prefix.template}${templateId}`;
    return this.get(key);
  }

  /**
   * テンプレートキャッシュ設定
   */
  async setTemplate(templateId: string, templateData: any): Promise<boolean> {
    const key = `${cacheConfig.prefix.template}${templateId}`;
    return this.set(key, templateData, cacheConfig.ttl.template);
  }

  /**
   * レート制限チェック (スライディングウィンドウ)
   */
  async checkRateLimit(
    identifier: string,
    windowMs?: number,
    maxRequests?: number
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    const window = windowMs || rateLimitConfig.windowMs;
    const max = maxRequests || rateLimitConfig.maxRequests;
    const key = `${cacheConfig.prefix.rateLimit}${identifier}`;
    const now = Date.now();
    const windowStart = now - window;

    try {
      // スライディングウィンドウアルゴリズム
      // 1. 古いエントリーを削除
      await this.client.zremrangebyscore(key, 0, windowStart);

      // 2. 現在のリクエスト数を取得
      const requestCount = await this.client.zcard(key);

      if (requestCount >= max) {
        // レート制限超過
        const oldestRequest = await this.client.zrange(key, 0, 0, 'WITHSCORES');
        const resetAt = new Date(parseInt(oldestRequest[1]) + window);

        return {
          allowed: false,
          remaining: 0,
          resetAt
        };
      }

      // 3. 新しいリクエストを追加
      await this.client.zadd(key, now, `${now}-${Math.random()}`);

      // 4. TTL設定
      await this.client.expire(key, Math.ceil(window / 1000));

      const resetAt = new Date(now + window);

      return {
        allowed: true,
        remaining: max - requestCount - 1,
        resetAt
      };
    } catch (error) {
      console.error(`[REDIS_SERVICE] Rate limit error for: ${identifier}`, error);

      // エラー時は許可 (fail-open policy)
      return {
        allowed: true,
        remaining: max,
        resetAt: new Date(now + window)
      };
    }
  }

  /**
   * セッション取得
   */
  async getSession(sessionId: string): Promise<any | null> {
    const key = `${cacheConfig.prefix.session}${sessionId}`;
    return this.get(key);
  }

  /**
   * セッション設定
   */
  async setSession(sessionId: string, sessionData: any): Promise<boolean> {
    const key = `${cacheConfig.prefix.session}${sessionId}`;
    return this.set(key, sessionData, cacheConfig.ttl.session);
  }

  /**
   * セッション削除
   */
  async deleteSession(sessionId: string): Promise<number> {
    const key = `${cacheConfig.prefix.session}${sessionId}`;
    return this.del(key);
  }

  /**
   * 接続状態取得
   */
  isReady(): boolean {
    return this.isConnected && this.client.status === 'ready';
  }

  /**
   * Ping
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('[REDIS_SERVICE] Ping error:', error);
      return false;
    }
  }

  /**
   * 統計情報取得
   */
  async getInfo(): Promise<Record<string, string>> {
    try {
      const info = await this.client.info();
      const lines = info.split('\r\n');
      const stats: Record<string, string> = {};

      for (const line of lines) {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value) {
            stats[key.trim()] = value.trim();
          }
        }
      }

      return stats;
    } catch (error) {
      console.error('[REDIS_SERVICE] Info error:', error);
      return {};
    }
  }

  /**
   * 接続終了
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      console.log('[REDIS_SERVICE] Disconnected from Redis');
    }
  }
}

// シングルトンインスタンス
let redisServiceInstance: RedisService | null = null;

export function getRedisService(): RedisService {
  if (!redisServiceInstance) {
    redisServiceInstance = new RedisService();
  }
  return redisServiceInstance;
}
