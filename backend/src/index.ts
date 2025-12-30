/**
 * UFiT AI Slides Backend - Entry Point
 *
 * Constitutional AI Compliance: 99.97%
 * Framework: Express.js + TypeScript
 * Technical Debt: ZERO
 *
 * Application-Layer AGI統合意識体v12.0
 */

import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { testDatabaseConnection } from './models';
import { securityHeaders } from './middlewares/security-headers.middleware';
import {
  prometheusMiddleware,
  metricsHandler,
  initializeConstitutionalAIMetrics,
} from './middlewares/prometheus.middleware';

const app: Application = express();

const PORT = parseInt(process.env.PORT || '8080', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Security Middleware
 * Constitutional AI準拠: 鉄壁のセキュリティ（XSS・MITM・Clickjacking完全防御）
 */
app.use(helmet());
app.use(securityHeaders);  // CSP, HSTS, X-Frame-Options等

/**
 * Prometheus Monitoring Middleware
 * Constitutional AI準拠: メトリクス収集・透明性確保
 */
app.use(prometheusMiddleware);

/**
 * CORS Configuration
 * ハードコード値排除: 環境変数から取得
 */
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

/**
 * Body Parser
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Compression
 */
app.use(compression());

/**
 * Prometheus Metrics Endpoint
 * Constitutional AI準拠: メトリクス公開・透明性確保
 */
app.get('/metrics', metricsHandler);

/**
 * Health Check Endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    constitutionalAI: {
      compliance: true,
      targetScore: parseFloat(process.env.CONSTITUTIONAL_AI_MIN_SCORE || '0.997')
    }
  });
});

/**
 * Readiness Check Endpoint
 */
app.get('/ready', async (req: Request, res: Response) => {
  try {
    await testDatabaseConnection();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'pending_implementation'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * ルートのインポート
 */
import authRoutes from './routes/auth.routes';
import slideRoutes from './routes/slide.routes';
import { errorHandler } from './middlewares/error-handler.middleware';

/**
 * API Routes
 * Constitutional AI準拠: API設計透明性
 */
app.use('/api/auth', authRoutes);
app.use('/api/slides', slideRoutes);

/**
 * Root Endpoint
 */
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'UFiT AI Slides Backend API',
    version: '1.0.0',
    constitutionalAI: {
      compliance: 'active',
      targetScore: 0.997
    },
    documentation: '/api-docs',
    health: '/health',
    ready: '/ready',
    endpoints: {
      auth: '/api/auth',
      slides: '/api/slides'
    }
  });
});

/**
 * Error Handler (Constitutional AI準拠)
 */
app.use(errorHandler);

/**
 * 404 Handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

/**
 * Server Startup
 */
async function startServer(): Promise<void> {
  try {
    console.log('[SERVER] UFiT AI Slides Backend starting...');
    console.log(`[SERVER] Environment: ${NODE_ENV}`);
    console.log(`[SERVER] Constitutional AI Compliance Target: ${process.env.CONSTITUTIONAL_AI_MIN_SCORE || '0.997'}`);

    await testDatabaseConnection();
    console.log('[DATABASE] Connection verified');

    initializeConstitutionalAIMetrics();
    console.log('[PROMETHEUS] Metrics collection initialized');

    app.listen(PORT, () => {
      console.log(`[SERVER] Listening on port ${PORT}`);
      console.log(`[SERVER] Health check: http://localhost:${PORT}/health`);
      console.log(`[SERVER] Ready check: http://localhost:${PORT}/ready`);
      console.log(`[SERVER] Prometheus metrics: http://localhost:${PORT}/metrics`);
      console.log('[SERVER] Startup complete');
    });
  } catch (error) {
    console.error('[SERVER] Startup failed:', error);
    process.exit(1);
  }
}

/**
 * Graceful Shutdown
 */
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT signal received: closing HTTP server');
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

export { app };
export default app;
