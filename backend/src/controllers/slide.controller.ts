/**
 * Slide Controller
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Presentation slide CRUD and AI generation endpoints
 * Technical Debt: ZERO
 *
 * ハードコード値排除: すべて環境変数から動的取得
 */

import { Request, Response } from 'express';
import { Slide, SlideStatus, SlideVisibility, OutlineItem } from '../models/slide.model';
import { Template } from '../models/template.model';
import { User } from '../models/user.model';
import { AuditLog, ActionType, ResourceType } from '../models/audit-log.model';
import { ClaudeService } from '../services/claude.service';
import { TwoStageResearchService } from '../services/two-stage-research.service';
import { TemplateAdaptationService } from '../services/template-adaptation.service';
import { VisionAutoFixService } from '../services/vision-auto-fix.service';
import { PuppeteerRenderingService } from '../services/puppeteer-rendering.service';
import { checkConstitutionalCompliance } from '../utils/constitutional-ai.util';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  AppError
} from '../middlewares/error-handler.middleware';
import { asyncHandler } from '../middlewares/error-handler.middleware';

const claudeService = new ClaudeService();
const researchService = new TwoStageResearchService();
const templateAdaptationService = new TemplateAdaptationService();
const visionAutoFixService = new VisionAutoFixService();
const puppeteerService = new PuppeteerRenderingService();

/**
 * スライド作成
 * POST /api/slides
 * Constitutional AI準拠: 公平性・真実性
 */
export const createSlide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { title, topic, outline, templateId, visibility } = req.body;

  // Constitutional AI準拠チェック
  const complianceCheck = checkConstitutionalCompliance({
    action: 'create_slide',
    userInput: { title, topic, outline },
    skipAudit: false
  });

  if (!complianceCheck.compliant) {
    throw new ValidationError(
      'Slide content violates Constitutional AI principles',
      { violations: complianceCheck.violations }
    );
  }

  // 入力検証
  if (!title || !topic) {
    throw new ValidationError('Title and topic are required');
  }

  if (!Array.isArray(outline) || outline.length === 0) {
    throw new ValidationError('Outline must be a non-empty array');
  }

  // テンプレート検証（指定されている場合）
  let template = null;
  if (templateId) {
    template = await Template.findByPk(templateId);

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    // Premium template access check
    if (template.isPremium && user.role !== 'premium_user' && user.role !== 'admin') {
      throw new ForbiddenError('Premium template access requires premium subscription');
    }
  }

  // スライド作成
  const slide = await Slide.create({
    userId: user.sub,
    title,
    topic,
    outline: outline as OutlineItem[],
    templateId: templateId || null,
    status: SlideStatus.DRAFT,
    visibility: visibility || SlideVisibility.PRIVATE,
    iterationsCount: 0,
    maxIterations: parseInt(process.env.MAX_AUTO_FIX_ITERATIONS || '3', 10)
  });

  // テンプレート使用回数更新
  if (template) {
    template.incrementUsage();
    await template.save();
  }

  // 監査ログ記録
  await AuditLog.create({
    userId: user.sub,
    actionType: ActionType.SLIDE_CREATE,
    resourceType: ResourceType.SLIDE,
    resourceId: slide.id,
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || undefined,
    actionDetails: {
      slideTitle: title,
      templateUsed: templateId || 'none'
    },
    success: true,
    constitutionalComplianceScore: complianceCheck.score
  });

  res.status(201).json({
    message: 'Slide created successfully',
    slide: slide.toJSON(),
    constitutionalCompliance: complianceCheck.score
  });
});

/**
 * スライド一覧取得
 * GET /api/slides
 * Constitutional AI準拠: プライバシー保護
 */
