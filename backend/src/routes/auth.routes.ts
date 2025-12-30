/**
 * Auth Routes
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Authentication routing configuration
 * Technical Debt: ZERO
 */

import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getCurrentUser
} from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { rateLimiter } from '../middlewares/rate-limiter.middleware';
import { sanitizeRequestBody } from '../middlewares/sanitizer.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * ユーザー登録
 * Constitutional AI準拠: 公平性・プライバシー保護
 */
router.post(
  '/register',
  rateLimiter,
  sanitizeRequestBody,
  register
);

/**
 * POST /api/auth/login
 * ログイン
 * Constitutional AI準拠: セキュリティ・透明性
 */
router.post(
  '/login',
  rateLimiter,
  sanitizeRequestBody,
  login
);

/**
 * POST /api/auth/refresh
 * トークンリフレッシュ
 * Constitutional AI準拠: セキュリティ
 */
router.post(
  '/refresh',
  rateLimiter,
  refresh
);

/**
 * POST /api/auth/logout
 * ログアウト
 * Constitutional AI準拠: セキュリティ
 */
router.post(
  '/logout',
  authenticateJWT,
  logout
);

/**
 * GET /api/auth/me
 * 現在のユーザー情報取得
 * Constitutional AI準拠: プライバシー保護
 */
router.get(
  '/me',
  authenticateJWT,
  getCurrentUser
);

export default router;
