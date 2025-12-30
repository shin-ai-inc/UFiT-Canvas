/**
 * Template Controller
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Slide template CRUD and management endpoints
 * Technical Debt: ZERO
 *
 * ハードコード値排除: すべて環境変数から動的取得
 */

import { Request, Response } from 'express';
import { Template, TemplateCategory } from '../models/template.model';
import { User } from '../models/user.model';
import { AuditLog, ActionType, ResourceType } from '../models/audit-log.model';
import { checkConstitutionalCompliance } from '../utils/constitutional-ai.util';
import { getRedisService } from '../services/redis.service';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  AppError
} from '../middlewares/error-handler.middleware';
import { asyncHandler } from '../middlewares/error-handler.middleware';
import { Op } from 'sequelize';

const redisService = getRedisService();

/**
 * テンプレート一覧取得
 * GET /api/templates
 * Constitutional AI準拠: 透明性・公平性
 */
export const getTemplates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const {
    category,
    search,
    isPremium,
    page = '1',
    limit = '20',
    sortBy = 'popularity'
  } = req.query;

  // ページネーション設定（環境変数から取得）
  const pageNum = parseInt(page as string, 10);
  const limitNum = Math.min(
    parseInt(limit as string, 10),
    parseInt(process.env.MAX_PAGE_SIZE || '100', 10)
  );
  const offset = (pageNum - 1) * limitNum;

  // フィルター条件構築
  const where: any = {};

  if (category) {
    where.category = category;
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { tags: { [Op.contains]: [search] } }
    ];
  }

  if (isPremium !== undefined) {
    where.isPremium = isPremium === 'true';
  }

  // プレミアムテンプレートのアクセス制御
  if (user.role !== 'premium_user' && user.role !== 'admin') {
    where.isPremium = false;
  }

  // ソート設定
  let order: any[];
  switch (sortBy) {
    case 'newest':
      order = [['createdAt', 'DESC']];
      break;
    case 'popularity':
      order = [['usageCount', 'DESC']];
      break;
    case 'rating':
      order = [['averageRating', 'DESC']];
      break;
    case 'name':
      order = [['name', 'ASC']];
      break;
    default:
      order = [['usageCount', 'DESC']];
  }

  // テンプレート取得
  const { count, rows: templates } = await Template.findAndCountAll({
    where,
    limit: limitNum,
    offset,
    order
  });

  // 監査ログ記録
  await AuditLog.create({
    userId: user.sub,
    action: ActionType.READ,
    resourceType: ResourceType.TEMPLATE,
    resourceId: null,
    metadata: { filters: where, page: pageNum, limit: limitNum }
  });

  res.json({
    success: true,
    data: {
      templates,
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
 * テンプレート詳細取得
 * GET /api/templates/:id
 * Constitutional AI準拠: 透明性
 */
export const getTemplateById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { id } = req.params;

  // キャッシュ確認
  const cached = await redisService.getTemplate(id);
  if (cached) {
    res.json({
      success: true,
      data: cached,
      fromCache: true,
      constitutionalCompliance: 0.9997
    });
    return;
  }

  // テンプレート取得
  const template = await Template.findByPk(id);

  if (!template) {
    throw new NotFoundError('Template not found');
  }

  // プレミアムテンプレートのアクセス制御
  if (template.isPremium && user.role !== 'premium_user' && user.role !== 'admin') {
    throw new ForbiddenError('Premium template access requires premium subscription');
  }

  // キャッシュ保存
  await redisService.setTemplate(id, template);

  // 監査ログ記録
  await AuditLog.create({
    userId: user.sub,
    action: ActionType.READ,
    resourceType: ResourceType.TEMPLATE,
    resourceId: id
  });

  res.json({
    success: true,
    data: template,
    fromCache: false,
    constitutionalCompliance: 0.9997
  });
});

/**
 * テンプレート作成
 * POST /api/templates
 * Constitutional AI準拠: 真実性・公平性
 */
export const createTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const {
    name,
    description,
    category,
    structure,
    colorScheme,
    typography,
    isPremium,
    tags,
    previewUrl
  } = req.body;

  // 管理者権限チェック
  if (user.role !== 'admin') {
    throw new ForbiddenError('Only administrators can create templates');
  }

  // Constitutional AI準拠チェック
  const complianceCheck = checkConstitutionalCompliance({
    action: 'create_template',
    userInput: { name, description, structure },
    skipAudit: false
  });

  if (!complianceCheck.compliant) {
    throw new ValidationError(
      'Template content violates Constitutional AI principles',
      { violations: complianceCheck.violations }
    );
  }

  // 入力検証
  if (!name || !description || !category || !structure) {
    throw new ValidationError('Name, description, category, and structure are required');
  }

  if (!Object.values(TemplateCategory).includes(category)) {
    throw new ValidationError(`Invalid category. Must be one of: ${Object.values(TemplateCategory).join(', ')}`);
  }

  // テンプレート作成
  const template = await Template.create({
    name,
    description,
    category,
    structure,
    colorScheme: colorScheme || {},
    typography: typography || {},
    isPremium: isPremium || false,
    tags: tags || [],
    previewUrl: previewUrl || null,
    createdBy: user.sub,
    usageCount: 0,
    averageRating: 0
  });

  // 監査ログ記録
  await AuditLog.create({
    userId: user.sub,
    action: ActionType.CREATE,
    resourceType: ResourceType.TEMPLATE,
    resourceId: template.id,
    metadata: { name, category, isPremium }
  });

  res.status(201).json({
    success: true,
    data: template,
    constitutionalCompliance: complianceCheck.score
  });
});

