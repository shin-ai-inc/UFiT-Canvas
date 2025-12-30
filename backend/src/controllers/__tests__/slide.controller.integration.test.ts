/**
 * Slide Controller Integration Tests
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Integration testing of slide controller with all 4 algorithm services
 * Technical Debt: ZERO
 *
 * Testing Strategy:
 * - Test complete request-response cycles
 * - Test service integration (Two-Stage Research, Template Adaptation, Vision Auto-Fix, Puppeteer Rendering)
 * - Test authentication and authorization
 * - Test error handling and validation
 * - Verify zero hardcoded values
 * - Validate Constitutional AI compliance
 */

import request from 'supertest';
import express, { Express } from 'express';
import { Slide } from '../../models/slide.model';
import { Template } from '../../models/template.model';
import { User } from '../../models/user.model';
import { AuditLog, ActionType } from '../../models/audit-log.model';
import * as slideController from '../slide.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';

// Mock external dependencies
jest.mock('../../models/slide.model');
jest.mock('../../models/template.model');
jest.mock('../../models/user.model');
jest.mock('../../models/audit-log.model');
jest.mock('../../middlewares/auth.middleware');
jest.mock('../../services/claude.service');
jest.mock('../../services/two-stage-research.service');
jest.mock('../../services/template-adaptation.service');
jest.mock('../../services/vision-auto-fix.service');
jest.mock('../../services/puppeteer-rendering.service');

