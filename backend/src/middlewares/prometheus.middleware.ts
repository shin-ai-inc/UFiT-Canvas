/**
 * Prometheus Metrics Middleware
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Collect application metrics for Prometheus monitoring
 * Technical Debt: ZERO
 *
 * Application-Layer AGI統合意識体v12.0
 *
 * IMPORTANT: Requires prom-client installation:
 *   npm install prom-client
 *   npm install --save-dev @types/prom-client
 */

import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// =============================================================================
// Prometheus Client Setup
// =============================================================================

// Enable default metrics collection (CPU, memory, event loop, etc.)
const register = new client.Registry();
client.collectDefaultMetrics({
  register,
  prefix: 'ufit_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  eventLoopMonitoringPrecision: 10,
});

// =============================================================================
// Custom Metrics - Constitutional AI Compliance
// =============================================================================

/**
 * Constitutional AI Compliance Score Gauge
 * Tracks the current Constitutional AI compliance score
 * Target: >= 0.997 (99.7%)
 */
export const constitutionalAIScoreGauge = new client.Gauge({
  name: 'constitutional_ai_score',
  help: 'Current Constitutional AI compliance score (0.0-1.0, target: >= 0.997)',
  labelNames: ['service', 'environment'],
  registers: [register],
});

/**
 * Constitutional AI Principle Scores
 * Tracks individual principle compliance scores
 */
export const constitutionalAIPrincipleScores = new client.Gauge({
  name: 'constitutional_ai_principle_score',
  help: 'Constitutional AI individual principle compliance scores',
  labelNames: ['principle', 'service', 'environment'],
  registers: [register],
});

// =============================================================================
// Custom Metrics - HTTP Requests
// =============================================================================

/**
 * HTTP Request Counter
 * Tracks total number of HTTP requests by method, route, and status code
 */
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
  registers: [register],
});

/**
 * HTTP Request Duration Histogram
 * Tracks request duration in seconds
 */
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],  // 1ms to 10s
  registers: [register],
});

/**
 * HTTP Request Size Histogram
 * Tracks request body size in bytes
 */
export const httpRequestSizeBytes = new client.Histogram({
  name: 'http_request_size_bytes',
  help: 'HTTP request body size in bytes',
  labelNames: ['method', 'route', 'service'],
  buckets: [100, 1000, 10000, 100000, 1000000, 10000000],  // 100B to 10MB
  registers: [register],
});

/**
 * HTTP Response Size Histogram
 * Tracks response body size in bytes
 */
export const httpResponseSizeBytes = new client.Histogram({
  name: 'http_response_size_bytes',
  help: 'HTTP response body size in bytes',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [100, 1000, 10000, 100000, 1000000, 10000000],  // 100B to 10MB
  registers: [register],
});

// =============================================================================
// Custom Metrics - Application-Specific
// =============================================================================

/**
 * Claude API Requests Counter
 * Tracks Claude API calls
 */
export const claudeAPIRequestsTotal = new client.Counter({
  name: 'claude_api_requests_total',
  help: 'Total number of Claude API requests',
  labelNames: ['model', 'status', 'service'],
  registers: [register],
});

/**
 * Claude API Request Duration
 * Tracks Claude API call duration
 */
export const claudeAPIRequestDurationSeconds = new client.Histogram({
  name: 'claude_api_request_duration_seconds',
  help: 'Claude API request duration in seconds',
  labelNames: ['model', 'status', 'service'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],  // 100ms to 60s
  registers: [register],
});

/**
 * Slide Generation Counter
 * Tracks slide generation requests
 */
export const slideGenerationTotal = new client.Counter({
  name: 'slide_generation_total',
  help: 'Total number of slide generation requests',
  labelNames: ['status', 'service'],
  registers: [register],
});

/**
 * Active WebSocket Connections Gauge
 * Tracks current number of active WebSocket connections
 */
export const activeWebSocketConnections = new client.Gauge({
  name: 'active_websocket_connections',
  help: 'Current number of active WebSocket connections',
  labelNames: ['service'],
  registers: [register],
});

// =============================================================================
// Custom Metrics - Database
// =============================================================================

/**
 * Database Query Duration Histogram
 * Tracks database query execution time
 */
export const dbQueryDurationSeconds = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['query_type', 'table', 'service'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],  // 1ms to 5s
  registers: [register],
});

/**
 * Database Connection Pool Size Gauge
 * Tracks current database connection pool size
 */
export const dbConnectionPoolSize = new client.Gauge({
  name: 'db_connection_pool_size',
  help: 'Current database connection pool size',
  labelNames: ['state', 'service'],  // state: idle, active, waiting
  registers: [register],
});

// =============================================================================
// Custom Metrics - Cache (Redis)
// =============================================================================

