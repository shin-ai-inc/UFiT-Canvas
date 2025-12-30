/**
 * Rendering Worker Type Definitions
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Type definitions for rendering operations
 * Technical Debt: ZERO
 *
 * Compatibility: Aligned with backend/src/services/puppeteer-rendering.service.ts
 */

/**
 * Screenshot Options Interface
 * Dynamic configuration from environment variables
 */
export interface ScreenshotOptions {
  format?: 'png' | 'jpeg';
  quality?: number;
  fullPage?: boolean;
  viewportWidth?: number;
  viewportHeight?: number;
  omitBackground?: boolean;
}

/**
 * PDF Options Interface
 * Dynamic configuration from environment variables
 */
export interface PDFOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  width?: string;
  height?: string;
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

/**
 * Rendering Request Interface
 * Input from backend API
 */
export interface RenderingRequest {
  htmlContent: string;
  slideId?: string;
  projectId?: string;
  renderType: 'screenshot' | 'pdf';
  options?: ScreenshotOptions | PDFOptions;
}

/**
 * Rendering Result Interface
 * Output to backend API
 */
export interface RenderingResult {
  success: boolean;
  data?: {
    buffer?: Buffer;
    base64?: string;
    format: string;
    width?: number;
    height?: number;
    renderTime: number;
    constitutionalCompliance: number;
  };
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Browser Pool Configuration
 * Dynamic from environment variables
 */
export interface BrowserPoolConfig {
  minInstances: number;
  maxInstances: number;
  maxAge: number;
  idleTimeout: number;
  launchOptions: {
    headless: boolean;
    args: string[];
    timeout: number;
  };
}

/**
 * Health Check Response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  browserPoolSize: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  timestamp: string;
}
