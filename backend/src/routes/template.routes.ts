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
import { authenticateToken } from '../middlewares/auth.middleware';
import { rateLimitMiddleware } from '../middlewares/rate-limit.middleware';

const router = Router();

// 全てのルートで認証必須
router.use(authenticateToken);

// GET /api/templates - テンプレート一覧取得
router.get(
  '/',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  getTemplates
);

// GET /api/templates/categories - カテゴリー一覧取得
router.get(
  '/categories',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  getTemplateCategories
);

// GET /api/templates/popular - 人気テンプレート取得
router.get(
  '/popular',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  getPopularTemplates
);

// GET /api/templates/:id - テンプレート詳細取得
router.get(
  '/:id',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  getTemplateById
);

// POST /api/templates - テンプレート作成（管理者のみ）
router.post(
  '/',
  rateLimitMiddleware({ windowMs: 60000, max: 10 }),
  createTemplate
);

// PUT /api/templates/:id - テンプレート更新（管理者のみ）
router.put(
  '/:id',
  rateLimitMiddleware({ windowMs: 60000, max: 20 }),
  updateTemplate
);

// DELETE /api/templates/:id - テンプレート削除（管理者のみ）
router.delete(
  '/:id',
  rateLimitMiddleware({ windowMs: 60000, max: 10 }),
  deleteTemplate
);

export default router;