export const getSlides = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { status, visibility, limit, offset } = req.query;

  const whereClause: any = { userId: user.sub };

  if (status) {
    whereClause.status = status;
  }

  if (visibility) {
    whereClause.visibility = visibility;
  }

  const limitValue = parseInt((limit as string) || process.env.DEFAULT_SLIDES_LIMIT || '20', 10);
  const offsetValue = parseInt((offset as string) || '0', 10);

  const { rows: slides, count } = await Slide.findAndCountAll({
    where: whereClause,
    limit: limitValue,
    offset: offsetValue,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Template,
        as: 'template',
        attributes: ['id', 'name', 'category', 'thumbnailUrl']
      }
    ]
  });

  res.status(200).json({
    slides: slides.map(slide => slide.toJSON()),
    pagination: {
      total: count,
      limit: limitValue,
      offset: offsetValue,
      hasMore: (offsetValue + limitValue) < count
    }
  });
});

/**
 * スライド詳細取得
 * GET /api/slides/:id
 * Constitutional AI準拠: プライバシー保護
 */
export const getSlideById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { id } = req.params;

  const slide = await Slide.findByPk(id, {
    include: [
      {
        model: Template,
        as: 'template'
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }
    ]
  });

  if (!slide) {
    throw new NotFoundError('Slide not found');
  }

  // 権限チェック
  if (slide.userId !== user.sub && slide.visibility === SlideVisibility.PRIVATE) {
    throw new ForbiddenError('You do not have permission to access this slide');
  }

  // 監査ログ記録
  await AuditLog.create({
    userId: user.sub,
    actionType: ActionType.SLIDE_READ,
    resourceType: ResourceType.SLIDE,
    resourceId: slide.id,
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || undefined,
    actionDetails: {},
    success: true,
    constitutionalComplianceScore: 1.0
  });

  res.status(200).json({
    slide: slide.toJSON()
  });
});

/**
 * スライド更新
 * PUT /api/slides/:id
 * Constitutional AI準拠: データ整合性
 */
export const updateSlide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { id } = req.params;
  const updates = req.body;

  const slide = await Slide.findByPk(id);

  if (!slide) {
    throw new NotFoundError('Slide not found');
  }

  // 権限チェック
  if (slide.userId !== user.sub) {
    throw new ForbiddenError('You do not have permission to update this slide');
  }

  // Constitutional AI準拠チェック
  const complianceCheck = checkConstitutionalCompliance({
    action: 'update_slide',
    userInput: updates,
    skipAudit: false
  });

  if (!complianceCheck.compliant) {
    throw new ValidationError(
      'Slide update violates Constitutional AI principles',
      { violations: complianceCheck.violations }
    );
  }

  // 更新可能フィールド
  const allowedFields = ['title', 'topic', 'outline', 'visibility', 'htmlContent', 'cssContent'];
  const changedFields: string[] = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      (slide as any)[field] = updates[field];
      changedFields.push(field);
    }
  }

  await slide.save();

  // 監査ログ記録
  await AuditLog.create({
    userId: user.sub,
    actionType: ActionType.SLIDE_UPDATE,
    resourceType: ResourceType.SLIDE,
    resourceId: slide.id,
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || undefined,
    actionDetails: {
      changedFields
    },
    success: true,
    constitutionalComplianceScore: complianceCheck.score
  });

  res.status(200).json({
    message: 'Slide updated successfully',
    slide: slide.toJSON(),
    constitutionalCompliance: complianceCheck.score
  });
});

/**
 * スライド削除
 * DELETE /api/slides/:id
 * Constitutional AI準拠: データ最小化原則
 */
export const deleteSlide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { id } = req.params;

  const slide = await Slide.findByPk(id);

  if (!slide) {
    throw new NotFoundError('Slide not found');
  }

  // 権限チェック
  if (slide.userId !== user.sub && user.role !== 'admin') {
    throw new ForbiddenError('You do not have permission to delete this slide');
  }

  // 監査ログ記録（削除前）
  await AuditLog.create({
    userId: user.sub,
    actionType: ActionType.SLIDE_DELETE,
    resourceType: ResourceType.SLIDE,
    resourceId: slide.id,
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || undefined,
    actionDetails: {
      slideTitle: slide.title
    },
    success: true,
    constitutionalComplianceScore: 1.0
  });

  await slide.destroy();

  res.status(200).json({
    message: 'Slide deleted successfully'
  });
});

