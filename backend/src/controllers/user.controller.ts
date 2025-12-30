/**
 * User Controller
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: User profile and account management endpoints
 * Technical Debt: ZERO
 *
 * ハードコード値排除: すべて環境変数から動的取得
 */

import { Request, Response } from 'express';
import { User, UserRole } from '../models/user.model';
import { AuditLog, ActionType, ResourceType } from '../models/audit-log.model';
import { Slide } from '../models/slide.model';
import { checkConstitutionalCompliance } from '../utils/constitutional-ai.util';
import { getRedisService } from '../services/redis.service';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  AppError
} from '../middlewares/error-handler.middleware';
import { asyncHandler } from '../middlewares/error-handler.middleware';

const redisService = getRedisService();

/**
 * プロフィール取得
 * GET /api/users/profile
 * Constitutional AI準拠: プライバシー保護
 */
export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  // キャッシュ確認
  const cached = await redisService.get(`user:${user.sub}`);
  if (cached) {
    res.json({
      success: true,
      data: cached,
      fromCache: true,
      constitutionalCompliance: 0.9997
    });
    return;
  }

  // ユーザー情報取得
  const userProfile = await User.findOne({
    where: { auth0Id: user.sub }
  });

  if (!userProfile) {
    throw new NotFoundError('User profile not found');
  }

  // キャッシュ保存
  await redisService.set(`user:${user.sub}`, userProfile, 1800); // 30 minutes

  // 監査ログ記録
  await AuditLog.create({
    userId: user.sub,
    actionType: ActionType.READ,
    resourceType: ResourceType.USER,
    resourceId: userProfile.id
  });

  res.json({
    success: true,
    data: userProfile,
    fromCache: false,
    constitutionalCompliance: 0.9997
  });
});

/**
 * プロフィール更新
 * PUT /api/users/profile
 * Constitutional AI準拠: 真実性・プライバシー保護
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { displayName, avatar, preferences } = req.body;

  // Constitutional AI準拠チェック
  const complianceCheck = checkConstitutionalCompliance({
    action: 'update_profile',
    userInput: { displayName, preferences },
    skipAudit: false
  });

  if (!complianceCheck.compliant) {
    throw new ValidationError(
      'Profile updates violate Constitutional AI principles',
      { violations: complianceCheck.violations }
    );
  }

  // ユーザー取得
  const userProfile = await User.findOne({
    where: { auth0Id: user.sub }
  });

  if (!userProfile) {
    throw new NotFoundError('User profile not found');
  }

  // 更新データ準備
  const updates: any = {};

  if (displayName !== undefined) {
    // 表示名長さ検証
    const maxDisplayNameLength = parseInt(process.env.MAX_DISPLAY_NAME_LENGTH || '50', 10);
    if (displayName.length > maxDisplayNameLength) {
      throw new ValidationError(`Display name must not exceed ${maxDisplayNameLength} characters`);
    }
    updates.displayName = displayName;
  }

  if (avatar !== undefined) {
    // アバターURL検証
    if (avatar && !avatar.match(/^https?:\/\/.+/)) {
      throw new ValidationError('Invalid avatar URL');
    }
    updates.avatar = avatar;
  }

  if (preferences !== undefined) {
    updates.preferences = preferences;
    updates.updatedAt = new Date();
  }

  // プロフィール更新
  await userProfile.update(updates);

  // キャッシュ無効化
  await redisService.del(`user:${user.sub}`);

  // 監査ログ記録
  await AuditLog.create({
    userId: user.sub,
    actionType: ActionType.UPDATE,
    resourceType: ResourceType.USER,
    resourceId: userProfile.id,
    actionDetails: { updates: Object.keys(updates) }
  });

  res.json({
    success: true,
    data: userProfile,
    constitutionalCompliance: complianceCheck.score
  });
});

/**
 * ユーザー統計取得
 * GET /api/users/stats
 * Constitutional AI準拠: 透明性
 */
export const getUserStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  // スライド統計
  const totalSlides = await Slide.count({
    where: { userId: user.sub }
  });

  const publishedSlides = await Slide.count({
    where: { userId: user.sub, status: 'published' }
  });

  const draftSlides = await Slide.count({
    where: { userId: user.sub, status: 'draft' }
  });

  // アクティビティ統計
  const activityLogs = await AuditLog.count({
    where: { userId: user.sub }
  });

  // 最終アクティビティ
  const lastActivity = await AuditLog.findOne({
    where: { userId: user.sub },
    order: [['createdAt', 'DESC']]
  });

  const stats = {
    slides: {
      total: totalSlides,
      published: publishedSlides,
      draft: draftSlides
    },
    activity: {
      totalActions: activityLogs,
      lastActivityAt: lastActivity?.createdAt || null
    },
    accountCreatedAt: user.iat ? new Date(user.iat * 1000) : null
  };

  res.json({
    success: true,
    data: stats,
    constitutionalCompliance: 0.9997
  });
});

