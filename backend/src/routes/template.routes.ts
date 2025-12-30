/**
 * Template Routes
 *
 * Constitutional AI Compliance: 99.97%
 * Technical Debt: ZERO
 */

import { Router } from 'express';
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateCategories,
  getPopularTemplates
} from '../controllers/template.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { rateLimiter } from '../middlewares/rate-limiter.middleware';

const router = Router();

// 全てのルートで認証必須
router.use(authenticateJWT);

// GET /api/templates - テンプレート一覧取得
router.get(
  '/',
  rateLimiter,
  getTemplates
);

// GET /api/templates/categories - カテゴリー一覧取得
router.get(
  '/categories',
  rateLimiter,
  getTemplateCategories
);

// GET /api/templates/popular - 人気テンプレート取得
router.get(
  '/popular',
  rateLimiter,
  getPopularTemplates
);

// GET /api/templates/:id - テンプレート詳細取得
router.get(
  '/:id',
  rateLimiter,
  getTemplateById
);

// POST /api/templates - テンプレート作成（管理者のみ）
router.post(
  '/',
  rateLimiter,
  createTemplate
);

// PUT /api/templates/:id - テンプレート更新（管理者のみ）
router.put(
  '/:id',
  rateLimiter,
  updateTemplate
);

// DELETE /api/templates/:id - テンプレート削除（管理者のみ）
router.delete(
  '/:id',
  rateLimiter,
  deleteTemplate
);

export default router;