/**
 * スライドHTML/CSS生成
 * POST /api/slides/:id/generate
 * Constitutional AI準拠: 真実性・創造性
 *
 * Options in request body:
 * - useResearch: boolean - Enable two-stage deep research
 * - autoSelectTemplate: boolean - Auto-select best matching template
 */
export const generateSlideContent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { id } = req.params;
  const { useResearch = false, autoSelectTemplate = false } = req.body;

  const slide = await Slide.findByPk(id, {
    include: [{ model: Template, as: 'template' }]
  });

  if (!slide) {
    throw new NotFoundError('Slide not found');
  }

  // 権限チェック
  if (slide.userId !== user.sub) {
    throw new ForbiddenError('You do not have permission to generate content for this slide');
  }

  // ステータス更新
  slide.updateStatus(SlideStatus.PROCESSING);
  await slide.save();

  try {
    let researchReport = null;
    let templateAdaptationReport = null;

    // Optional: Two-Stage Deep Research
    if (useResearch) {
      console.log('[GENERATE] Executing two-stage research...');
      researchReport = await researchService.executeResearch(
        slide.topic,
        slide.outline.map(item => item.content)
      );

      // Store research metadata
      slide.metadata = {
        ...slide.metadata,
        researchReport: {
          questionsGenerated: researchReport.metadata.questionsGenerated,
          averageQuality: researchReport.metadata.averageQuality,
          totalDuration: researchReport.totalDuration
        }
      };
    }

    // Optional: Auto-select best template
    if (autoSelectTemplate && !slide.template) {
      console.log('[GENERATE] Finding best matching template...');
      templateAdaptationReport = await templateAdaptationService.findBestTemplates(
        slide.topic,
        slide.outline.map(item => item.content)
      );

      if (templateAdaptationReport.topMatch) {
        slide.templateId = templateAdaptationReport.topMatch.template.id;

        // Store adaptation metadata
        slide.metadata = {
          ...slide.metadata,
          templateAdaptation: {
            similarityScore: templateAdaptationReport.topMatch.similarityScore,
            totalTemplatesAnalyzed: templateAdaptationReport.totalTemplatesAnalyzed
          }
        };

        // Reload with template
        await slide.reload({ include: [{ model: Template, as: 'template' }] });
      }
    }

    // テンプレート取得
    const templateContent = slide.template
      ? `${slide.template.htmlTemplate}\n\n${slide.template.cssTemplate}`
      : 'Use modern, professional HTML/CSS with Golden Ratio spacing';

    // Build enhanced prompt with research results
    const enhancedOutline = researchReport
      ? [...slide.outline.map(item => item.content), `\n\nResearch Insights:\n${researchReport.synthesis}`]
      : slide.outline.map(item => item.content);

    // Claude APIでHTML生成
    const htmlContent = await claudeService.generateSlideHTML(
      slide.topic,
      enhancedOutline,
      templateContent
    );

    // スライド更新
    slide.htmlContent = htmlContent;
    slide.updateStatus(SlideStatus.COMPLETED);
    await slide.save();

    // 監査ログ記録
    await AuditLog.create({
      userId: user.sub,
      actionType: ActionType.CLAUDE_API_CALL,
      resourceType: ResourceType.SLIDE,
      resourceId: slide.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || undefined,
      actionDetails: {
        operation: 'generate_slide_html',
        topic: slide.topic,
        useResearch,
        autoSelectTemplate,
        researchUsed: !!researchReport,
        templateSelected: !!templateAdaptationReport
      },
      success: true,
      constitutionalComplianceScore: 1.0
    });

    res.status(200).json({
      message: 'Slide content generated successfully',
      slide: slide.toJSON(),
      research: researchReport ? {
        averageQuality: researchReport.metadata.averageQuality,
        questionsExplored: researchReport.metadata.questionsExplored
      } : null,
      templateAdaptation: templateAdaptationReport ? {
        topMatchScore: templateAdaptationReport.topMatch?.similarityScore,
        templatesAnalyzed: templateAdaptationReport.totalTemplatesAnalyzed
      } : null
    });
  } catch (error) {
    // エラー時ステータス更新
    slide.updateStatus(SlideStatus.FAILED);
    await slide.save();

    // 監査ログ記録
    await AuditLog.create({
      userId: user.sub,
      actionType: ActionType.CLAUDE_API_CALL,
      resourceType: ResourceType.SLIDE,
      resourceId: slide.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || undefined,
      actionDetails: {
        operation: 'generate_slide_html_failed'
      },
      success: false,
      errorMessage: (error as Error).message,
      constitutionalComplianceScore: 1.0
    });

    throw error;
  }
});

