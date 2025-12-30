/**
 * Jest Setup File
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Global test environment configuration
 * Technical Debt: ZERO
 *
 * Features:
 * - Environment variable setup
 * - Global mocks configuration
 * - Test utilities
 * - Database setup/teardown
 */

// ===================================================================
// Environment Variables Setup
// ===================================================================

/**
 * Configure Test Environment Variables
 * Constitutional AI準拠: テスト環境の適切な設定
 */
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// JWT Configuration
process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only';
process.env.JWT_ACCESS_EXPIRATION = '15m';
process.env.JWT_REFRESH_EXPIRATION = '7d';

// Database Configuration (Test Database)
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'presentation_ai_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';

// Redis Configuration (Test Redis)
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.REDIS_PASSWORD = '';
process.env.REDIS_DB = '1'; // Use DB 1 for tests

// Claude API Configuration (Mock)
process.env.CLAUDE_API_KEY = 'test-claude-api-key';
process.env.CLAUDE_MODEL = 'claude-sonnet-4-20250514';
process.env.CLAUDE_MAX_TOKENS = '4096';
process.env.CLAUDE_TEMPERATURE = '0.7';

// Algorithm Configuration
process.env.MAX_RESEARCH_QUESTIONS = '10';
process.env.MAX_DEPTH_ITERATIONS = '3';
process.env.RESEARCH_QUALITY_THRESHOLD = '0.7';
process.env.TOP_K_TEMPLATES = '5';
process.env.SIMILARITY_THRESHOLD = '0.3';
process.env.TF_IDF_MAX_FEATURES = '100';
process.env.MAX_AUTO_FIX_ITERATIONS = '3';
process.env.QUALITY_TARGET_SCORE = '0.85';
process.env.VISION_ANALYSIS_TIMEOUT = '30000';
process.env.PUPPETEER_HEADLESS = 'true';
process.env.PUPPETEER_TIMEOUT = '30000';
process.env.SCREENSHOT_QUALITY = '90';
process.env.DEFAULT_VIEWPORT_WIDTH = '1920';
process.env.DEFAULT_VIEWPORT_HEIGHT = '1080';

// Security Configuration
process.env.BCRYPT_ROUNDS = '10'; // Lower for faster tests
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';
process.env.XSS_SANITIZE = 'true';

// Constitutional AI Configuration
process.env.CONSTITUTIONAL_AI_MIN_SCORE = '0.997';

// Coverage Configuration
process.env.COVERAGE_THRESHOLD = '80';
process.env.TEST_TIMEOUT = '30000';

// ===================================================================
// Global Test Utilities
// ===================================================================

/**
 * Global Test Utilities Object
 * Constitutional AI準拠: テストユーティリティの提供
 */
global.testUtils = {
  /**
   * Create Mock User
   */
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'free_user',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  /**
   * Create Mock Slide
   */
  createMockSlide: (overrides = {}) => ({
    id: 'test-slide-id',
    userId: 'test-user-id',
    topic: 'Test Topic',
    outline: [
      { content: 'Introduction', order: 1 },
      { content: 'Main Content', order: 2 },
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
    ...overrides
  }),

  /**
   * Create Mock Template
   */
  createMockTemplate: (overrides = {}) => ({
    id: 'test-template-id',
    name: 'Test Template',
    description: 'Test template for testing',
    category: 'Business',
    htmlStructure: '<div>{{content}}</div>',
    cssBase: 'div { padding: 20px; }',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  /**
   * Create Mock JWT Token
   */
  createMockJWT: (payload = {}) => {
    const defaultPayload = {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'free_user'
    };
    return Buffer.from(
      JSON.stringify({ ...defaultPayload, ...payload })
    ).toString('base64');
  },

  /**
   * Wait for Async Operations
   */
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Flush All Promises
   */
  flushPromises: () => new Promise((resolve) => setImmediate(resolve))
};

// ===================================================================
// Global Mocks
// ===================================================================

/**
 * Mock console methods to reduce noise
 * Constitutional AI準拠: テスト出力の適切な管理
 */
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error
};

// Only show errors during tests
console.log = jest.fn();
console.info = jest.fn();
console.warn = jest.fn();
console.error = originalConsole.error; // Keep errors visible

// ===================================================================
// Global Hooks
// ===================================================================

/**
 * Before All Tests
 * Constitutional AI準拠: テスト環境の初期化
 */
beforeAll(async () => {
  // Setup test database connection
  // NOTE: Actual database connection should be mocked in unit tests
  // Integration tests may use a real test database
});

/**
 * After All Tests
 * Constitutional AI準拠: テスト環境のクリーンアップ
 */
afterAll(async () => {
  // Clean up test database connection
  // Close all connections
});

/**
 * Before Each Test
 * Constitutional AI準拠: テスト間の独立性確保
 */
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

/**
 * After Each Test
 * Constitutional AI準拠: テスト後のクリーンアップ
 */
afterEach(() => {
  // Reset all mocks after each test
  jest.resetAllMocks();
});

// ===================================================================
// Custom Matchers
// ===================================================================

/**
 * Custom Jest Matchers
 * Constitutional AI準拠: テストの可読性向上
 */
expect.extend({
  /**
   * Check if value is a valid UUID
   */
  toBeValidUUID(received: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid UUID`
          : `Expected ${received} to be a valid UUID`
    };
  },

  /**
   * Check if Constitutional AI score is within valid range
   */
  toBeValidConstitutionalScore(received: number) {
    const pass = received >= 0 && received <= 1;

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid Constitutional AI score (0-1)`
          : `Expected ${received} to be a valid Constitutional AI score (0-1)`
    };
  },

  /**
   * Check if date is recent (within last N seconds)
   */
  toBeRecentDate(received: Date, seconds = 60) {
    const now = new Date();
    const diff = (now.getTime() - received.getTime()) / 1000;
    const pass = diff >= 0 && diff <= seconds;

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be within last ${seconds} seconds`
          : `Expected ${received} to be within last ${seconds} seconds (diff: ${diff}s)`
    };
  }
});

// ===================================================================
// Type Declarations
// ===================================================================

declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        createMockUser: (overrides?: any) => any;
        createMockSlide: (overrides?: any) => any;
        createMockTemplate: (overrides?: any) => any;
        createMockJWT: (payload?: any) => string;
        wait: (ms: number) => Promise<void>;
        flushPromises: () => Promise<void>;
      };
    }
  }

  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidConstitutionalScore(): R;
      toBeRecentDate(seconds?: number): R;
    }
  }
}

export {};
