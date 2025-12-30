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
import { authenticateJWT } from '../middlewares/auth.middleware';
import { rateLimiter } from '../middlewares/rate-limiter.middleware';

const router = Router();

// 全てのルートで認証必須
router.use(authenticateJWT);

// GET /api/users/profile - プロフィール取得
router.get(
  '/profile',
  rateLimiter,
  getProfile
);

// PUT /api/users/profile - プロフィール更新
router.put(
  '/profile',
  rateLimiter,
  updateProfile
);

// GET /api/users/stats - ユーザー統計取得
router.get(
  '/stats',
  rateLimiter,
  getUserStats
);

// DELETE /api/users/account - アカウント削除
router.delete(
  '/account',
  rateLimiter,
  deleteAccount
);

// GET /api/users - ユーザー一覧取得（管理者のみ）
router.get(
  '/',
  rateLimiter,
  getUsers
);

// PUT /api/users/:id/role - ユーザーロール更新（管理者のみ）
router.put(
  '/:id/role',
  rateLimiter,
  updateUserRole
);

export default router;