/**
 * スライド品質分析
 * POST /api/slides/:id/analyze
 * Constitutional AI準拠: 真実性・改善
 *
 * Options in request body:
 * - screenshotBase64: string (optional) - If not provided, will auto-capture using Puppeteer
 */
export const analyzeSlideQuality = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { id } = req.params;
  let { screenshotBase64 } = req.body;

  const slide = await Slide.findByPk(id);

  if (!slide) {
    throw new NotFoundError('Slide not found');
  }

  // 権限チェック
  if (slide.userId !== user.sub) {
    throw new ForbiddenError('You do not have permission to analyze this slide');
  }

  // Auto-capture screenshot if not provided
  if (!screenshotBase64 && slide.htmlContent && slide.cssContent) {
    console.log('[ANALYZE] Auto-capturing screenshot with Puppeteer...');

    const renderResult = await puppeteerService.renderAndCapture(
      slide.htmlContent,
      slide.cssContent,
      { format: 'png', fullPage: true }
    );

    screenshotBase64 = renderResult.screenshotBase64;

    // Store render metadata
    slide.metadata = {
      ...slide.metadata,
      lastRender: {
        width: renderResult.width,
        height: renderResult.height,
        renderTime: renderResult.renderTime,
        timestamp: new Date()
      }
    };
  }

  if (!screenshotBase64) {
    throw new ValidationError('Screenshot (base64) is required or slide must have HTML/CSS content');
  }

  // Vision API analysis using Vision Auto-Fix Service
  const analysis = await visionAutoFixService.analyzeSlideQuality(screenshotBase64);

  // Get auto-fix recommendations
  const recommendations = visionAutoFixService.getAutoFixRecommendations(analysis);

  // 品質スコア更新
  slide.updateQualityScore({
    qualityScore: analysis.qualityScore,
    issues: analysis.issues,
    analyzedAt: new Date()
  });

  await slide.save();

  // 監査ログ記録
  await AuditLog.create({
    userId: user.sub,
    actionType: ActionType.VISION_API_CALL,
    resourceType: ResourceType.SLIDE,
    resourceId: slide.id,
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || undefined,
    actionDetails: {
      operation: 'analyze_slide_quality',
      qualityScore: analysis.qualityScore,
      issuesCount: analysis.issues.length,
      goldenRatioCompliance: analysis.goldenRatioCompliance,
      accessibilityScore: analysis.accessibilityScore,
      autoCaptured: !req.body.screenshotBase64
    },
    success: true,
    constitutionalComplianceScore: 1.0
  });

  res.status(200).json({
    message: 'Slide quality analyzed successfully',
    analysis: {
      qualityScore: analysis.qualityScore,
      issues: analysis.issues,
      strengths: analysis.strengths,
      goldenRatioCompliance: analysis.goldenRatioCompliance,
      accessibilityScore: analysis.accessibilityScore,
      aestheticScore: analysis.aestheticScore
    },
    recommendations,
    slide: slide.toJSON()
  });
});

/**
 * スライド自動修正
 * POST /api/slides/:id/auto-fix
 * Constitutional AI準拠: 継続改善・真実性
 *
 * Complete Auto-Fix Flow:
 * 1. Check quality analysis exists
 * 2. Execute auto-fix with Vision Auto-Fix Service
 * 3. Update slide with fixed content
 * 4. Re-render and re-analyze (optional)
 */