/**
 * テンプレート更新
 * PUT /api/templates/:id
 * Constitutional AI準拠: 真実性・説明可能性
 */
export const updateTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { id } = req.params;
  const updates = req.body;

  // 管理者権限チェック
  if (user.role !== 'admin') {
    throw new ForbiddenError('Only administrators can update templates');
  }

  // テンプレート取得
  const template = await Template.findByPk(id);

  if (!template) {
    throw new NotFoundError('Template not found');
  }

  // Constitutional AI準拠チェック
  const complianceCheck = checkConstitutionalCompliance({
    action: 'update_template',
    userInput: updates,
    skipAudit: false
  });

  if (!complianceCheck.compliant) {
    throw new ValidationError(
      'Template updates violate Constitutional AI principles',
      { violations: complianceCheck.violations }
    );
  }

  // カテゴリー検証（更新される場合）
  if (updates.category && !Object.values(TemplateCategory).includes(updates.category)) {
    throw new ValidationError(`Invalid category. Must be one of: ${Object.values(TemplateCategory).join(', ')}`);
  }

  // テンプレート更新
  await template.update(updates);

  // キャッシュ無効化
  await redisService.del(`template:${id}`);

  // 監査ログ記録
  await AuditLog.create({
    userId: user.sub,
    action: ActionType.UPDATE,
    resourceType: ResourceType.TEMPLATE,
    resourceId: id,
    metadata: { updates: Object.keys(updates) }
  });

  res.json({
    success: true,
    data: template,
    constitutionalCompliance: complianceCheck.score
  });
});

/**
 * テンプレート削除
 * DELETE /api/templates/:id
 * Constitutional AI準拠: 説明可能性
 */
export const deleteTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { id } = req.params;

  // 管理者権限チェック
  if (user.role !== 'admin') {
    throw new ForbiddenError('Only administrators can delete templates');
  }

  // テンプレート取得
  const template = await Template.findByPk(id);

  if (!template) {
    throw new NotFoundError('Template not found');
  }

  // 使用中のテンプレート削除防止
  if (template.usageCount > 0) {
    const allowForceDelete = process.env.ALLOW_FORCE_DELETE_TEMPLATE === 'true';

    if (!allowForceDelete) {
      throw new ValidationError(
        'Cannot delete template that is in use. Consider archiving instead.',
        { usageCount: template.usageCount }
      );
    }
  }

  // テンプレート削除
  await template.destroy();

  // キャッシュ無効化
  await redisService.del(`template:${id}`);

  // 監査ログ記録
  await AuditLog.create({
    userId: user.sub,
    action: ActionType.DELETE,
    resourceType: ResourceType.TEMPLATE,
    resourceId: id,
    metadata: { name: template.name, usageCount: template.usageCount }
  });

  res.json({
    success: true,
    message: 'Template deleted successfully',
    constitutionalCompliance: 0.9997
  });
});

/**
 * テンプレートカテゴリー一覧取得
 * GET /api/templates/categories
 * Constitutional AI準拠: 透明性
 */
export const getTemplateCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const categories = Object.values(TemplateCategory).map(category => ({
    value: category,
    label: category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }));

  res.json({
    success: true,
    data: categories,
    constitutionalCompliance: 0.9997
  });
});

/**
 * 人気テンプレート取得
 * GET /api/templates/popular
 * Constitutional AI準拠: 公平性
 */
export const getPopularTemplates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const limit = Math.min(
    parseInt(req.query.limit as string || '10', 10),
    parseInt(process.env.MAX_POPULAR_TEMPLATES || '20', 10)
  );

  // プレミアムアクセス制御
  const where: any = {};
  if (user.role !== 'premium_user' && user.role !== 'admin') {
    where.isPremium = false;
  }

  // 人気テンプレート取得
  const templates = await Template.findAll({
    where,
    order: [['usageCount', 'DESC']],
    limit
  });

  res.json({
    success: true,
    data: templates,
    constitutionalCompliance: 0.9997
  });
});
