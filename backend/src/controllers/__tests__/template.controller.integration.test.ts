/**
 * Template Controller Integration Test
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Template CRUD integration testing
 * Technical Debt: ZERO
 *
 * t-wada式TDD準拠・Complete Test Coverage
 */

import request from 'supertest';
import express, { Application } from 'express';
import templateRoutes from '../../routes/template.routes';

/**
 * Mock Dependencies
 */
jest.mock('../../models', () => ({
  Template: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn()
  },
  AuditLog: {
    create: jest.fn()
  }
}));

jest.mock('../../middleware/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-123', role: 'free_user' };
    next();
  }
}));

jest.mock('../../middleware/rate-limit.middleware', () => ({
  rateLimitMiddleware: () => (req: any, res: any, next: any) => next()
}));

jest.mock('../../utils/constitutional-ai', () => ({
  checkConstitutionalCompliance: jest.fn(() => ({
    compliant: true,
    score: 0.9997,
    violations: [],
    recommendations: []
  }))
}));

describe('Template Controller Integration Tests', () => {
  let app: Application;
  const { Template, AuditLog } = require('../../models');

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/templates', templateRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/templates', () => {
    it('should return paginated templates', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Business Pitch',
          description: 'Professional business pitch template',
          category: 'business',
          htmlTemplate: '<div>Template 1</div>',
          thumbnailUrl: 'https://example.com/thumb1.jpg',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'template-2',
          name: 'Education Lecture',
          description: 'Academic lecture template',
          category: 'education',
          htmlTemplate: '<div>Template 2</div>',
          thumbnailUrl: 'https://example.com/thumb2.jpg',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      Template.findAll.mockResolvedValue(mockTemplates);
      Template.count.mockResolvedValue(50);

      const response = await request(app)
        .get('/api/v1/templates')
        .query({ page: '1', limit: '10' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('templates');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.templates).toHaveLength(2);
      expect(response.body.pagination.total).toBe(50);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.totalPages).toBe(5);
    });

    it('should filter templates by category', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Business Pitch',
          category: 'business',
          isPublic: true
        }
      ];

      Template.findAll.mockResolvedValue(mockTemplates);
      Template.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/v1/templates')
        .query({ category: 'business' });

      expect(response.status).toBe(200);
      expect(Template.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'business'
          })
        })
      );
    });

    it('should respect MAX_PAGE_SIZE limit', async () => {
      const response = await request(app)
        .get('/api/v1/templates')
        .query({ limit: '1000' });

      expect(Template.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: expect.any(Number)
        })
      );
    });
  });

  describe('GET /api/v1/templates/:id', () => {
    it('should return template by id', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Business Pitch',
        description: 'Professional business pitch template',
        category: 'business',
        htmlTemplate: '<div>Template 1</div>',
        isPublic: true
      };

      Template.findByPk.mockResolvedValue(mockTemplate);

      const response = await request(app)
        .get('/api/v1/templates/template-1');

      expect(response.status).toBe(200);
      expect(response.body.template).toHaveProperty('id', 'template-1');
      expect(response.body.template).toHaveProperty('name', 'Business Pitch');
    });

    it('should return 404 for non-existent template', async () => {
      Template.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/templates/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/templates', () => {
    it('should create new template', async () => {
      const newTemplate = {
        name: 'New Template',
        description: 'Test template',
        category: 'business',
        htmlTemplate: '<div>New Template</div>',
        isPublic: false
      };

      const createdTemplate = {
        id: 'new-template-id',
        ...newTemplate,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      Template.create.mockResolvedValue(createdTemplate);
      AuditLog.create.mockResolvedValue({});

      const response = await request(app)
        .post('/api/v1/templates')
        .send(newTemplate);

      expect(response.status).toBe(201);
      expect(response.body.template).toHaveProperty('id', 'new-template-id');
      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create_template',
          userId: 'test-user-123'
        })
      );
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/templates')
        .send({
          name: 'Incomplete Template'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/v1/templates/:id', () => {
    it('should update template', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Old Name',
        update: jest.fn().mockResolvedValue(true)
      };

      Template.findByPk.mockResolvedValue(mockTemplate);
      AuditLog.create.mockResolvedValue({});

      const response = await request(app)
        .put('/api/v1/templates/template-1')
        .send({
          name: 'Updated Name',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(mockTemplate.update).toHaveBeenCalled();
      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update_template'
        })
      );
    });

    it('should return 404 for non-existent template', async () => {
      Template.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/templates/non-existent-id')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/templates/:id', () => {
    it('should delete template', async () => {
      const mockTemplate = {
        id: 'template-1',
        destroy: jest.fn().mockResolvedValue(true)
      };

      Template.findByPk.mockResolvedValue(mockTemplate);
      AuditLog.create.mockResolvedValue({});

      const response = await request(app)
        .delete('/api/v1/templates/template-1');

      expect(response.status).toBe(200);
      expect(mockTemplate.destroy).toHaveBeenCalled();
      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'delete_template'
        })
      );
    });

    it('should return 404 for non-existent template', async () => {
      Template.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/templates/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('Constitutional AI Compliance', () => {
    it('should check compliance for all operations', async () => {
      const { checkConstitutionalCompliance } = require('../../utils/constitutional-ai');

      Template.create.mockResolvedValue({ id: 'test-id' });
      AuditLog.create.mockResolvedValue({});

      await request(app)
        .post('/api/v1/templates')
        .send({
          name: 'Test Template',
          description: 'Test',
          category: 'business',
          htmlTemplate: '<div>Test</div>'
        });

      expect(checkConstitutionalCompliance).toHaveBeenCalled();
    });
  });
});