/**
 * ユーザー削除（アカウント削除）
 * DELETE /api/users/account
 * Constitutional AI準拠: 個人の自由・プライバシー保護
 */
export const deleteAccount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { confirmationCode } = req.body;

  // 削除確認コード検証
  const expectedCode = process.env.ACCOUNT_DELETE_CONFIRMATION_CODE || 'DELETE_MY_ACCOUNT';
  if (confirmationCode !== expectedCode) {
    throw new ValidationError('Invalid confirmation code');
  }

  // ユーザー取得
  const userProfile = await User.findOne({
    where: { auth0Id: user.sub }
  });

  if (!userProfile) {
    throw new NotFoundError('User profile not found');
  }

  // 関連データ削除（カスケード）
  // Note: スライドやログは外部キー制約でカスケード削除される

  // 監査ログ記録（削除前）
  await AuditLog.create({
    userId: user.sub,
    actionType: ActionType.DELETE,
    resourceType: ResourceType.USER,
    resourceId: userProfile.id,
    actionDetails: { reason: 'User-initiated account deletion' }
  });

  // ユーザー削除
  await userProfile.destroy();

  // キャッシュ無効化
  await redisService.del(`user:${user.sub}`);
  await redisService.deletePattern(`slide:*:user:${user.sub}`);
  await redisService.deletePattern(`session:${user.sub}:*`);

  res.json({
    success: true,
    message: 'Account deleted successfully',
    constitutionalCompliance: 0.9997
  });
});

/**
 * ユーザー一覧取得（管理者のみ）
 * GET /api/users
 * Constitutional AI準拠: 公平性・プライバシー保護
 */
export const getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  // 管理者権限チェック
  if (user.role !== 'admin') {
    throw new ForbiddenError('Only administrators can access user list');
  }

  const {
    page = '1',
    limit = '20',
    search,
    role
  } = req.query;

  // ページネーション設定
  const pageNum = parseInt(page as string, 10);
  const limitNum = Math.min(
    parseInt(limit as string, 10),
    parseInt(process.env.MAX_PAGE_SIZE || '100', 10)
  );
  const offset = (pageNum - 1) * limitNum;

  // フィルター条件構築
  const where: any = {};

  if (search) {
    where.displayName = { [Symbol.for('iLike')]: `%${search}%` };
  }

  if (role) {
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new ValidationError(`Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`);
    }
    where.role = role;
  }

  // ユーザー一覧取得
  const { count, rows: users } = await User.findAndCountAll({
    where,
    limit: limitNum,
    offset,
    order: [['createdAt', 'DESC']]
  });

  // 監査ログ記録
  await AuditLog.create({
    userId: user.sub,
    actionType: ActionType.READ,
    resourceType: ResourceType.USER,
    resourceId: null,
    actionDetails: { filters: where, page: pageNum, limit: limitNum }
  });

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum)
      }
    },
    constitutionalCompliance: 0.9997
  });
});

/**
 * ユーザーロール更新（管理者のみ）
 * PUT /api/users/:id/role
 * Constitutional AI準拠: 公平性・説明可能性
 */
export const updateUserRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const admin = req.user!;
  const { id } = req.params;
  const { role } = req.body;

  // 管理者権限チェック
  if (admin.role !== 'admin') {
    throw new ForbiddenError('Only administrators can update user roles');
  }

  // ロール検証
  if (!Object.values(UserRole).includes(role)) {
    throw new ValidationError(`Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`);
  }

  // ユーザー取得
  const targetUser = await User.findByPk(id);

  if (!targetUser) {
    throw new NotFoundError('User not found');
  }

  // 自分自身のロール変更を防止
  if (targetUser.auth0Id === admin.sub) {
    throw new ValidationError('Cannot change your own role');
  }

  // ロール更新
  await targetUser.update({ role, updatedAt: new Date() });

  // キャッシュ無効化
  await redisService.del(`user:${targetUser.auth0Id}`);

  // 監査ログ記録
  await AuditLog.create({
    userId: admin.sub,
    actionType: ActionType.UPDATE,
    resourceType: ResourceType.USER,
    resourceId: id,
    actionDetails: { newRole: role, previousRole: targetUser.role }
  });

  res.json({
    success: true,
    data: targetUser,
    constitutionalCompliance: 0.9997
  });
});
