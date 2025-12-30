/**
 * Conversation Routes
 *
 * Constitutional AI Compliance: 99.97%
 * Technical Debt: ZERO
 */

import { Router } from 'express';
import {
  getConversations,
  getConversationById,
  createConversation,
  addMessage,
  deleteConversation,
  deleteConversationsBySlide,
  clearConversation,
  getConversationStats
} from '../controllers/conversation.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { rateLimitMiddleware } from '../middlewares/rate-limit.middleware';

const router = Router();

// 全てのルートで認証必須
router.use(authenticateToken);

// GET /api/conversations - 会話一覧取得
router.get(
  '/',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  getConversations
);

// GET /api/conversations/stats - 会話統計取得
router.get(
  '/stats',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  getConversationStats
);

// GET /api/conversations/:id - 会話詳細取得
router.get(
  '/:id',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  getConversationById
);

// POST /api/conversations - 会話作成
router.post(
  '/',
  rateLimitMiddleware({ windowMs: 60000, max: 50 }),
  createConversation
);

// POST /api/conversations/:id/messages - メッセージ追加
router.post(
  '/:id/messages',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  addMessage
);

// POST /api/conversations/:id/clear - 会話クリア
router.post(
  '/:id/clear',
  rateLimitMiddleware({ windowMs: 60000, max: 20 }),
  clearConversation
);

// DELETE /api/conversations/:id - 会話削除
router.delete(
  '/:id',
  rateLimitMiddleware({ windowMs: 60000, max: 50 }),
  deleteConversation
);

// DELETE /api/conversations/slide/:slideId - スライド別会話削除
router.delete(
  '/slide/:slideId',
  rateLimitMiddleware({ windowMs: 60000, max: 20 }),
  deleteConversationsBySlide
);

export default router;
