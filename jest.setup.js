// Jest setup file for global test configuration

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock next/config
jest.mock('next/config', () => () => ({
  publicRuntimeConfig: {
    staticFolder: '/static',
  },
}));

// Suppress console logs during tests unless in debug mode
if (process.env.NODE_ENV === 'test' && !process.env.DEBUG) {
  global.console = {
    ...console,
    // Uncomment to hide specific console methods during tests
    // log: jest.fn(),
    // debug: jest.fn(),
    // info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.MONGODB_URI = 'mongodb://localhost:27017/site-scanner-test';
process.env.SCANNER_SERVICE_URL = 'http://localhost:8000';

// Extend Jest expect for additional matchers
import '@testing-library/jest-dom';

// Mock console methods for cleaner test output
beforeEach(() => {
  jest.clearAllMocks();
});

// Global test cleanup
afterEach(() => {
  jest.restoreAllMocks();
});