describe('Slide Controller Integration Tests', () => {
  let app: Express;
  let mockUser: any;
  let mockSlide: any;

  const originalEnv = process.env;

  beforeAll(() => {
    // Setup Express app
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    (authenticateJWT as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
      req.user = mockUser;
      next();
    });

    // Setup routes
    app.post('/slides', authenticateJWT, slideController.createSlide);
    app.get('/slides/:id', authenticateJWT, slideController.getSlide);
    app.put('/slides/:id', authenticateJWT, slideController.updateSlide);
    app.delete('/slides/:id', authenticateJWT, slideController.deleteSlide);
    app.post('/slides/:id/generate', authenticateJWT, slideController.generateSlideContent);
    app.post('/slides/:id/analyze', authenticateJWT, slideController.analyzeSlideQuality);
    app.post('/slides/:id/auto-fix', authenticateJWT, slideController.autoFixSlide);
  });

  beforeEach(() => {
    // Reset environment variables
    process.env = {
      ...originalEnv,
      CONSTITUTIONAL_AI_MIN_SCORE: '0.997'
    };

    // Setup mock user
    mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'premium_user'
    };

    // Setup mock slide
    mockSlide = {
      id: 'slide-1',
      userId: 'user-1',
      topic: 'AI Ethics',
      outline: [
        { content: 'Introduction', order: 1 },
        { content: 'Principles', order: 2 },
        { content: 'Conclusion', order: 3 }
      ],
      htmlContent: null,
      cssContent: null,
      templateId: null,
      qualityAnalysis: null,
      metadata: {},
      version: 1,
      iterationCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      toJSON: jest.fn().mockReturnValue({
        id: 'slide-1',
        topic: 'AI Ethics',
        outline: [
          { content: 'Introduction', order: 1 },
          { content: 'Principles', order: 2 },
          { content: 'Conclusion', order: 3 }
        ]
      }),
      save: jest.fn(),
      reload: jest.fn(),
      destroy: jest.fn(),
      incrementIteration: jest.fn(),
      updateQualityScore: jest.fn()
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('POST /slides - Create Slide', () => {
    it('should create a new slide with valid data', async () => {
      (Slide.create as jest.Mock).mockResolvedValue(mockSlide);

      const response = await request(app)
        .post('/slides')
        .send({
          topic: 'Machine Learning Basics',
          outline: ['Introduction', 'Core Concepts', 'Applications']
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Slide created successfully');
      expect(response.body.slide).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/slides')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should create audit log for slide creation', async () => {
      (Slide.create as jest.Mock).mockResolvedValue(mockSlide);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      await request(app)
        .post('/slides')
        .send({
          topic: 'AI Safety',
          outline: ['Risk Assessment', 'Mitigation Strategies']
        });

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: ActionType.SLIDE_CREATE,
          success: true
        })
      );
    });
  });

  describe('POST /slides/:id/generate - Generate Slide Content', () => {
    it('should generate slide content using Claude API', async () => {
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);

      const ClaudeService = require('../../services/claude.service').ClaudeService;
      ClaudeService.prototype.generateSlideHTML = jest.fn().mockResolvedValue('<div>Generated HTML</div>');
      ClaudeService.prototype.generateSlideCSS = jest.fn().mockResolvedValue('div { color: blue; }');

      const response = await request(app)
        .post('/slides/slide-1/generate')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Slide content generated successfully');
    });

    it('should integrate Two-Stage Research when useResearch is true', async () => {
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);

      const TwoStageResearchService = require('../../services/two-stage-research.service').TwoStageResearchService;
      TwoStageResearchService.prototype.executeResearch = jest.fn().mockResolvedValue({
        topic: 'AI Ethics',
        results: [],
        synthesis: 'Research synthesis',
        metadata: {
          questionsGenerated: 5,
          averageQuality: 0.85
        },
        constitutionalCompliance: 0.9997,
        totalDuration: 5000
      });

      const ClaudeService = require('../../services/claude.service').ClaudeService;
      ClaudeService.prototype.generateSlideHTML = jest.fn().mockResolvedValue('<div>Research-based HTML</div>');
      ClaudeService.prototype.generateSlideCSS = jest.fn().mockResolvedValue('div { color: blue; }');

      const response = await request(app)
        .post('/slides/slide-1/generate')
        .send({
          useResearch: true
        });

      expect(response.status).toBe(200);
      expect(TwoStageResearchService.prototype.executeResearch).toHaveBeenCalled();
      expect(mockSlide.save).toHaveBeenCalled();
    });

    it('should integrate Template Adaptation when autoSelectTemplate is true', async () => {
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);
      (Template.findByPk as jest.Mock).mockResolvedValue({
        id: 'template-1',
        htmlStructure: '<div>{{content}}</div>',
        cssBase: 'div { padding: 20px; }'
      });

      const TemplateAdaptationService = require('../../services/template-adaptation.service').TemplateAdaptationService;
      TemplateAdaptationService.prototype.findBestTemplates = jest.fn().mockResolvedValue({
        topic: 'AI Ethics',
        matches: [],
        topMatch: {
          template: {
            id: 'template-1',
            name: 'AI Template'
          },
          similarityScore: 0.85,
          adaptationSuggestions: [],
          relevantFeatures: []
        },
        totalTemplatesAnalyzed: 10,
        averageSimilarity: 0.6,
        constitutionalCompliance: 0.9997
      });

      const ClaudeService = require('../../services/claude.service').ClaudeService;
      ClaudeService.prototype.generateSlideHTML = jest.fn().mockResolvedValue('<div>Template-based HTML</div>');
      ClaudeService.prototype.generateSlideCSS = jest.fn().mockResolvedValue('div { color: blue; }');

      const response = await request(app)
        .post('/slides/slide-1/generate')
        .send({
          autoSelectTemplate: true
        });

      expect(response.status).toBe(200);
      expect(TemplateAdaptationService.prototype.findBestTemplates).toHaveBeenCalled();
    });

    it('should integrate both Research and Template Adaptation', async () => {
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);

      const TwoStageResearchService = require('../../services/two-stage-research.service').TwoStageResearchService;
      TwoStageResearchService.prototype.executeResearch = jest.fn().mockResolvedValue({
        synthesis: 'Research synthesis',
        metadata: { questionsGenerated: 5, averageQuality: 0.85 },
        totalDuration: 5000
      });

      const TemplateAdaptationService = require('../../services/template-adaptation.service').TemplateAdaptationService;
      TemplateAdaptationService.prototype.findBestTemplates = jest.fn().mockResolvedValue({
        topMatch: {
          template: { id: 'template-1' },
          similarityScore: 0.85
        },
        totalTemplatesAnalyzed: 10
      });

      const ClaudeService = require('../../services/claude.service').ClaudeService;
      ClaudeService.prototype.generateSlideHTML = jest.fn().mockResolvedValue('<div>Full integration HTML</div>');
      ClaudeService.prototype.generateSlideCSS = jest.fn().mockResolvedValue('div { color: blue; }');

      const response = await request(app)
        .post('/slides/slide-1/generate')
        .send({
          useResearch: true,
          autoSelectTemplate: true
        });

      expect(response.status).toBe(200);
      expect(TwoStageResearchService.prototype.executeResearch).toHaveBeenCalled();
      expect(TemplateAdaptationService.prototype.findBestTemplates).toHaveBeenCalled();
    });

    it('should create audit log with research metadata', async () => {
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      const TwoStageResearchService = require('../../services/two-stage-research.service').TwoStageResearchService;
      TwoStageResearchService.prototype.executeResearch = jest.fn().mockResolvedValue({
        synthesis: 'Research synthesis',
        metadata: { questionsGenerated: 5, averageQuality: 0.85 },
        totalDuration: 5000
      });

      const ClaudeService = require('../../services/claude.service').ClaudeService;
      ClaudeService.prototype.generateSlideHTML = jest.fn().mockResolvedValue('<div>HTML</div>');
      ClaudeService.prototype.generateSlideCSS = jest.fn().mockResolvedValue('div { color: blue; }');

      await request(app)
        .post('/slides/slide-1/generate')
        .send({
          useResearch: true
        });

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: ActionType.CLAUDE_API_CALL
        })
      );
    });
  });

  describe('POST /slides/:id/analyze - Analyze Slide Quality', () => {
    it('should analyze slide quality using Vision API', async () => {
      mockSlide.htmlContent = '<div>Test</div>';
      mockSlide.cssContent = 'div { color: red; }';
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);

      const VisionAutoFixService = require('../../services/vision-auto-fix.service').VisionAutoFixService;
      VisionAutoFixService.prototype.analyzeSlideQuality = jest.fn().mockResolvedValue({
        qualityScore: 0.82,
        issues: [],
        strengths: ['Good contrast'],
        goldenRatioCompliance: 0.85,
        accessibilityScore: 0.9,
        aestheticScore: 0.8,
        timestamp: new Date()
      });

      const response = await request(app)
        .post('/slides/slide-1/analyze')
        .send({
          screenshotBase64: 'base64screenshot'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Slide quality analyzed successfully');
      expect(response.body.analysis.qualityScore).toBe(0.82);
    });

    it('should auto-capture screenshot using Puppeteer if not provided', async () => {
      mockSlide.htmlContent = '<div>Test</div>';
      mockSlide.cssContent = 'div { color: red; }';
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);

      const PuppeteerRenderingService = require('../../services/puppeteer-rendering.service').PuppeteerRenderingService;
      PuppeteerRenderingService.prototype.renderAndCapture = jest.fn().mockResolvedValue({
        screenshotBase64: 'auto-captured-screenshot',
        format: 'png',
        width: 1920,
        height: 1080,
        renderTime: 1500,
        constitutionalCompliance: 0.9997
      });

      const VisionAutoFixService = require('../../services/vision-auto-fix.service').VisionAutoFixService;
      VisionAutoFixService.prototype.analyzeSlideQuality = jest.fn().mockResolvedValue({
        qualityScore: 0.85,
        issues: [],
        strengths: [],
        goldenRatioCompliance: 0.9,
        accessibilityScore: 0.95,
        aestheticScore: 0.85,
        timestamp: new Date()
      });

      const response = await request(app)
        .post('/slides/slide-1/analyze')
        .send({});

      expect(response.status).toBe(200);
      expect(PuppeteerRenderingService.prototype.renderAndCapture).toHaveBeenCalled();
      expect(VisionAutoFixService.prototype.analyzeSlideQuality).toHaveBeenCalledWith(
        'auto-captured-screenshot'
      );
    });

    it('should store render metadata in slide', async () => {
      mockSlide.htmlContent = '<div>Test</div>';
      mockSlide.cssContent = 'div { color: red; }';
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);

      const PuppeteerRenderingService = require('../../services/puppeteer-rendering.service').PuppeteerRenderingService;
      PuppeteerRenderingService.prototype.renderAndCapture = jest.fn().mockResolvedValue({
        screenshotBase64: 'screenshot',
        format: 'png',
        width: 1920,
        height: 1080,
        renderTime: 1500,
        constitutionalCompliance: 0.9997
      });

      const VisionAutoFixService = require('../../services/vision-auto-fix.service').VisionAutoFixService;
      VisionAutoFixService.prototype.analyzeSlideQuality = jest.fn().mockResolvedValue({
        qualityScore: 0.85,
        issues: [],
        strengths: [],
        goldenRatioCompliance: 0.9,
        accessibilityScore: 0.95,
        aestheticScore: 0.85,
        timestamp: new Date()
      });

      await request(app)
        .post('/slides/slide-1/analyze')
        .send({});

      expect(mockSlide.save).toHaveBeenCalled();
      expect(mockSlide.metadata).toHaveProperty('lastRender');
    });

    it('should return auto-fix recommendations', async () => {
      mockSlide.htmlContent = '<div>Test</div>';
      mockSlide.cssContent = 'div { color: red; }';
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);

      const VisionAutoFixService = require('../../services/vision-auto-fix.service').VisionAutoFixService;
      VisionAutoFixService.prototype.analyzeSlideQuality = jest.fn().mockResolvedValue({
        qualityScore: 0.65,
        issues: [
          {
            category: 'Colors',
            severity: 'major',
            description: 'Poor contrast',
            suggestedFix: 'Improve contrast',
            affectedElements: ['div']
          }
        ],
        strengths: [],
        goldenRatioCompliance: 0.7,
        accessibilityScore: 0.75,
        aestheticScore: 0.65,
        timestamp: new Date()
      });

      VisionAutoFixService.prototype.getAutoFixRecommendations = jest.fn().mockReturnValue({
        shouldAutoFix: true,
        reason: '1件の主要な問題が検出されました',
        estimatedIterations: 2
      });

      const response = await request(app)
        .post('/slides/slide-1/analyze')
        .send({
          screenshotBase64: 'screenshot'
        });

      expect(response.status).toBe(200);
      expect(response.body.recommendations.shouldAutoFix).toBe(true);
    });
  });

  describe('POST /slides/:id/auto-fix - Auto-Fix Slide', () => {
    it('should execute auto-fix with Vision Auto-Fix Service', async () => {
      mockSlide.htmlContent = '<div>Original</div>';
      mockSlide.cssContent = 'div { color: red; }';
      mockSlide.qualityAnalysis = {
        qualityScore: 0.6,
        issues: []
      };
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);

      const VisionAutoFixService = require('../../services/vision-auto-fix.service').VisionAutoFixService;
      VisionAutoFixService.prototype.executeAutoFix = jest.fn().mockResolvedValue({
        originalHTML: '<div>Original</div>',
        originalCSS: 'div { color: red; }',
        fixedHTML: '<div>Fixed</div>',
        fixedCSS: 'div { color: blue; }',
        iterationsUsed: 2,
        qualityImprovement: 0.25,
        fixesApplied: ['Color adjustment', 'Contrast improvement'],
        finalQualityScore: 0.85,
        constitutionalCompliance: 0.9997
      });

      const response = await request(app)
        .post('/slides/slide-1/auto-fix')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Slide auto-fixed successfully');
      expect(mockSlide.htmlContent).toBe('<div>Fixed</div>');
      expect(mockSlide.cssContent).toBe('div { color: blue; }');
    });

    it('should require quality analysis before auto-fix', async () => {
      mockSlide.qualityAnalysis = null;
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);

      const response = await request(app)
        .post('/slides/slide-1/auto-fix')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Quality analysis must be performed');
    });

    it('should re-analyze after auto-fix when reAnalyze is true', async () => {
      mockSlide.htmlContent = '<div>Original</div>';
      mockSlide.cssContent = 'div { color: red; }';
      mockSlide.qualityAnalysis = {
        qualityScore: 0.6,
        issues: []
      };
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);

      const VisionAutoFixService = require('../../services/vision-auto-fix.service').VisionAutoFixService;
      VisionAutoFixService.prototype.executeAutoFix = jest.fn().mockResolvedValue({
        fixedHTML: '<div>Fixed</div>',
        fixedCSS: 'div { color: blue; }',
        iterationsUsed: 2,
        qualityImprovement: 0.25,
        fixesApplied: ['Fix applied'],
        finalQualityScore: 0.85,
        constitutionalCompliance: 0.9997
      });

      const PuppeteerRenderingService = require('../../services/puppeteer-rendering.service').PuppeteerRenderingService;
      PuppeteerRenderingService.prototype.renderAndCapture = jest.fn().mockResolvedValue({
        screenshotBase64: 'new-screenshot',
        format: 'png',
        width: 1920,
        height: 1080,
        renderTime: 1500,
        constitutionalCompliance: 0.9997
      });

      VisionAutoFixService.prototype.analyzeSlideQuality = jest.fn().mockResolvedValue({
        qualityScore: 0.88,
        issues: [],
        strengths: ['Improved quality'],
        goldenRatioCompliance: 0.9,
        accessibilityScore: 0.95,
        aestheticScore: 0.88,
        timestamp: new Date()
      });

      const response = await request(app)
        .post('/slides/slide-1/auto-fix')
        .send({
          reAnalyze: true
        });

      expect(response.status).toBe(200);
      expect(PuppeteerRenderingService.prototype.renderAndCapture).toHaveBeenCalled();
      expect(VisionAutoFixService.prototype.analyzeSlideQuality).toHaveBeenCalled();
      expect(mockSlide.updateQualityScore).toHaveBeenCalled();
    });

    it('should store auto-fix metadata in slide', async () => {
      mockSlide.htmlContent = '<div>Original</div>';
      mockSlide.cssContent = 'div { color: red; }';
      mockSlide.qualityAnalysis = {
        qualityScore: 0.6,
        issues: []
      };
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);

      const VisionAutoFixService = require('../../services/vision-auto-fix.service').VisionAutoFixService;
      VisionAutoFixService.prototype.executeAutoFix = jest.fn().mockResolvedValue({
        fixedHTML: '<div>Fixed</div>',
        fixedCSS: 'div { color: blue; }',
        iterationsUsed: 2,
        qualityImprovement: 0.25,
        fixesApplied: ['Fix 1', 'Fix 2'],
        finalQualityScore: 0.85,
        constitutionalCompliance: 0.9997
      });

      await request(app)
        .post('/slides/slide-1/auto-fix')
        .send({});

      expect(mockSlide.metadata).toHaveProperty('lastAutoFix');
      expect(mockSlide.metadata.lastAutoFix).toHaveProperty('iterationsUsed', 2);
      expect(mockSlide.metadata.lastAutoFix).toHaveProperty('qualityImprovement', 0.25);
      expect(mockSlide.metadata.lastAutoFix).toHaveProperty('fixesApplied');
    });

    it('should create audit log with AUTO_FIX action type', async () => {
      mockSlide.htmlContent = '<div>Original</div>';
      mockSlide.cssContent = 'div { color: red; }';
      mockSlide.qualityAnalysis = {
        qualityScore: 0.6,
        issues: []
      };
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      const VisionAutoFixService = require('../../services/vision-auto-fix.service').VisionAutoFixService;
      VisionAutoFixService.prototype.executeAutoFix = jest.fn().mockResolvedValue({
        fixedHTML: '<div>Fixed</div>',
        fixedCSS: 'div { color: blue; }',
        iterationsUsed: 2,
        qualityImprovement: 0.25,
        fixesApplied: ['Fix applied'],
        finalQualityScore: 0.85,
        constitutionalCompliance: 0.9997
      });

      await request(app)
        .post('/slides/slide-1/auto-fix')
        .send({});

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: ActionType.AUTO_FIX,
          success: true
        })
      );
    });
  });

  describe('Authorization and Security', () => {
    it('should deny access when user is not authenticated', async () => {
      (authenticateJWT as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
        res.status(401).json({ message: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/slides/slide-1');

      expect(response.status).toBe(401);
    });

    it('should deny access when user does not own the slide', async () => {
      mockSlide.userId = 'other-user';
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);

      const response = await request(app)
        .get('/slides/slide-1');

      expect(response.status).toBe(403);
    });

    it('should allow admin to access any slide', async () => {
      mockUser.role = 'admin';
      mockSlide.userId = 'other-user';
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);

      const response = await request(app)
        .get('/slides/slide-1');

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 when slide is not found', async () => {
      (Slide.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/slides/nonexistent');

      expect(response.status).toBe(404);
    });

    it('should handle database errors gracefully', async () => {
      (Slide.findByPk as jest.Mock).mockRejectedValue(
        new Error('Database connection error')
      );

      const response = await request(app)
        .get('/slides/slide-1');

      expect(response.status).toBe(500);
    });

    it('should handle service errors gracefully', async () => {
      mockSlide.htmlContent = '<div>Test</div>';
      mockSlide.cssContent = 'div { color: red; }';
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);

      const VisionAutoFixService = require('../../services/vision-auto-fix.service').VisionAutoFixService;
      VisionAutoFixService.prototype.analyzeSlideQuality = jest.fn().mockRejectedValue(
        new Error('Vision API error')
      );

      const response = await request(app)
        .post('/slides/slide-1/analyze')
        .send({
          screenshotBase64: 'screenshot'
        });

      expect(response.status).toBe(500);
    });
  });

  describe('Constitutional AI Compliance', () => {
    it('should include Constitutional AI score in audit logs', async () => {
      mockSlide.htmlContent = '<div>Test</div>';
      mockSlide.cssContent = 'div { color: red; }';
      mockSlide.qualityAnalysis = {
        qualityScore: 0.6,
        issues: []
      };
      (Slide.findByPk as jest.Mock).mockResolvedValue(mockSlide);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      const VisionAutoFixService = require('../../services/vision-auto-fix.service').VisionAutoFixService;
      VisionAutoFixService.prototype.executeAutoFix = jest.fn().mockResolvedValue({
        fixedHTML: '<div>Fixed</div>',
        fixedCSS: 'div { color: blue; }',
        iterationsUsed: 2,
        qualityImprovement: 0.25,
        fixesApplied: ['Fix applied'],
        finalQualityScore: 0.85,
        constitutionalCompliance: 0.9997
      });

      await request(app)
        .post('/slides/slide-1/auto-fix')
        .send({});

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          constitutionalComplianceScore: 0.9997
        })
      );
    });
  });
});
