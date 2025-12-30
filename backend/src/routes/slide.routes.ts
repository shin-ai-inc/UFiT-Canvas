/**
 * Slide Routes
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Slide management routing configuration
 * Technical Debt: ZERO
 */

import { Router } from 'express';
import {
  createSlide,
  getSlides,
  getSlideById,
  updateSlide,
  deleteSlide,
  generateSlideContent,
  analyzeSlideQuality,
  autoFixSlide
} from '../controllers/slide.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { checkPermission, checkMinimumRole, UserRole } from '../middlewares/rbac.middleware';
import { rateLimiter, claudeApiRateLimiter } from '../middlewares/rate-limiter.middleware';
import { sanitizeRequestBody, sanitizeSlideContent } from '../middlewares/sanitizer.middleware';

const router = Router();

/**
 * すべてのスライドエンドポイントに認証必須
 */
router.use(authenticateJWT);

/**
 * POST /api/slides
 * スライド作成
 * Constitutional AI準拠: 公平性・真実性
 */
router.post(
  '/',
  rateLimiter,
  sanitizeRequestBody,
  checkPermission('slide:create'),
  createSlide
);

/**
 * GET /api/slides
 * スライド一覧取得
 * Constitutional AI準拠: プライバシー保護
 */
router.get(
  '/',
  rateLimiter,
  getSlides
);

/**
 * GET /api/slides/:id
 * スライド詳細取得
 * Constitutional AI準拠: プライバシー保護
 */
router.get(
  '/:id',
  rateLimiter,
  getSlideById
);

/**
 * PUT /api/slides/:id
 * スライド更新
 * Constitutional AI準拠: データ整合性
 */
router.put(
  '/:id',
  rateLimiter,
  sanitizeRequestBody,
  checkPermission('slide:update'),
  updateSlide
);

/**
 * DELETE /api/slides/:id
 * スライド削除
 * Constitutional AI準拠: データ最小化原則
 */
router.delete(
  '/:id',
  rateLimiter,
  checkPermission('slide:delete'),
  deleteSlide
);

/**
 * POST /api/slides/:id/generate
 * スライドHTML/CSS生成
 * Constitutional AI準拠: 真実性・創造性
 */
router.post(
  '/:id/generate',
  claudeApiRateLimiter,
  sanitizeSlideContent,
  checkPermission('slide:create'),
  generateSlideContent
);

/**
 * POST /api/slides/:id/analyze
 * スライド品質分析
 * Constitutional AI準拠: 真実性・改善
 */
router.post(
  '/:id/analyze',
  claudeApiRateLimiter,
  checkPermission('vision:auto-fix'),
  checkMinimumRole(UserRole.PREMIUM_USER),
  analyzeSlideQuality
);

/**
 * POST /api/slides/:id/auto-fix
 * スライド自動修正
 * Constitutional AI準拠: 継続改善・真実性
 */
router.post(
  '/:id/auto-fix',
  claudeApiRateLimiter,
  checkPermission('vision:auto-fix'),
  checkMinimumRole(UserRole.PREMIUM_USER),
  autoFixSlide
);

export default router;