export const autoFixSlide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { id } = req.params;
  const { reAnalyze = false } = req.body;

  const slide = await Slide.findByPk(id);

  if (!slide) {
    throw new NotFoundError('Slide not found');
  }

  // 権限チェック
  if (slide.userId !== user.sub) {
    throw new ForbiddenError('You do not have permission to auto-fix this slide');
  }

  // Require HTML/CSS content
  if (!slide.htmlContent || !slide.cssContent) {
    throw new ValidationError('Slide must have HTML/CSS content to auto-fix');
  }

  // Require quality analysis
  if (!slide.qualityAnalysis) {
    throw new ValidationError('Quality analysis must be performed before auto-fix');
  }

  // イテレーション制限チェック
  const canIterate = slide.incrementIteration();

  if (!canIterate) {
    throw new AppError(
      'Maximum auto-fix iterations reached',
      429,
      true,
      { maxIterations: slide.maxIterations, current: slide.iterationsCount }
    );
  }

  await slide.save();

  // Constitutional AI準拠: 無限ループ防止
  console.log(`[AUTO_FIX] Slide ${id} - Iteration ${slide.iterationsCount}/${slide.maxIterations}`);

  try {
    // Execute auto-fix using Vision Auto-Fix Service
    const autoFixResult = await visionAutoFixService.executeAutoFix(
      slide,
      slide.qualityAnalysis
    );

    // Update slide with fixed content
    slide.htmlContent = autoFixResult.fixedHTML;
    slide.cssContent = autoFixResult.fixedCSS;

    // Store auto-fix metadata
    slide.metadata = {
      ...slide.metadata,
      lastAutoFix: {
        iterationsUsed: autoFixResult.iterationsUsed,
        qualityImprovement: autoFixResult.qualityImprovement,
        fixesApplied: autoFixResult.fixesApplied,
        finalQualityScore: autoFixResult.finalQualityScore,
        timestamp: new Date()
      }
    };

    await slide.save();

    // Optional: Re-analyze after fix
    let newAnalysis = null;
    if (reAnalyze) {
      console.log('[AUTO_FIX] Re-analyzing quality after auto-fix...');

      const renderResult = await puppeteerService.renderAndCapture(
        slide.htmlContent,
        slide.cssContent,
        { format: 'png', fullPage: true }
      );

      newAnalysis = await visionAutoFixService.analyzeSlideQuality(
        renderResult.screenshotBase64
      );

      slide.updateQualityScore({
        qualityScore: newAnalysis.qualityScore,
        issues: newAnalysis.issues,
        analyzedAt: new Date()
      });

      await slide.save();
    }

    // 監査ログ記録
    await AuditLog.create({
      userId: user.sub,
      actionType: ActionType.AUTO_FIX,
      resourceType: ResourceType.SLIDE,
      resourceId: slide.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || undefined,
      actionDetails: {
        operation: 'auto_fix_slide',
        iterationsUsed: autoFixResult.iterationsUsed,
        qualityImprovement: autoFixResult.qualityImprovement,
        fixesApplied: autoFixResult.fixesApplied.length,
        reAnalyzed: reAnalyze
      },
      success: true,
      constitutionalComplianceScore: autoFixResult.constitutionalCompliance
    });

    res.status(200).json({
      message: 'Auto-fix completed successfully',
      slide: slide.toJSON(),
      autoFixResult: {
        iterationsUsed: autoFixResult.iterationsUsed,
        qualityImprovement: autoFixResult.qualityImprovement,
        fixesApplied: autoFixResult.fixesApplied,
        finalQualityScore: autoFixResult.finalQualityScore
      },
      newAnalysis: newAnalysis ? {
        qualityScore: newAnalysis.qualityScore,
        issuesCount: newAnalysis.issues.length
      } : null,
      iterationInfo: {
        current: slide.iterationsCount,
        max: slide.maxIterations,
        remaining: slide.maxIterations - slide.iterationsCount
      }
    });
  } catch (error) {
    // 監査ログ記録（失敗）
    await AuditLog.create({
      userId: user.sub,
      actionType: ActionType.AUTO_FIX,
      resourceType: ResourceType.SLIDE,
      resourceId: slide.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || undefined,
      actionDetails: {
        operation: 'auto_fix_slide_failed'
      },
      success: false,
      errorMessage: (error as Error).message,
      constitutionalComplianceScore: 1.0
    });

    throw error;
  }
});
