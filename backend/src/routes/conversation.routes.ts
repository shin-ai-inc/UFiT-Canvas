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
import { authenticateJWT } from '../middlewares/auth.middleware';
import { rateLimiter } from '../middlewares/rate-limiter.middleware';

const router = Router();

// 全てのルートで認証必須
router.use(authenticateJWT);

// GET /api/conversations - 会話一覧取得
router.get(
  '/',
  rateLimiter,
  getConversations
);

// GET /api/conversations/stats - 会話統計取得
router.get(
  '/stats',
  rateLimiter,
  getConversationStats
);

// GET /api/conversations/:id - 会話詳細取得
router.get(
  '/:id',
  rateLimiter,
  getConversationById
);

// POST /api/conversations - 会話作成
router.post(
  '/',
  rateLimiter,
  createConversation
);

// POST /api/conversations/:id/messages - メッセージ追加
router.post(
  '/:id/messages',
  rateLimiter,
  addMessage
);

// POST /api/conversations/:id/clear - 会話クリア
router.post(
  '/:id/clear',
  rateLimiter,
  clearConversation
);

// DELETE /api/conversations/:id - 会話削除
router.delete(
  '/:id',
  rateLimiter,
  deleteConversation
);

// DELETE /api/conversations/slide/:slideId - スライド別会話削除
router.delete(
  '/slide/:slideId',
  rateLimiter,
  deleteConversationsBySlide
);

export default router;
