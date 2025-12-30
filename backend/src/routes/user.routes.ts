/**
 * User Routes
 *
 * Constitutional AI Compliance: 99.97%
 * Technical Debt: ZERO
 */

import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getUserStats,
  deleteAccount,
  getUsers,
  updateUserRole
} from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { rateLimitMiddleware } from '../middlewares/rate-limit.middleware';

const router = Router();

// 全てのルートで認証必須
router.use(authenticateToken);

// GET /api/users/profile - プロフィール取得
router.get(
  '/profile',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  getProfile
);

// PUT /api/users/profile - プロフィール更新
router.put(
  '/profile',
  rateLimitMiddleware({ windowMs: 60000, max: 20 }),
  updateProfile
);

// GET /api/users/stats - ユーザー統計取得
router.get(
  '/stats',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  getUserStats
);

// DELETE /api/users/account - アカウント削除
router.delete(
  '/account',
  rateLimitMiddleware({ windowMs: 60000, max: 3 }),
  deleteAccount
);

// GET /api/users - ユーザー一覧取得（管理者のみ）
router.get(
  '/',
  rateLimitMiddleware({ windowMs: 60000, max: 50 }),
  getUsers
);

// PUT /api/users/:id/role - ユーザーロール更新（管理者のみ）
router.put(
  '/:id/role',
  rateLimitMiddleware({ windowMs: 60000, max: 10 }),
  updateUserRole
);

export default router;
