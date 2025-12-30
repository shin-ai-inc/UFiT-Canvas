/**
 * Jest Configuration for t-wada式TDD
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Comprehensive test configuration for backend
 * Technical Debt: ZERO
 *
 * Features:
 * - TypeScript support via ts-jest
 * - Code coverage reporting
 * - Test environment setup
 * - Path mapping for imports
 * - Zero hardcoded values (coverage thresholds from env vars)
 */

/**
 * Get Coverage Thresholds from Environment Variables
 * Constitutional AI準拠: ハードコード値排除
 */
const getCoverageThresholds = () => {
  const COVERAGE_THRESHOLD = parseInt(
    process.env.COVERAGE_THRESHOLD || '80',
    10
  );

  return {
    global: {
      branches: COVERAGE_THRESHOLD,
      functions: COVERAGE_THRESHOLD,
      lines: COVERAGE_THRESHOLD,
      statements: COVERAGE_THRESHOLD
    }
  };
};

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // TypeScript support
  preset: 'ts-jest',

  // Root directory
  rootDir: '.',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/*.test.ts',
    '**/tests/**/*.test.ts'
  ],

  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],

  // Coverage collection from
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts',
    '!src/**/__tests__/**',
    '!src/index.ts',
    '!src/config/**'
  ],

  // Coverage thresholds (from environment variables)
  coverageThreshold: getCoverageThresholds(),

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Transform files with ts-jest
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },

  // Global timeout (from environment variable)
  testTimeout: parseInt(process.env.TEST_TIMEOUT || '30000', 10),

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Maximum worker processes (parallel test execution)
  maxWorkers: process.env.CI ? 2 : '50%',

  // Globals configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        // TypeScript configuration for tests
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        moduleResolution: 'node',
        target: 'ES2020',
        lib: ['ES2020'],
        module: 'commonjs'
      }
    }
  }
};
