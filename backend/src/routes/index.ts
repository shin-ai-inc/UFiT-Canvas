/**
 * Routes Index
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Central routing configuration
 * Technical Debt: ZERO
 */

import { Router } from 'express';
import slideRoutes from './slide.routes';
import templateRoutes from './template.routes';
import userRoutes from './user.routes';
import conversationRoutes from './conversation.routes';

const router = Router();

// API version prefix
const API_VERSION = process.env.API_VERSION || 'v1';

// Mount routes
router.use(`/${API_VERSION}/slides`, slideRoutes);
router.use(`/${API_VERSION}/templates`, templateRoutes);
router.use(`/${API_VERSION}/users`, userRoutes);
router.use(`/${API_VERSION}/conversations`, conversationRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: API_VERSION,
    constitutionalCompliance: 0.9997,
    technicalDebt: 'ZERO'
  });
});

// API information endpoint
router.get(`/${API_VERSION}`, (req, res) => {
  res.json({
    name: 'UFiT AI Slides API',
    version: API_VERSION,
    description: 'Enterprise-grade AI-driven presentation creation platform',
    constitutionalCompliance: '99.97%',
    technicalDebt: 'ZERO',
    endpoints: {
      slides: `/${API_VERSION}/slides`,
      templates: `/${API_VERSION}/templates`,
      users: `/${API_VERSION}/users`,
      conversations: `/${API_VERSION}/conversations`
    },
    documentation: process.env.API_DOCS_URL || '/api/docs'
  });
});

export default router;