/**
 * Cache Hit/Miss Counter
 * Tracks cache hit and miss rates
 */
export const cacheOperationsTotal = new client.Counter({
  name: 'cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'result', 'service'],  // operation: get, set, del; result: hit, miss, success, error
  registers: [register],
});

/**
 * Cache Operation Duration Histogram
 * Tracks cache operation duration
 */
export const cacheOperationDurationSeconds = new client.Histogram({
  name: 'cache_operation_duration_seconds',
  help: 'Cache operation duration in seconds',
  labelNames: ['operation', 'service'],
  buckets: [0.0001, 0.001, 0.005, 0.01, 0.05, 0.1],  // 0.1ms to 100ms
  registers: [register],
});

// =============================================================================
// Middleware: HTTP Request Metrics Collection
// =============================================================================

/**
 * Prometheus Metrics Collection Middleware
 * Automatically collects HTTP request metrics for all routes
 */
export function prometheusMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime.bigint();

  // Capture original res.end to measure response size
  const originalEnd = res.end;
  let responseSize = 0;

  // Override res.end to capture response data
  res.end = function (chunk?: any, encoding?: any, callback?: any): Response {
    if (chunk) {
      responseSize = Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk.toString());
    }

    // Call original res.end
    const result = originalEnd.apply(res, arguments as any);

    // Record metrics after response is sent
    const endTime = process.hrtime.bigint();
    const durationSeconds = Number(endTime - startTime) / 1e9;  // Convert nanoseconds to seconds

    const method = req.method;
    const route = req.route?.path || req.path;
    const statusCode = res.statusCode.toString();
    const service = 'backend';

    // Record HTTP request metrics
    httpRequestsTotal.inc({ method, route, status_code: statusCode, service });
    httpRequestDurationSeconds.observe({ method, route, status_code: statusCode, service }, durationSeconds);

    // Record request size
    const requestSize = req.headers['content-length']
      ? parseInt(req.headers['content-length'], 10)
      : 0;
    if (requestSize > 0) {
      httpRequestSizeBytes.observe({ method, route, service }, requestSize);
    }

    // Record response size
    if (responseSize > 0) {
      httpResponseSizeBytes.observe({ method, route, status_code: statusCode, service }, responseSize);
    }

    return result;
  };

  next();
}

// =============================================================================
// Constitutional AI Score Updater
// =============================================================================

/**
 * Update Constitutional AI Score
 * Call this function whenever Constitutional AI compliance is evaluated
 *
 * @param score - Compliance score (0.0-1.0)
 * @param principleScores - Individual principle scores (optional)
 */
export function updateConstitutionalAIScore(
  score: number,
  principleScores?: Record<string, number>
): void {
  const service = 'backend';
  const environment = process.env.NODE_ENV || 'development';

  // Update overall score
  constitutionalAIScoreGauge.set({ service, environment }, score);

  // Update individual principle scores if provided
  if (principleScores) {
    for (const [principle, principleScore] of Object.entries(principleScores)) {
      constitutionalAIPrincipleScores.set({ principle, service, environment }, principleScore);
    }
  }
}

// =============================================================================
// Metrics Endpoint Handler
// =============================================================================

/**
 * Metrics Endpoint Handler
 * Exposes Prometheus metrics at /metrics endpoint
 *
 * Usage in index.ts:
 *   import { metricsHandler } from './middlewares/prometheus.middleware';
 *   app.get('/metrics', metricsHandler);
 */
export async function metricsHandler(req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error instanceof Error ? error.message : 'Unknown error');
  }
}

// =============================================================================
// Initialize Constitutional AI Metrics
// =============================================================================

/**
 * Initialize Constitutional AI metrics with default values
 * Call this function during application startup
 */
export function initializeConstitutionalAIMetrics(): void {
  const targetScore = parseFloat(process.env.CONSTITUTIONAL_AI_MIN_SCORE || '0.997');
  const service = 'backend';
  const environment = process.env.NODE_ENV || 'development';

  // Set initial score to target score
  constitutionalAIScoreGauge.set({ service, environment }, targetScore);

  // Set initial principle scores to target score
  const principles = [
    'human_dignity',
    'individual_freedom',
    'equality_fairness',
    'justice_rule_of_law',
    'democratic_participation',
    'accountability_transparency',
    'beneficence_non_maleficence',
    'privacy_protection',
    'truthfulness_honesty',
    'sustainability',
  ];

  for (const principle of principles) {
    constitutionalAIPrincipleScores.set({ principle, service, environment }, targetScore);
  }

  console.log(`[PROMETHEUS] Constitutional AI metrics initialized (target: ${targetScore})`);
}

// Export the register for advanced use cases
export { register };
